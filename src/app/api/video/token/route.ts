import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { getVideoProvider } from '@/lib/video'
import { recordAudit } from '@/lib/audit'

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { appointmentId } = (await req.json()) as { appointmentId?: string }
  if (!appointmentId) return NextResponse.json({ error: 'appointmentId is required' }, { status: 400 })

  const appointment = await db.appointment.findUnique({
    where: { id: appointmentId },
    include: { patient: true, provider: true },
  })
  if (!appointment) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Only the two participants in this specific visit may fetch a token for
  // its room — not any patient, not any clinician.
  const isPatientParticipant = session.user.role === 'PATIENT' && appointment.patient.userId === session.user.id
  const isProviderParticipant = session.user.role === 'CLINICIAN' && appointment.provider.userId === session.user.id
  if (!isPatientParticipant && !isProviderParticipant) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const videoProvider = getVideoProvider()
  const { roomRef, url } = await videoProvider.ensureRoom(appointment.id)
  const token = await videoProvider.generateToken(roomRef, session.user.id)

  if (appointment.videoRoomRef !== roomRef) {
    await db.appointment.update({ where: { id: appointment.id }, data: { videoRoomRef: roomRef } })
  }

  await recordAudit({
    actorId: session.user.id,
    action: 'VIEW',
    entityType: 'Appointment',
    entityId: appointment.id,
    metadata: { via: 'video-token' },
  })

  return NextResponse.json({
    provider: process.env.VIDEO_PROVIDER ?? 'mock',
    roomRef,
    url,
    token,
  })
}
