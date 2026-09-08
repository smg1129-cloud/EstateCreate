import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { db } from '@/lib/db'

/// Only relevant when PAYMENTS_PROVIDER=stripe. Verifies the Stripe
/// signature before trusting anything in the payload — never trust webhook
/// bodies unverified.
export async function POST(req: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  const stripeKey = process.env.STRIPE_SECRET_KEY
  if (!webhookSecret || !stripeKey) {
    return NextResponse.json({ error: 'Stripe is not configured' }, { status: 400 })
  }

  const stripe = new Stripe(stripeKey)
  const signature = req.headers.get('stripe-signature')
  const body = await req.text()

  let event: Stripe.Event
  try {
    if (!signature) throw new Error('Missing signature')
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const invoiceId = session.metadata?.invoiceId
    if (invoiceId) {
      await db.invoice.update({
        where: { id: invoiceId },
        data: { status: 'PAID', paidAt: new Date() },
      })
    }
  }

  return NextResponse.json({ received: true })
}
