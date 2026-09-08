const INPUT = 'mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500'
const LABEL = 'block text-sm font-medium text-slate-700'

export function ClientForm({
  action,
  defaultValues,
  includeStatus,
}: {
  action: (formData: FormData) => void
  defaultValues?: {
    name?: string
    clientType?: string
    status?: string
    addressLine1?: string
    addressLine2?: string
    city?: string
    state?: string
    postalCode?: string
    county?: string
    federalEin?: string
  }
  includeStatus?: boolean
}) {
  const d = defaultValues ?? {}
  return (
    <form action={action} className="mt-6 max-w-xl space-y-4">
      <div>
        <label className={LABEL} htmlFor="name">Association name</label>
        <input id="name" name="name" required defaultValue={d.name} className={INPUT} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={LABEL} htmlFor="clientType">Type</label>
          <select id="clientType" name="clientType" defaultValue={d.clientType ?? 'HOA'} className={INPUT}>
            <option value="HOA">HOA</option>
            <option value="CONDOMINIUM">Condominium</option>
            <option value="COOPERATIVE">Cooperative</option>
          </select>
        </div>
        {includeStatus && (
          <div>
            <label className={LABEL} htmlFor="status">Status</label>
            <select id="status" name="status" defaultValue={d.status ?? 'ACTIVE'} className={INPUT}>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="FORMER">Former</option>
            </select>
          </div>
        )}
      </div>

      <div>
        <label className={LABEL} htmlFor="addressLine1">Address line 1</label>
        <input id="addressLine1" name="addressLine1" defaultValue={d.addressLine1} className={INPUT} />
      </div>
      <div>
        <label className={LABEL} htmlFor="addressLine2">Address line 2</label>
        <input id="addressLine2" name="addressLine2" defaultValue={d.addressLine2} className={INPUT} />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className={LABEL} htmlFor="city">City</label>
          <input id="city" name="city" defaultValue={d.city} className={INPUT} />
        </div>
        <div>
          <label className={LABEL} htmlFor="state">State</label>
          <input id="state" name="state" defaultValue={d.state ?? 'FL'} className={INPUT} />
        </div>
        <div>
          <label className={LABEL} htmlFor="postalCode">ZIP</label>
          <input id="postalCode" name="postalCode" defaultValue={d.postalCode} className={INPUT} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={LABEL} htmlFor="county">County</label>
          <input id="county" name="county" defaultValue={d.county} className={INPUT} />
        </div>
        <div>
          <label className={LABEL} htmlFor="federalEin">Federal EIN</label>
          <input id="federalEin" name="federalEin" defaultValue={d.federalEin} className={INPUT} />
        </div>
      </div>

      <button
        type="submit"
        className="rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
      >
        Save
      </button>
    </form>
  )
}
