import { db } from '@/lib/db'
import { addProviderLicense } from './actions'
import { LicenseRow } from './LicenseRow'

export default async function AdminLicensesPage() {
  const [licenses, providers] = await Promise.all([
    db.providerLicense.findMany({ orderBy: { expiresAt: 'asc' }, include: { provider: { include: { user: true } } } }),
    db.provider.findMany({ include: { user: true } }),
  ])

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-semibold text-gray-900">Provider licenses</h1>
      <p className="mt-1 text-sm text-gray-500">
        The booking flow only offers a provider for states where they hold an ACTIVE, unexpired license
        here.
      </p>

      <table className="mt-6 w-full text-left text-sm">
        <thead className="border-b border-gray-200 text-xs uppercase text-gray-500">
          <tr>
            <th className="py-2">Provider</th>
            <th className="py-2">State</th>
            <th className="py-2">License #</th>
            <th className="py-2">Expires</th>
            <th className="py-2">Status</th>
            <th className="py-2" />
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {licenses.map((l) => (
            <LicenseRow key={l.id} license={l} />
          ))}
        </tbody>
      </table>

      <div className="mt-10 max-w-md rounded-lg border border-gray-200 p-4">
        <h2 className="mb-3 text-sm font-semibold text-gray-900">Add license</h2>
        <form action={addProviderLicense} className="space-y-2">
          <select name="providerId" required className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm">
            <option value="">Select provider…</option>
            {providers.map((p) => (
              <option key={p.id} value={p.id}>
                {p.user.firstName} {p.user.lastName}
              </option>
            ))}
          </select>
          <input name="state" placeholder="State (e.g. NY)" maxLength={2} required className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm uppercase" />
          <input name="licenseNumber" placeholder="License number" required className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm" />
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-gray-500">Issued</label>
              <input name="issuedAt" type="date" required className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm" />
            </div>
            <div>
              <label className="text-xs text-gray-500">Expires</label>
              <input name="expiresAt" type="date" required className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm" />
            </div>
          </div>
          <button className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">
            Add license
          </button>
        </form>
      </div>
    </div>
  )
}
