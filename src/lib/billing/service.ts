// Billing service — the per-document flat-fee layer that gates generation.
//
// Flow:
//   1. After triage, buildQuoteForMatter() produces the BASE set (from the
//      triage-only recommendation) as a preliminary quote/estimate.
//   2. After the detailed questionnaire, buildQuoteForMatter() runs again; the
//      fuller context may recommend more documents — those extra types are
//      marked PROPOSED (opt-in) while the client's existing selections are
//      preserved.
//   3. The client selects which documents to buy and checks out. Documents are
//      NOT generated until a payment SUCCEEDS (finalizePayment), at which point
//      only the paid-for types are generated and enter attorney review.
//
// The recommended sets come straight from the deterministic rules engine, so
// pricing rides on the same reproducible logic as document selection.

import { db } from '@/lib/db'
import { recordAudit } from '@/lib/audit'
import { buildContext } from '@/lib/documents/context'
import { recommendDocuments } from '@/lib/documents/rules'
import { DOCUMENT_LABELS } from '@/lib/documents/generators'
import {
  getMergedAnswers,
  getResponse,
  generateMatterDocuments,
} from '@/lib/matters/service'
import { getPaymentAdapter } from '@/lib/payments'
import type { Answers } from '@/lib/questionnaire/types'
import type { DocumentType } from '@prisma/client'

// ---- Money helpers --------------------------------------------------------

export function formatMoney(cents: number, currency = 'usd'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format((cents ?? 0) / 100)
}

// ---- Price catalog --------------------------------------------------------

export interface Price {
  amountCents: number
  currency: string
}

export async function getPriceMap(organizationId: string): Promise<Map<DocumentType, Price>> {
  const rows = await db.documentPrice.findMany({ where: { organizationId } })
  const map = new Map<DocumentType, Price>()
  for (const r of rows) {
    map.set(r.type, { amountCents: r.active ? r.amountCents : 0, currency: r.currency })
  }
  return map
}

/** Admin: set the flat fee for one document type (upsert). */
export async function setDocumentPrice(params: {
  organizationId: string
  type: DocumentType
  amountCents: number
  active?: boolean
  actorId: string
}) {
  const { organizationId, type, amountCents, active = true, actorId } = params
  const row = await db.documentPrice.upsert({
    where: { organizationId_type: { organizationId, type } },
    create: { organizationId, type, amountCents, active },
    update: { amountCents, active },
  })
  await recordAudit({
    actorId,
    action: 'UPDATE',
    entityType: 'DocumentPrice',
    entityId: row.id,
    metadata: { type, amountCents, active },
  })
  return row
}

// ---- Recommended sets (base vs. proposed) ---------------------------------

/**
 * Base set = documents recommended from the triage answers alone (shown as the
 * initial estimate). Full set = documents recommended once the detailed
 * questionnaire is folded in. The difference is what we present as proposed
 * add-ons for the client to accept or reject.
 */
async function recommendedSets(matterId: string): Promise<{
  baseTypes: DocumentType[]
  fullTypes: DocumentType[]
}> {
  const triageResp = await getResponse(matterId, 'TRIAGE')
  const triageAnswers = (triageResp?.answers as Answers) ?? {}
  const baseTypes = recommendDocuments(buildContext(triageAnswers)).documentTypes

  const merged = await getMergedAnswers(matterId)
  const fullTypes = recommendDocuments(buildContext(merged)).documentTypes

  return { baseTypes, fullTypes }
}

function dedupe<T>(items: T[]): T[] {
  const seen = new Set<T>()
  return items.filter((i) => (seen.has(i) ? false : (seen.add(i), true)))
}

// ---- Quote build / read ---------------------------------------------------

export async function getActiveQuote(matterId: string) {
  return db.quote.findFirst({
    where: { matterId, status: { in: ['DRAFT', 'AWAITING_PAYMENT'] } },
    include: { items: true },
    orderBy: { createdAt: 'desc' },
  })
}

export async function getLatestQuote(matterId: string) {
  return db.quote.findFirst({
    where: { matterId },
    include: { items: true },
    orderBy: { createdAt: 'desc' },
  })
}

async function recomputeSubtotal(quoteId: string): Promise<number> {
  const items = await db.quoteItem.findMany({ where: { quoteId } })
  const subtotal = items.filter((i) => i.selected).reduce((s, i) => s + i.unitPriceCents, 0)
  await db.quote.update({ where: { id: quoteId }, data: { subtotalCents: subtotal } })
  return subtotal
}

