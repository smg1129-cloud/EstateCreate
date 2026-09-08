import Link from 'next/link'
import { db } from '@/lib/db'
import { requireActor } from '@/lib/session'
import { canViewAuditLog, ForbiddenError } from '@/lib/rbac'

const PAGE_SIZE = 50

export default async function AuditLogPage({
  searchParams,
}: {
  searchParams: Promise<{ cursor?: string; entityType?: string; action?: string }>
}) {
  const actor = await requireActor()
  if (!canViewAuditLog(actor)) throw new ForbiddenError()

  const { cursor, entityType, action } = await searchParams

  // Keyset pagination via Prisma's cursor API (id is unique, createdAt is
  // the sort key) — no OFFSET, so this stays fast as the table grows into
  // the hundreds of thousands of rows this firm's scale implies.
  const rows = await db.auditLog.findMany({
    where: {
      organizationId: actor.organizationId,
      entityType: entityType || undefined,
      action: action || undefined,
    },
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    take: PAGE_SIZE + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    include: { actor: true },
  })

  const hasMore = rows.length > PAGE_SIZE
  const page = rows.slice(0, PAGE_SIZE)
  const nextCursor = hasMore ? page[page.length - 1].id : null

  const entityTypes = ['Client', 'Matter', 'CollectionsMatterDetail', 'OwnerLedgerEntry', 'LedgerEntry', 'Document', 'Note', 'CertifiedMailing', 'User']
  const actions = ['LOGIN', 'LOGIN_FAILED', 'LOGOUT', 'VIEW', 'CREATE', 'UPDATE', 'STATUS_TRANSITION', 'DOWNLOAD']

  return (
    <div>
      <h1 className="text-xl font-semibold text-slate-900">Audit Log</h1>

      <form method="GET" className="mt-4 flex items-end gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-700">Entity type</label>
          <select name="entityType" defaultValue={entityType ?? ''} className="mt-1 rounded-md border border-slate-300 px-3 py-1.5 text-sm">
            <option value="">All</option>
            {entityTypes.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-700">Action</label>
          <select name="action" defaultValue={action ?? ''} className="mt-1 rounded-md border border-slate-300 px-3 py-1.5 text-sm">
            <option value="">All</option>
            {actions.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>
        <button type="submit" className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50">
          Filter
        </button>
      </form>

      <div className="mt-4 overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-2">When</th>
              <th className="px-4 py-2">Actor</th>
              <th className="px-4 py-2">Action</th>
              <th className="px-4 py-2">Entity</th>
              <th className="px-4 py-2">Entity ID</th>
            </tr>
          </thead>
          <tbody>
            {page.map((row) => (
              <tr key={row.id} className="border-b border-slate-100 last:border-0">
                <td className="px-4 py-2 whitespace-nowrap text-slate-600">{row.createdAt.toLocaleString()}</td>
                <td className="px-4 py-2 text-slate-600">
                  {row.actor.firstName} {row.actor.lastName}
                </td>
                <td className="px-4 py-2 text-slate-900">{row.action}</td>
                <td className="px-4 py-2 text-slate-600">{row.entityType}</td>
                <td className="px-4 py-2 font-mono text-xs text-slate-400">{row.entityId ?? '—'}</td>
              </tr>
            ))}
            {page.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                  No audit log entries match these filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {nextCursor && (
        <div className="mt-4">
          <Link
            href={`/admin/audit-log?cursor=${nextCursor}${entityType ? `&entityType=${entityType}` : ''}${action ? `&action=${action}` : ''}`}
            className="text-sm text-brand-700 hover:underline"
          >
            Next page →
          </Link>
        </div>
      )}
    </div>
  )
}
