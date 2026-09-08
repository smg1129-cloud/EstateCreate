'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { recordAudit } from '@/lib/audit'

const licenseSchema = z.object({
  providerId: z.string().min(1),
  state: z.string().length(2),
  licenseNumber: z.string().min(1).max(50),
  issuedAt: z.string().min(1),
  expiresAt: z.string().min(1),
})

export async function addProviderLicense(formData: FormData) {
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.role !== 'ADMIN') throw new Error('Unauthorized')

  const parsed = licenseSchema.parse({
    providerId: formData.get('providerId'),
    state: (formData.get('state') as string)?.toUpperCase(),
    licenseNumber: formData.get('licenseNumber'),
    issuedAt: formData.get('issuedAt'),
    expiresAt: formData.get('expiresAt'),
  })

  const license = await db.providerLicense.create({
    data: {
      providerId: parsed.providerId,
      state: parsed.state,
      licenseNumber: parsed.licenseNumber,
      issuedAt: new Date(parsed.issuedAt),
      expiresAt: new Date(parsed.expiresAt),
    },
  })

  await recordAudit({
    actorId: session.user.id,
    action: 'CREATE',
    entityType: 'ProviderLicense',
    entityId: license.id,
    metadata: { state: parsed.state },
  })
  revalidatePath('/admin/licenses')
}

export async function setLicenseStatus(licenseId: string, status: 'ACTIVE' | 'SUSPENDED' | 'EXPIRED') {
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.role !== 'ADMIN') throw new Error('Unauthorized')

  await db.providerLicense.update({ where: { id: licenseId }, data: { status } })
  await recordAudit({
    actorId: session.user.id,
    action: 'UPDATE',
    entityType: 'ProviderLicense',
    entityId: licenseId,
    metadata: { status },
  })
  revalidatePath('/admin/licenses')
}