/**
 * Builds (or rebuilds) the active quote for a matter from the current
 * recommendation. Preserves prior selections; new PROPOSED items start
 * unchecked, BASE items start checked. Idempotent — safe to call after triage
 * and again after the detailed questionnaire. Never touches a PAID quote.
 */
export async function buildQuoteForMatter(matterId: string, actorId: string) {
  const matter = await db.estateMatter.findUnique({ where: { id: matterId } })
  if (!matter) throw new Error('Matter not found')

  const priceMap = await getPriceMap(matter.organizationId)
  const { baseTypes, fullTypes } = await recommendedSets(matterId)
  const baseSet = new Set(baseTypes)
  const desired = dedupe(fullTypes)

  let quote = await getActiveQuote(matterId)

  // Preserve prior accept/reject choices across a rebuild.
  const priorSelection = new Map<DocumentType, boolean>()
  if (quote) for (const it of quote.items) priorSelection.set(it.type, it.selected)

  if (!quote) {
    quote = await db.quote.create({
      data: { matterId, status: 'DRAFT', currency: 'usd' },
      include: { items: true },
    })
  }
  const quoteId = quote.id

  // Drop items no longer recommended.
  await db.quoteItem.deleteMany({ where: { quoteId, type: { notIn: desired } } })

  for (const type of desired) {
    const origin = baseSet.has(type) ? 'BASE' : 'PROPOSED'
    const unitPriceCents = priceMap.get(type)?.amountCents ?? 0
    const selected = priorSelection.has(type)
      ? priorSelection.get(type)!
      : origin === 'BASE' // base pre-checked, proposed opt-in
    await db.quoteItem.upsert({
      where: { quoteId_type: { quoteId, type } },
      create: { quoteId, type, label: DOCUMENT_LABELS[type], origin, selected, unitPriceCents },
      // On rebuild, refresh label/origin/price but keep the client's selection.
      update: { label: DOCUMENT_LABELS[type], origin, unitPriceCents },
    })
  }

  await recomputeSubtotal(quoteId)
  await recordAudit({
    actorId,
    action: 'QUOTE',
    entityType: 'Quote',
    entityId: quoteId,
    metadata: { base: baseTypes, full: fullTypes },
  })

  return db.quote.findUnique({ where: { id: quoteId }, include: { items: true } })
}

/** Client updates which documents they want to buy. */
export async function updateQuoteSelection(params: {
  matterId: string
  selectedTypes: DocumentType[]
  actorId: string
}) {
  const { matterId, selectedTypes, actorId } = params
  const quote = await getActiveQuote(matterId)
  if (!quote) throw new Error('No active quote')
  if (quote.status === 'PAID') throw new Error('Quote already paid')

  const sel = new Set(selectedTypes)
  await Promise.all(
    quote.items.map((it) =>
      db.quoteItem.update({ where: { id: it.id }, data: { selected: sel.has(it.type) } }),
    ),
  )
  const subtotal = await recomputeSubtotal(quote.id)
  await recordAudit({
    actorId,
    action: 'QUOTE',
    entityType: 'Quote',
    entityId: quote.id,
    metadata: { selected: selectedTypes, subtotalCents: subtotal },
  })
  return { subtotalCents: subtotal }
}

// ---- Checkout / payment ---------------------------------------------------

/**
 * Locks the current selection and opens a checkout session with the payments
 * adapter. Returns the URL to send the client to. The selection must be
 * non-empty. Does NOT generate documents — that happens in finalizePayment
 * once the payment succeeds.
 */
