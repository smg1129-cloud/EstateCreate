'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { recordAudit } from '@/lib/audit'

const profileSchema = z.object({
  phone: z.string().max(30).optional(),
  addressLine1: z.string().max(200).optional(),
  city: z.string().max(100).optional(),
  postalCode: z.string().max(20).optional(),
  emergencyContactName: z.string().max(200).optional(),
  emergencyContactPhone: z.string().max(30).optional(),
})

export async function updateProfile(formData: FormData) {
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.role !== 'PATIENT') throw new Error('Unauthorized')

  const parsed = profileSchema.parse({
    phone: formData.get('phone') || undefined,
    addressLine1: formData.get('addressLine1') || undefined,
    city: formData.get('city') || undefined,
    postalCode: formData.get('postalCode') || undefined,
    emergencyContactName: formData.get('emergencyContactName') || undefined,
    emergencyContactPhone: formData.get('emergencyContactPhone') || undefined,
  })

  const patient = await db.patient.findUnique({ where: { userId: session.user.id } })
  if (!patient) throw new Error('Patient record not found')

  await db.$transaction([
    db.user.update({ where: { id: session.user.id }, data: { phone: parsed.phone } }),
    db.patient.update({
      where: { id: patient.id },
      data: {
        addressLine1: parsed.addressLine1,
        city: parsed.city,
        postalCode: parsed.postalCode,
        emergencyContactName: parsed.emergencyContactName,
        emergencyContactPhone: parsed.emergencyContactPhone,
      },
    }),
  ])

  await recordAudit({ actorId: session.user.id, action: 'UPDATE', entityType: 'Patient', entityId: patient.id })
  revalidatePath('/portal/profile')
}
