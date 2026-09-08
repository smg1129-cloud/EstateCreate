'use server'

import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { recordAudit } from '@/lib/audit'

export async function completeVisit(formData: FormData) {
  const appointmentId = String(formData.get('appointmentId'))
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.role !== 'CLINICIAN') throw new Error('Unauthorized')

  const provider = await db.provider.findUniqueOrThrow({ where: { userId: session.user.id } })
  const appointment = await db.appointment.updateMany({
    where: { id: appointmentId, providerId: provider.id },
    data: { status: 'COMPLETED' },
  })
  if (appointment.count === 0) throw new Error('Appointment not found')

  await recordAudit({ actorId: session.user.id, action: 'UPDATE', entityType: 'Appointment', entityId: appointmentId, metadata: { status: 'COMPLETED' } })

  const full = await db.appointment.findUniqueOrThrow({ where: { id: appointmentId } })
  redirect(`/clinician/chart/${full.patientId}`)
}
