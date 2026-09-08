import Link from 'next/link'
import { db } from '@/lib/db'
import { requireActor } from '@/lib/session'
import { canViewClientsAndMatters, ForbiddenError } from '@/lib/rbac'
import { StatusBadge } from '@/components/StatusBadge'
import type { PracticeArea, MatterStatus } from '@prisma/client'

export default async function MattersPage({
  searchParams,
}: {
  searchParams: Promise<{ practiceArea?: string; status?: string }>
}) {
  const actor = await requireActor()
  if (!canViewClientsAndMatters(actor)) throw new ForbiddenError()

  const { practiceArea, status } = await searchParams

  const matters = await db.matter.findMany({
    where: {
      organizationId: actor.organizationId,
      practiceArea: practiceArea ? (practiceArea as PracticeArea) : undefined,
      status: status ? (status as MatterStatus) : undefined,
    },
    orderBy: { openedDate: 'desc' },
    take: 200,
    include: { client: true, responsibleAttorney: true },
  })

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-900">Matters</h1>
        <Link
          href="/matters/collections/new"
          className="rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700"
        >
          New Collections Matter
        </Link>
      </div>

      <form method="GET" className="mt-4 flex items-end gap-3">
        <select name="practiceArea" defaultValue={practiceArea ?? ''} className="rounded-md border border-slate-300 px-3 py-1.5 text-sm">
          <option value="">All practice areas</option>
          <option value="COLLECTIONS">Collections</option>
          <option value="COVENANT_ENFORCEMENT">Covenant Enforcement</option>
          <option value="GENERAL_CORPORATE">General Corporate</option>
          <option value="GENERAL_LITIGATION">General Litigation</option>
          <option value="CLAIMS_MONITORING">Claims Monitoring</option>
        </select>
        <select name="status" defaultValue={status ?? ''} className="rounded-md border border-slate-300 px-3 py-1.5 text-sm">
          <option value="">All statuses</option>
          <option value="OPEN">Open</option>
          <option value="ON_HOLD">On hold</option>
          <option value="CLOSED">Closed</option>
        </select>
        <button type="submit" className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50">
          Filter
        </button>
      </form>

      <div className="mt-4 overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-2">Matter #</th>
              <th className="px-4 py-2">Client</th>
              <th className="px-4 py-2">Title</th>
              <th className="px-4 py-2">Practice area</th>
              <th className="px-4 py-2">Attorney</th>
              <th className="px-4 py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {matters.map((m) => (
              <tr key={m.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                <td className="px-4 py-2 font-mono text-xs">
                  <Link href={`/matters/${m.id}`} className="text-brand-700 hover:underline">
                    {m.matterNumber}
                  </Link>
                </td>
                <td className="px-4 py-2">
                  <Link href={`/clients/${m.clientId}`} className="text-slate-700 hover:text-brand-700">
                    {m.client.name}
                  </Link>
                </td>
                <td className="px-4 py-2 text-slate-600">{m.title}</td>
                <td className="px-4 py-2 text-slate-600">{m.practiceArea.replaceAll('_', ' ')}</td>
                <td className="px-4 py-2 text-slate-600">
                  {m.responsibleAttorney.firstName} {m.responsibleAttorney.lastName}
                </td>
                <td className="px-4 py-2">
                  <StatusBadge status={m.status} />
                </td>
              </tr>
            ))}
            {matters.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                  No matters found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
