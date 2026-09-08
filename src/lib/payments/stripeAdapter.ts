import Stripe from 'stripe'
import type { CheckoutRequest, CheckoutResult, PaymentProvider } from './types'

/// Real adapter for Stripe Checkout. Confirm Stripe's BAA covers the plan
/// in use before processing a real patient's payment — see COMPLIANCE.md.
/// Card details are entered on Stripe-hosted Checkout; this server never
/// sees them.
export class StripePaymentAdapter implements PaymentProvider {
  private stripe: Stripe

  constructor() {
    const key = process.env.STRIPE_SECRET_KEY
    if (!key) throw new Error('STRIPE_SECRET_KEY is not set')
    this.stripe = new Stripe(key)
  }

  async createCheckout(request: CheckoutRequest): Promise<CheckoutResult> {
    const session = await this.stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: request.patientEmail,
      line_items: [
        {
          price_data: {
            currency: request.currency,
            unit_amount: request.amountCents,
            product_data: { name: 'Telehealth visit copay' },
          },
          quantity: 1,
        },
      ],
      metadata: { invoiceId: request.invoiceId },
      success_url: request.successUrl,
      cancel_url: request.cancelUrl,
    })

    return {
      providerRef: session.id,
      redirectUrl: session.url,
      paidImmediately: false,
    }
  }
}
