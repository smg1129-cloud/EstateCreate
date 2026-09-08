import Link from 'next/link'
import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { getCurrentProviderOrRedirect } from '@/lib/currentProvider'
import { VideoRoom } from '@/components/VideoRoom'
import { completeVisit } from './actions'

export default async function ClinicianVisitPage({ params }: { params: { appointmentId: string } }) {
  const { provider } = await getCurrentProviderOrRedirect()

  const appointment = await db.appointment.findUnique({
    where: { id: params.appointmentId },
    include: { patient: { include: { user: true } } },
  })
  if (!appointment || appointment.providerId !== provider.id) notFound()

  return (
    <div className="max-w-3xl">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">
            Visit with {appointment.patient.user.firstName} {appointment.patient.user.lastName}
          </h1>
          <p className="text-sm text-gray-500">{new Date(appointment.scheduledAt).toLocaleString()}</p>
        </div>
        <Link href={`/clinician/chart/${appointment.patientId}`} className="text-sm text-brand-700 underline">
          Open chart
        </Link>
      </div>

      <VideoRoom appointmentId={appointment.id} />

      <form action={completeVisit} className="mt-4">
        <input type="hidden" name="appointmentId" value={appointment.id} />
        <button className="rounded-md bg-gray-800 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700">
          End visit &amp; mark complete
        </button>
      </form>
    </div>
  )
}
