import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/session'
import { requireRole } from '@/lib/rbac'
import { getPriceMap } from '@/lib/billing/service'
import { DOCUMENT_LABELS } from '@/lib/documents/generators'
import { PricingForm } from './PricingForm'
import type { DocumentType } from '@prisma/client'

export default async function AdminPricingPage() {
  const actor = await getCurrentUser()
  if (!actor) redirect('/login')
  requireRole(actor, ['ADMIN'])

  const priceMap = await getPriceMap(actor.organizationId)
  const types = Object.keys(DOCUMENT_LABELS) as DocumentType[]
  const rows = types.map((type) => {
    const p = priceMap.get(type)
    return {
      type,
      label: DOCUMENT_LABELS[type],
      dollars: ((p?.amountCents ?? 0) / 100).toFixed(2),
      active: p ? p.amountCents > 0 : false,
    }
  })

  const anyPriced = rows.some((r) => Number(r.dollars) > 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Document pricing</h1>
        <p className="mt-1 text-sm text-gray-500">
          Set your firm's flat fee for each document type. These fees drive the
          client quote and checkout. Amounts in U.S. dollars.
        </p>
      </div>

      {!anyPriced && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <strong>Pricing not set yet.</strong> Until you enter fees here, clients
          will see $0.00 per document at checkout. Set your fees before taking real
          clients.
        </div>
      )}

      <PricingForm rows={rows} />
    </div>
  )
}
