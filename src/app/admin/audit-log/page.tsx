import { db } from '@/lib/db'

export default async function AdminAuditLogPage() {
  const entries = await db.auditLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 200,
    include: { actor: true },
  })

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900">Audit log</h1>
      <p className="mt-1 text-sm text-gray-500">
        Append-only record of authentication events and PHI access/mutation (HIPAA Security Rule
        §164.312(b)). Most recent 200 events.
      </p>

      <table className="mt-6 w-full text-left text-xs">
        <thead className="border-b border-gray-200 uppercase text-gray-500">
          <tr>
            <th className="py-2 pr-4">Time</th>
            <th className="py-2 pr-4">Actor</th>
            <th className="py-2 pr-4">Action</th>
            <th className="py-2 pr-4">Entity</th>
            <th className="py-2 pr-4">IP</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {entries.map((e) => (
            <tr key={e.id}>
              <td className="py-1.5 pr-4 whitespace-nowrap text-gray-600">{new Date(e.createdAt).toLocaleString()}</td>
              <td className="py-1.5 pr-4 text-gray-800">
                {e.actor.firstName} {e.actor.lastName}
              </td>
              <td className="py-1.5 pr-4 text-gray-800">{e.action}</td>
              <td className="py-1.5 pr-4 text-gray-600">
                {e.entityType}
                {e.entityId ? `#${e.entityId.slice(0, 8)}` : ''}
              </td>
              <td className="py-1.5 pr-4 text-gray-400">{e.ipAddress ?? '—'}</td>
            </tr>
          ))}
          {entries.length === 0 && (
            <tr>
              <td colSpan={5} className="py-4 text-gray-400">
                No audit events yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
