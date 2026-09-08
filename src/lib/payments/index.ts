import { MockPaymentAdapter } from './mockAdapter'
import { StripePaymentAdapter } from './stripeAdapter'
import type { PaymentProvider } from './types'

export type { CheckoutRequest, CheckoutResult, PaymentProvider } from './types'

export function getPaymentProvider(): PaymentProvider {
  const provider = process.env.PAYMENTS_PROVIDER ?? 'mock'
  switch (provider) {
    case 'mock':
      return new MockPaymentAdapter()
    case 'stripe':
      return new StripePaymentAdapter()
    default:
      throw new Error(`Unknown PAYMENTS_PROVIDER "${provider}"`)
  }
}
