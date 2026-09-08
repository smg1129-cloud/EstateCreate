import Link from 'next/link'
import { db } from '@/lib/db'
import { getCurrentProviderOrRedirect } from '@/lib/currentProvider'

export default async function ClinicianSchedulePage() {
  const { provider } = await getCurrentProviderOrRedirect()

  const appointments = await db.appointment.findMany({
    where: { providerId: provider.id },
    orderBy: { scheduledAt: 'desc' },
    include: { patient: { include: { user: true } } },
  })

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900">Full schedule</h1>
      <table className="mt-6 w-full text-left text-sm">
        <thead className="border-b border-gray-200 text-xs uppercase text-gray-500">
          <tr>
            <th className="py-2">When</th>
            <th className="py-2">Patient</th>
            <th className="py-2">Status</th>
            <th className="py-2" />
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {appointments.map((a) => (
            <tr key={a.id}>
              <td className="py-2">{new Date(a.scheduledAt).toLocaleString()}</td>
              <td className="py-2">
                {a.patient.user.firstName} {a.patient.user.lastName}
              </td>
              <td className="py-2">{a.status}</td>
              <td className="py-2">
                <Link href={`/clinician/chart/${a.patientId}`} className="text-brand-700 underline">
                  Chart
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
