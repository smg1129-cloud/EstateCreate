import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { getCurrentPatientOrRedirect } from '@/lib/currentPatient'
import { VideoRoom } from '@/components/VideoRoom'

export default async function PortalVisitPage({ params }: { params: { appointmentId: string } }) {
  const { patient } = await getCurrentPatientOrRedirect()

  const appointment = await db.appointment.findUnique({
    where: { id: params.appointmentId },
    include: { provider: { include: { user: true } } },
  })
  if (!appointment || appointment.patientId !== patient.id) notFound()

  return (
    <div className="max-w-3xl">
      <div className="mb-4">
        <h1 className="text-xl font-semibold text-gray-900">
          Visit with {appointment.provider.user.firstName} {appointment.provider.user.lastName}
        </h1>
        <p className="text-sm text-gray-500">{new Date(appointment.scheduledAt).toLocaleString()}</p>
      </div>

      <VideoRoom appointmentId={appointment.id} />

      <p className="mt-4 text-xs text-gray-400">
        If you lose connection, refresh this page to rejoin. For emergencies, call 911.
      </p>
    </div>
  )
}
