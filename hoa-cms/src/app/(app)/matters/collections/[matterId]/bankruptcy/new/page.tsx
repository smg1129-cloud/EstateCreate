import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { requireActor } from '@/lib/session'
import { canEditClientsAndMatters, ForbiddenError } from '@/lib/rbac'
import { addBankruptcyMatter } from '../../../actions'

const INPUT = 'mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500'
const LABEL = 'block text-sm font-medium text-slate-700'

export default async function NewBankruptcyMatterPage({ params }: { params: Promise<{ matterId: string }> }) {
  const actor = await requireActor()
  if (!canEditClientsAndMatters(actor)) throw new ForbiddenError()

  const { matterId } = await params
  const matter = await db.matter.findFirst({ where: { id: matterId, organizationId: actor.organizationId } })
  if (!matter) notFound()

  const action = addBankruptcyMatter.bind(null, matterId)

  return (
    <div>
      <h1 className="text-xl font-semibold text-slate-900">Add Bankruptcy Matter</h1>
      <p className="mt-1 text-sm text-slate-500">Ancillary to {matter.matterNumber} — {matter.title}</p>

      <form action={action} className="mt-6 max-w-md space-y-4">
        <div>
          <label className={LABEL} htmlFor="caseNumber">Case number</label>
          <input id="caseNumber" name="caseNumber" required className={INPUT} />
        </div>
        <div>
          <label className={LABEL} htmlFor="chapter">Chapter</label>
          <select id="chapter" name="chapter" required defaultValue="CHAPTER_13" className={INPUT}>
            <option value="CHAPTER_7">Chapter 7</option>
            <option value="CHAPTER_11">Chapter 11</option>
            <option value="CHAPTER_13">Chapter 13</option>
          </select>
        </div>
        <div>
          <label className={LABEL} htmlFor="trusteeName">Trustee</label>
          <input id="trusteeName" name="trusteeName" className={INPUT} />
        </div>
        <div>
          <label className={LABEL} htmlFor="court">Court</label>
          <input id="court" name="court" className={INPUT} />
        </div>
        <div>
          <label className={LABEL} htmlFor="filedDate">Filed date</label>
          <input id="filedDate" name="filedDate" type="date" required className={INPUT} />
        </div>
        <button type="submit" className="rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700">
          Add bankruptcy matter
        </button>
      </form>
    </div>
  )
}
