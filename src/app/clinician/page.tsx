import Link from 'next/link'
import { db } from '@/lib/db'
import { getCurrentProviderOrRedirect } from '@/lib/currentProvider'

export default async function ClinicianTodayPage() {
  const { provider } = await getCurrentProviderOrRedirect()

  const startOfDay = new Date()
  startOfDay.setHours(0, 0, 0, 0)
  const endOfDay = new Date(startOfDay)
  endOfDay.setDate(endOfDay.getDate() + 1)

  const appointments = await db.appointment.findMany({
    where: { providerId: provider.id, scheduledAt: { gte: startOfDay, lt: endOfDay } },
    orderBy: { scheduledAt: 'asc' },
    include: { patient: { include: { user: true } } },
  })

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900">Today&apos;s schedule</h1>
      <ul className="mt-6 space-y-3">
        {appointments.map((a) => (
          <li key={a.id} className="flex items-center justify-between rounded-lg border border-gray-200 p-4">
            <div>
              <p className="font-medium text-gray-900">
                {new Date(a.scheduledAt).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })} —{' '}
                {a.patient.user.firstName} {a.patient.user.lastName}
              </p>
              <p className="text-sm text-gray-500">{a.reasonForVisit ?? 'No reason provided'} &middot; {a.status}</p>
            </div>
            <div className="flex gap-2">
              <Link href={`/clinician/chart/${a.patientId}`} className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
                Chart
              </Link>
              <Link
                href={`/clinician/visit/${a.id}`}
                className="rounded-md bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-700"
              >
                Start visit
              </Link>
            </div>
          </li>
        ))}
        {appointments.length === 0 && <p className="text-sm text-gray-500">Nothing scheduled today.</p>}
      </ul>
    </div>
  )
}
