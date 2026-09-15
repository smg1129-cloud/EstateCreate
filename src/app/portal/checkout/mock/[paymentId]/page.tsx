import { redirect, notFound } from 'next/navigation'
import { getCurrentUser } from '@/lib/session'
import { db } from '@/lib/db'
import { finalizePayment, cancelPayment, formatMoney } from '@/lib/billing/service'
import { DOCUMENT_LABELS } from '@/lib/documents/generators'

// Development-only stand-in for a processor's hosted checkout page. A real
// adapter (Stripe, LawPay) would send the client to the processor instead; the
// success redirect / webhook would call finalizePayment the same way Pay does.
export default async function MockCheckoutPage({ params }: { params: { paymentId: string } }) {
  const actor = await getCurrentUser()
  if (!actor) redirect('/login')

  const payment = await db.payment.findUnique({
    where: { id: params.paymentId },
    include: { matter: { select: { clientId: true, reference: true } } },
  })
  if (!payment) notFound()
  // Only the owning client may act on this payment.
  if (payment.matter.clientId !== actor.id) notFound()
  if (payment.status === 'SUCCEEDED') redirect('/portal/documents')

  const paymentId = payment.id

  async function payNow() {
    'use server'
    const a = await getCurrentUser()
    if (!a) redirect('/login')
    const p = await db.payment.findUnique({ where: { id: paymentId }, include: { matter: { select: { clientId: true } } } })
    if (!p || p.matter.clientId !== a.id) notFound()
    await finalizePayment(paymentId, a.id)
    redirect('/portal/documents')
  }

  async function cancel() {
    'use server'
    const a = await getCurrentUser()
    if (!a) redirect('/login')
    const p = await db.payment.findUnique({ where: { id: paymentId }, include: { matter: { select: { clientId: true } } } })
    if (!p || p.matter.clientId !== a.id) notFound()
    await cancelPayment(paymentId, a.id)
    redirect('/portal/checkout')
  }

  return (
    <div className="mx-auto max-w-md">
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-center text-xs text-amber-800">
        Simulated payment (development mode) — no real charge is made.
      </div>

      <div className="mt-4 rounded-lg border border-gray-100 bg-white p-6 shadow-sm">
        <h1 className="text-xl font-bold text-gray-900">Confirm payment</h1>
        <p className="mt-1 text-sm text-gray-500">Matter {payment.matter.reference}</p>

        <ul className="mt-4 space-y-1 border-y border-gray-100 py-3 text-sm text-gray-700">
          {payment.paidForTypes.map((t) => (
            <li key={t} className="flex justify-between">
              <span>{DOCUMENT_LABELS[t]}</span>
            </li>
          ))}
        </ul>

        <div className="mt-3 flex items-center justify-between">
          <span className="text-sm font-medium text-gray-500">Total due</span>
          <span className="text-lg font-bold text-gray-900">
            {formatMoney(payment.amountCents, payment.currency)}
          </span>
        </div>

        <form action={payNow} className="mt-6">
          <button
            type="submit"
            className="w-full rounded-md bg-brand-600 px-4 py-2.5 font-medium text-white hover:bg-brand-700"
          >
            Pay {formatMoney(payment.amountCents, payment.currency)}
          </button>
        </form>
        <form action={cancel} className="mt-2">
          <button
            type="submit"
            className="w-full rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
          >
            Cancel
          </button>
        </form>
      </div>
    </div>
  )
}
