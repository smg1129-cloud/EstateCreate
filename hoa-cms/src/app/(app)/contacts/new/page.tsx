import { requireActor } from '@/lib/session'
import { canEditContacts, ForbiddenError } from '@/lib/rbac'
import { db } from '@/lib/db'
import { createContact } from '../actions'

const INPUT = 'mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500'
const LABEL = 'block text-sm font-medium text-slate-700'

export default async function NewContactPage({
  searchParams,
}: {
  searchParams: Promise<{ clientId?: string }>
}) {
  const actor = await requireActor()
  if (!canEditContacts(actor)) throw new ForbiddenError()

  const { clientId } = await searchParams
  const client = clientId
    ? await db.client.findFirst({ where: { id: clientId, organizationId: actor.organizationId } })
    : null

  return (
    <div>
      <h1 className="text-xl font-semibold text-slate-900">New Contact</h1>
      {client && <p className="mt-1 text-sm text-slate-500">Linking to {client.name}</p>}

      <form action={createContact} className="mt-6 max-w-xl space-y-4">
        {client && <input type="hidden" name="linkClientId" value={client.id} />}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={LABEL} htmlFor="firstName">First name</label>
            <input id="firstName" name="firstName" required className={INPUT} />
          </div>
          <div>
            <label className={LABEL} htmlFor="lastName">Last name</label>
            <input id="lastName" name="lastName" required className={INPUT} />
          </div>
        </div>

        <div>
          <label className={LABEL} htmlFor="contactType">Type</label>
          <select id="contactType" name="contactType" className={INPUT} defaultValue="BOARD_MEMBER">
            <option value="BOARD_MEMBER">Board Member</option>
            <option value="PROPERTY_MANAGER">Property Manager</option>
            <option value="UNIT_OWNER">Unit Owner</option>
            <option value="OPPOSING_COUNSEL">Opposing Counsel</option>
            <option value="JUDGE">Judge</option>
            <option value="VENDOR">Vendor</option>
            <option value="OTHER">Other</option>
          </select>
        </div>

        {client && (
          <div>
            <label className={LABEL} htmlFor="linkRole">Role at {client.name}</label>
            <input id="linkRole" name="linkRole" placeholder="Board President, Managing Agent, ..." className={INPUT} />
          </div>
        )}

        <div>
          <label className={LABEL} htmlFor="company">Company</label>
          <input id="company" name="company" className={INPUT} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={LABEL} htmlFor="email">Email</label>
            <input id="email" name="email" type="email" className={INPUT} />
          </div>
          <div>
            <label className={LABEL} htmlFor="phone">Phone</label>
            <input id="phone" name="phone" className={INPUT} />
          </div>
        </div>

        <div>
          <label className={LABEL} htmlFor="mailingAddressLine1">Mailing address</label>
          <input id="mailingAddressLine1" name="mailingAddressLine1" className={INPUT} />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className={LABEL} htmlFor="city">City</label>
            <input id="city" name="city" className={INPUT} />
          </div>
          <div>
            <label className={LABEL} htmlFor="state">State</label>
            <input id="state" name="state" defaultValue="FL" className={INPUT} />
          </div>
          <div>
            <label className={LABEL} htmlFor="postalCode">ZIP</label>
            <input id="postalCode" name="postalCode" className={INPUT} />
          </div>
        </div>

        <button type="submit" className="rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700">
          Save
        </button>
      </form>
    </div>
  )
}
