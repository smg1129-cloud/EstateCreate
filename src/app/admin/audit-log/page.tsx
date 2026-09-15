import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/session'
import { requireRole } from '@/lib/rbac'
import { db } from '@/lib/db'

export default async function AuditLogPage() {
  const actor = await getCurrentUser()
  if (!actor) redirect('/login')
  requireRole(actor, ['ADMIN'])

  // Scope to actors within this organization.
  const orgUserIds = (
    await db.user.findMany({ where: { organizationId: actor.organizationId }, select: { id: true } })
  ).map((u) => u.id)

  const logs = await db.auditLog.findMany({
    where: { actorId: { in: orgUserIds } },
    include: { actor: { select: { firstName: true, lastName: true, role: true } } },
    orderBy: { createdAt: 'desc' },
    take: 200,
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Audit log</h1>
        <p className="text-sm text-gray-500">Append-only record of access and actions. Showing the 200 most recent events.</p>
      </div>
      <div className="overflow-hidden rounded-lg border border-gray-100 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-4 py-3">When</th>
              <th className="px-4 py-3">Actor</th>
              <th className="px-4 py-3">Action</th>
              <th className="px-4 py-3">Entity</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {logs.map((l) => (
              <tr key={l.id}>
                <td className="px-4 py-2 text-gray-500">{new Date(l.createdAt).toLocaleString()}</td>
                <td className="px-4 py-2 text-gray-800">
                  {l.actor.firstName} {l.actor.lastName} <span className="text-xs text-gray-400">({l.actor.role})</span>
                </td>
                <td className="px-4 py-2 font-medium text-gray-700">{l.action}</td>
                <td className="px-4 py-2 text-gray-500">
                  {l.entityType}
                  {l.entityId ? <span className="text-xs text-gray-400"> · {l.entityId.slice(0, 8)}</span> : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