export async function startCheckout(params: {
  matterId: string
  actorId: string
  baseUrl: string
}): Promise<{ checkoutUrl: string; paymentId: string; amountCents: number }> {
  const { matterId, actorId, baseUrl } = params
  const quote = await getActiveQuote(matterId)
  if (!quote) throw new Error('No active quote')

  const selected = quote.items.filter((i) => i.selected)
  if (selected.length === 0) throw new Error('Select at least one document to continue.')

  const amountCents = selected.reduce((s, i) => s + i.unitPriceCents, 0)

  await db.quote.update({
    where: { id: quote.id },
    data: { status: 'AWAITING_PAYMENT', subtotalCents: amountCents },
  })
  await db.estateMatter.update({ where: { id: matterId }, data: { status: 'AWAITING_PAYMENT' } })

  const matter = await db.estateMatter.findUnique({
    where: { id: matterId },
    include: { client: true },
  })
  if (!matter) throw new Error('Matter not found')

  const provider = process.env.PAYMENTS_PROVIDER ?? 'mock'
  const payment = await db.payment.create({
    data: {
      quoteId: quote.id,
      matterId,
      provider,
      amountCents,
      currency: quote.currency,
      status: 'PENDING',
      paidForTypes: selected.map((i) => i.type),
    },
  })

  const adapter = getPaymentAdapter()
  const session = await adapter.createCheckout({
    paymentId: payment.id,
    quoteId: quote.id,
    matterId,
    amountCents,
    currency: quote.currency,
    clientEmail: matter.client.email,
    lineItems: selected.map((i) => ({ label: i.label, amountCents: i.unitPriceCents, quantity: 1 })),
    successUrl: `${baseUrl}/portal/documents`,
    cancelUrl: `${baseUrl}/portal/checkout`,
  })

  await db.payment.update({ where: { id: payment.id }, data: { externalRef: session.externalRef } })
  await recordAudit({
    actorId,
    action: 'PAYMENT',
    entityType: 'Payment',
    entityId: payment.id,
    metadata: { stage: 'started', amountCents, provider },
  })

  return { checkoutUrl: session.checkoutUrl, paymentId: payment.id, amountCents }
}

/**
 * Finalizes a successful payment: marks it SUCCEEDED, the quote PAID, and
 * releases document generation for the paid-for types only. This is what a real
 * processor's webhook/redirect handler would call; the mock checkout page calls
 * it directly. Idempotent.
 */
export async function finalizePayment(paymentId: string, actorId: string) {
  const payment = await db.payment.findUnique({ where: { id: paymentId } })
  if (!payment) throw new Error('Payment not found')
  if (payment.status === 'SUCCEEDED') return { alreadyFinalized: true as const }
  if (payment.status === 'REFUNDED') throw new Error('Payment was refunded')

  await db.payment.update({ where: { id: paymentId }, data: { status: 'SUCCEEDED' } })
  await db.quote.update({ where: { id: payment.quoteId }, data: { status: 'PAID' } })
  await recordAudit({
    actorId,
    action: 'PAYMENT',
    entityType: 'Payment',
    entityId: paymentId,
    metadata: { stage: 'succeeded', amountCents: payment.amountCents },
  })

  // Payment gate cleared — generate only what was paid for.
  await generateMatterDocuments(payment.matterId, actorId, { onlyTypes: payment.paidForTypes })

  return { alreadyFinalized: false as const }
}

/** Client cancelled at the payment step. Reopens the quote for editing. */
export async function cancelPayment(paymentId: string, actorId: string) {
  const payment = await db.payment.findUnique({ where: { id: paymentId } })
  if (!payment) throw new Error('Payment not found')
  if (payment.status === 'SUCCEEDED') return { ok: false as const }
  await db.payment.update({ where: { id: paymentId }, data: { status: 'FAILED' } })
  await db.quote.update({ where: { id: payment.quoteId }, data: { status: 'DRAFT' } })
  await recordAudit({
    actorId,
    action: 'PAYMENT',
    entityType: 'Payment',
    entityId: paymentId,
    metadata: { stage: 'cancelled' },
  })
  return { ok: true as const }
}

/**
 * Refunds the matter's captured payment — e.g. the attorney determines the firm
 * cannot serve the client, or rejects the plan. Marks the payment REFUNDED via
 * the adapter. (This is the "charge now, refund if rejected" path.)
 */
export async function refundMatterPayment(params: {
  matterId: string
  actorId: string
  reason: string
}) {
  const { matterId, actorId, reason } = params
  const payment = await db.payment.findFirst({
    where: { matterId, status: 'SUCCEEDED' },
    orderBy: { createdAt: 'desc' },
  })
  if (!payment) throw new Error('No captured payment to refund')

  const adapter = getPaymentAdapter()
  if (payment.externalRef) await adapter.refund(payment.externalRef, payment.amountCents)

  await db.payment.update({
    where: { id: payment.id },
    data: { status: 'REFUNDED', refundReason: reason, refundedAt: new Date() },
  })
  await recordAudit({
    actorId,
    action: 'REFUND',
    entityType: 'Payment',
    entityId: payment.id,
    metadata: { amountCents: payment.amountCents, reason },
  })
  return { amountCents: payment.amountCents }
}

/** Whether the matter has a captured (non-refunded) payment. */
export async function hasCapturedPayment(matterId: string): Promise<boolean> {
  const count = await db.payment.count({ where: { matterId, status: 'SUCCEEDED' } })
  return count > 0
}
