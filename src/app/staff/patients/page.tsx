import { db } from '@/lib/db'

// Staff (CRM) view intentionally excludes clinical fields — no diagnoses,
// notes, medications, or documents. That's the ERM's domain, scoped to
// clinicians in src/lib/rbac.ts. Staff only see what's needed to run
// scheduling/administrative operations.
export default async function StaffPatientsPage() {
  const patients = await db.patient.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      user: true,
      appointments: { orderBy: { scheduledAt: 'desc' }, take: 1 },
    },
  })

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900">Patient directory</h1>
      <p className="mt-1 text-sm text-gray-500">
        Administrative info only. Clinical records are available to treating clinicians in their portal.
      </p>

      <table className="mt-6 w-full text-left text-sm">
        <thead className="border-b border-gray-200 text-xs uppercase text-gray-500">
          <tr>
            <th className="py-2">Name</th>
            <th className="py-2">Contact</th>
            <th className="py-2">State</th>
            <th className="py-2">Last appointment</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {patients.map((p) => (
            <tr key={p.id}>
              <td className="py-2 font-medium text-gray-900">
                {p.user.firstName} {p.user.lastName}
              </td>
              <td className="py-2 text-gray-600">{p.user.email}</td>
              <td className="py-2 text-gray-600">{p.state}</td>
              <td className="py-2 text-gray-600">
                {p.appointments[0] ? new Date(p.appointments[0].scheduledAt).toLocaleDateString() : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
