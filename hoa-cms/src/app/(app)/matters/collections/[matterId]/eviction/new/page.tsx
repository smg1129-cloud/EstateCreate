import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { requireActor } from '@/lib/session'
import { canEditClientsAndMatters, ForbiddenError } from '@/lib/rbac'
import { addEvictionMatter } from '../../../actions'

const INPUT = 'mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500'
const LABEL = 'block text-sm font-medium text-slate-700'

export default async function NewEvictionMatterPage({ params }: { params: Promise<{ matterId: string }> }) {
  const actor = await requireActor()
  if (!canEditClientsAndMatters(actor)) throw new ForbiddenError()

  const { matterId } = await params
  const matter = await db.matter.findFirst({ where: { id: matterId, organizationId: actor.organizationId } })
  if (!matter) notFound()

  const action = addEvictionMatter.bind(null, matterId)

  return (
    <div>
      <h1 className="text-xl font-semibold text-slate-900">Add Eviction Matter</h1>
      <p className="mt-1 text-sm text-slate-500">Ancillary to {matter.matterNumber} — {matter.title}</p>

      <form action={action} className="mt-6 max-w-md space-y-4">
        <div>
          <label className={LABEL} htmlFor="caseNumber">Case number</label>
          <input id="caseNumber" name="caseNumber" required className={INPUT} />
        </div>
        <div>
          <label className={LABEL} htmlFor="court">Court</label>
          <input id="court" name="court" className={INPUT} />
        </div>
        <div>
          <label className={LABEL} htmlFor="filedDate">Filed date</label>
          <input id="filedDate" name="filedDate" type="date" required className={INPUT} />
        </div>
        <div>
          <label className={LABEL} htmlFor="hearingDate">Hearing date</label>
          <input id="hearingDate" name="hearingDate" type="date" className={INPUT} />
        </div>
        <button type="submit" className="rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700">
          Add eviction matter
        </button>
      </form>
    </div>
  )
}
