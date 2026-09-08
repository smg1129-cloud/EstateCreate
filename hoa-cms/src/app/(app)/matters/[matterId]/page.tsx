import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { db } from '@/lib/db'
import { requireActor } from '@/lib/session'
import { canViewClientsAndMatters, ForbiddenError } from '@/lib/rbac'
import { StatusBadge } from '@/components/StatusBadge'

/// Generic fallback detail view — used for ancillary matters (Bankruptcy,
/// Eviction) and any future practice area that doesn't yet have a
/// dedicated detail route. Collections matters redirect to their
/// purpose-built pipeline UI at /matters/collections/[matterId].
export default async function MatterDetailPage({ params }: { params: Promise<{ matterId: string }> }) {
  const actor = await requireActor()
  if (!canViewClientsAndMatters(actor)) throw new ForbiddenError()

  const { matterId } = await params
  const matter = await db.matter.findFirst({
    where: { id: matterId, organizationId: actor.organizationId },
    include: {
      client: true,
      responsibleAttorney: true,
      assignedParalegal: true,
      bankruptcyDetail: true,
      evictionDetail: true,
      parentMatter: true,
    },
  })
  if (!matter) notFound()

  if (matter.practiceArea === 'COLLECTIONS') redirect(`/matters/collections/${matter.id}`)

  return (
    <div>
      <div className="flex items-center gap-2">
        <h1 className="text-xl font-semibold text-slate-900">{matter.title}</h1>
        <StatusBadge status={matter.status} />
      </div>
      <p className="mt-1 text-sm text-slate-500">
        {matter.matterNumber} ·{' '}
        <Link href={`/clients/${matter.clientId}`} className="text-brand-700 hover:underline">
          {matter.client.name}
        </Link>
        {matter.parentMatter && (
          <>
            {' '}
            · ancillary to{' '}
            <Link href={`/matters/${matter.parentMatter.id}`} className="text-brand-700 hover:underline">
              {matter.parentMatter.matterNumber}
            </Link>
          </>
        )}
      </p>

      <dl className="mt-6 grid max-w-xl grid-cols-2 gap-x-6 gap-y-3 text-sm">
        <dt className="text-slate-500">Responsible attorney</dt>
        <dd className="text-slate-900">
          {matter.responsibleAttorney.firstName} {matter.responsibleAttorney.lastName}
        </dd>
        <dt className="text-slate-500">Opened</dt>
        <dd className="text-slate-900">{matter.openedDate.toLocaleDateString()}</dd>

        {matter.bankruptcyDetail && (
          <>
            <dt className="text-slate-500">BK case number</dt>
            <dd className="text-slate-900">{matter.bankruptcyDetail.caseNumber}</dd>
            <dt className="text-slate-500">Chapter</dt>
            <dd className="text-slate-900">{matter.bankruptcyDetail.chapter.replace('CHAPTER_', 'Chapter ')}</dd>
            <dt className="text-slate-500">Stay status</dt>
            <dd className="text-slate-900">{matter.bankruptcyDetail.stayStatus}</dd>
          </>
        )}

        {matter.evictionDetail && (
          <>
            <dt className="text-slate-500">Eviction case number</dt>
            <dd className="text-slate-900">{matter.evictionDetail.caseNumber}</dd>
            <dt className="text-slate-500">Status</dt>
            <dd className="text-slate-900">{matter.evictionDetail.status.replaceAll('_', ' ')}</dd>
          </>
        )}
      </dl>
    </div>
  )
}
