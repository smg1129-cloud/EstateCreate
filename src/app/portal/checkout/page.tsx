import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/session'
import { assertCanAccessMatter } from '@/lib/rbac'
import { getActiveMatterForClient, canGenerate } from '@/lib/matters/service'
import {
  buildQuoteForMatter,
  getActiveQuote,
  updateQuoteSelection,
  startCheckout,
  hasCapturedPayment,
} from '@/lib/billing/service'
import { CheckoutClient } from '@/components/CheckoutClient'
import type { DocumentType } from '@prisma/client'

export default async function CheckoutPage() {
  const actor = await getCurrentUser()
  if (!actor) redirect('/login')
  const matter = await getActiveMatterForClient(actor.id)
  if (!matter) redirect('/portal')

  // Both questionnaires must be complete before there's anything to price.
  if (!(await canGenerate(matter.id))) redirect('/portal/intake/estate')

  // Already paid → documents are (being) generated.
  if (await hasCapturedPayment(matter.id)) redirect('/portal/documents')

  // Ensure a current quote exists (idempotent rebuild picks up any changes).
  let quote = await getActiveQuote(matter.id)
  if (!quote) {
    await buildQuoteForMatter(matter.id, actor.id)
    quote = await getActiveQuote(matter.id)
  }
  if (!quote) redirect('/portal')

  const matterId = matter.id
  const actorId = actor.id
  const orgId = matter.organizationId
  const baseUrl = process.env.NEXTAUTH_URL ?? ''

  // Stable ordering: base documents first, then proposed add-ons.
  const items = [...quote.items]
    .sort((a, b) => {
      if (a.origin !== b.origin) return a.origin === 'BASE' ? -1 : 1
      return a.label.localeCompare(b.label)
    })
    .map((i) => ({
      type: i.type,
      label: i.label,
      origin: i.origin,
      selected: i.selected,
      unitPriceCents: i.unitPriceCents,
    }))

  async function saveSelection(selectedTypes: DocumentType[]) {
    'use server'
    await assertCanAccessMatter({ id: actorId, role: 'CLIENT', organizationId: orgId }, matterId)
    const { subtotalCents } = await updateQuoteSelection({ matterId, selectedTypes, actorId })
    return { subtotalCents }
  }

  async function pay(selectedTypes: DocumentType[]) {
    'use server'
    await assertCanAccessMatter({ id: actorId, role: 'CLIENT', organizationId: orgId }, matterId)
    await updateQuoteSelection({ matterId, selectedTypes, actorId })
    const { checkoutUrl } = await startCheckout({ matterId, actorId, baseUrl })
    redirect(checkoutUrl)
  }

  const hasProposed = items.some((i) => i.origin === 'PROPOSED')

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-bold text-gray-900">Review your documents & fees</h1>
      <p className="mt-1 text-sm text-gray-500">Matter {matter.reference}</p>
      <p className="mt-4 text-gray-600">
        Based on your answers, here is the plan we recommend. Choose the documents
        you'd like us to prepare. {hasProposed && 'Items marked “suggested” came from your detailed answers — include them or leave them out.'} You
        won't be charged until you confirm, and your documents are prepared only
        after payment.
      </p>

      <div className="mt-6">
        <CheckoutClient
          items={items}
          currency={quote.currency}
          saveSelection={saveSelection}
          pay={pay}
        />
      </div>

      <p className="mt-6 text-xs text-gray-400">
        Fees are a flat charge per document. After payment, each document is
        prepared and reviewed by a licensed Florida attorney before it is released
        to you. No attorney-client relationship is formed until the firm accepts
        your engagement; see our{' '}
        <a href="/legal" className="underline" target="_blank" rel="noreferrer">
          engagement terms
        </a>{' '}
        for our refund policy.
      </p>
    </div>
  )
}
