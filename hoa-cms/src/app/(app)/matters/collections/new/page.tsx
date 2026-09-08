import { requireActor } from '@/lib/session'
import { canEditClientsAndMatters, ForbiddenError } from '@/lib/rbac'
import { db } from '@/lib/db'
import { createCollectionsMatter } from '../actions'

const INPUT = 'mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500'
const LABEL = 'block text-sm font-medium text-slate-700'

export default async function NewCollectionsMatterPage({
  searchParams,
}: {
  searchParams: Promise<{ clientId?: string }>
}) {
  const actor = await requireActor()
  if (!canEditClientsAndMatters(actor)) throw new ForbiddenError()

  const { clientId } = await searchParams

  const [clients, attorneys, paralegals] = await Promise.all([
    db.client.findMany({
      where: { organizationId: actor.organizationId, status: 'ACTIVE' },
      orderBy: { name: 'asc' },
    }),
    db.user.findMany({ where: { organizationId: actor.organizationId, role: 'ATTORNEY', status: 'ACTIVE' } }),
    db.user.findMany({ where: { organizationId: actor.organizationId, role: 'PARALEGAL', status: 'ACTIVE' } }),
  ])

  return (
    <div>
      <h1 className="text-xl font-semibold text-slate-900">New Collections/Foreclosure Matter</h1>

      <form action={createCollectionsMatter} className="mt-6 max-w-xl space-y-4">
        <div>
          <label className={LABEL} htmlFor="clientId">Client</label>
          <select id="clientId" name="clientId" required defaultValue={clientId ?? ''} className={INPUT}>
            <option value="" disabled>Select a client...</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.clientNumber})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={LABEL} htmlFor="title">Matter title</label>
          <input id="title" name="title" required placeholder="e.g. Assessment Collection — Unit 204" className={INPUT} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={LABEL} htmlFor="responsibleAttorneyId">Responsible attorney</label>
            <select id="responsibleAttorneyId" name="responsibleAttorneyId" required defaultValue="" className={INPUT}>
              <option value="" disabled>Select...</option>
              {attorneys.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.firstName} {a.lastName}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={LABEL} htmlFor="assignedParalegalId">Assigned paralegal</label>
            <select id="assignedParalegalId" name="assignedParalegalId" className={INPUT}>
              <option value="">None</option>
              {paralegals.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.firstName} {p.lastName}
                </option>
              ))}
            </select>
          </div>
        </div>

        <fieldset className="rounded-md border border-slate-200 p-4">
          <legend className="px-1 text-sm font-medium text-slate-700">Delinquent unit</legend>
          <div className="space-y-3">
            <div>
              <label className={LABEL} htmlFor="unitAddressLine1">Address line 1</label>
              <input id="unitAddressLine1" name="unitAddressLine1" required className={INPUT} />
            </div>
            <div>
              <label className={LABEL} htmlFor="unitAddressLine2">Address line 2</label>
              <input id="unitAddressLine2" name="unitAddressLine2" className={INPUT} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={LABEL} htmlFor="unitCity">City</label>
                <input id="unitCity" name="unitCity" required className={INPUT} />
              </div>
              <div>
                <label className={LABEL} htmlFor="unitPostalCode">ZIP</label>
                <input id="unitPostalCode" name="unitPostalCode" required className={INPUT} />
              </div>
            </div>
          </div>
        </fieldset>

        <fieldset className="rounded-md border border-slate-200 p-4">
          <legend className="px-1 text-sm font-medium text-slate-700">Owner</legend>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={LABEL} htmlFor="ownerFirstName">First name</label>
              <input id="ownerFirstName" name="ownerFirstName" required className={INPUT} />
            </div>
            <div>
              <label className={LABEL} htmlFor="ownerLastName">Last name</label>
              <input id="ownerLastName" name="ownerLastName" required className={INPUT} />
            </div>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-4">
            <div>
              <label className={LABEL} htmlFor="ownerEmail">Email</label>
              <input id="ownerEmail" name="ownerEmail" type="email" className={INPUT} />
            </div>
            <div>
              <label className={LABEL} htmlFor="ownerPhone">Phone</label>
              <input id="ownerPhone" name="ownerPhone" className={INPUT} />
            </div>
          </div>
        </fieldset>

        <button type="submit" className="rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700">
          Create matter
        </button>
      </form>
    </div>
  )
}
