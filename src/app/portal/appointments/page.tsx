import Link from 'next/link'
import { db } from '@/lib/db'
import { getCurrentPatientOrRedirect } from '@/lib/currentPatient'

export default async function PortalAppointmentsPage() {
  const { patient } = await getCurrentPatientOrRedirect()

  const appointments = await db.appointment.findMany({
    where: { patientId: patient.id },
    orderBy: { scheduledAt: 'desc' },
    include: { provider: { include: { user: true } } },
  })

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-semibold text-gray-900">Appointments</h1>
      <ul className="mt-6 space-y-3">
        {appointments.map((a) => {
          const isUpcoming = a.scheduledAt > new Date() && a.status !== 'CANCELLED'
          return (
            <li key={a.id} className="flex items-center justify-between rounded-lg border border-gray-200 p-4">
              <div>
                <p className="font-medium text-gray-900">
                  {new Date(a.scheduledAt).toLocaleString(undefined, {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </p>
                <p className="text-sm text-gray-600">
                  {a.provider.user.firstName} {a.provider.user.lastName} &middot; {a.visitType} &middot; {a.status}
                </p>
              </div>
              {isUpcoming && (
                <Link
                  href={`/portal/visit/${a.id}`}
                  className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
                >
                  Join visit
                </Link>
              )}
            </li>
          )
        })}
        {appointments.length === 0 && <p className="text-sm text-gray-500">No appointments yet.</p>}
      </ul>
    </div>
  )
}
