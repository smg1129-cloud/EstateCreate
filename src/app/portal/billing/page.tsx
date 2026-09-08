import { db } from '@/lib/db'
import { getCurrentPatientOrRedirect } from '@/lib/currentPatient'
import { PayInvoiceButton } from './PayInvoiceButton'

export default async function PortalBillingPage() {
  const { patient } = await getCurrentPatientOrRedirect()

  const invoices = await db.invoice.findMany({
    where: { patientId: patient.id },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-semibold text-gray-900">Billing</h1>
      <ul className="mt-6 space-y-3">
        {invoices.map((inv) => (
          <li key={inv.id} className="flex items-center justify-between rounded-lg border border-gray-200 p-4">
            <div>
              <p className="font-medium text-gray-900">${(inv.amountCents / 100).toFixed(2)}</p>
              <p className="text-sm text-gray-500">
                {new Date(inv.createdAt).toLocaleDateString()} &middot; {inv.status}
              </p>
            </div>
            {inv.status === 'OPEN' && <PayInvoiceButton invoiceId={inv.id} />}
          </li>
        ))}
        {invoices.length === 0 && <p className="text-sm text-gray-500">No invoices yet.</p>}
      </ul>
    </div>
  )
}
