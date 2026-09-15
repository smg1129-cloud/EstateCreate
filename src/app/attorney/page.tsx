import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/session'
import { requireRole } from '@/lib/rbac'
import { db } from '@/lib/db'
import { MATTER_STATUS_LABEL } from '@/lib/matters/display'

export default async function AttorneyQueue() {
  const actor = await getCurrentUser()
  if (!actor) redirect('/login')
  requireRole(actor, ['ATTORNEY', 'PARALEGAL', 'ADMIN'])

  const matters = await db.estateMatter.findMany({
    where: {
      organizationId: actor.organizationId,
      status: { in: ['IN_REVIEW', 'CHANGES_REQUESTED', 'APPROVED', 'EXECUTION'] },
    },
    include: {
      client: { select: { firstName: true, lastName: true, email: true } },
      documents: { where: { status: { not: 'SUPERSEDED' } }, select: { status: true } },
    },
    orderBy: { updatedAt: 'desc' },
  })

  const needsReview = matters.filter((m) => m.status === 'IN_REVIEW')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Review queue</h1>
        <p className="text-sm text-gray-500">
          {needsReview.length} matter{needsReview.length === 1 ? '' : 's'} awaiting review
        </p>
      </div>

      {matters.length === 0 ? (
        <div className="rounded-lg border border-gray-100 bg-white p-6 text-gray-600">Nothing in the queue right now.</div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-100 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3">Client</th>
                <th className="px-4 py-3">Matter</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Documents</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {matters.map((m) => {
                const pending = m.documents.filter((d) => d.status === 'IN_REVIEW').length
                return (
                  <tr key={m.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">
                        {m.client.firstName} {m.client.lastName}
                      </div>
                      <div className="text-xs text-gray-500">{m.client.email}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{m.reference}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
                        {MATTER_STATUS_LABEL[m.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {m.documents.length} total{pending > 0 && <span className="ml-1 text-amber-700">· {pending} to review</span>}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/attorney/matters/${m.id}`} className="font-medium text-brand-700 hover:underline">
                        Open →
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
