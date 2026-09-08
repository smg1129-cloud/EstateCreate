import crypto from 'crypto'
import type { CheckoutRequest, CheckoutResult, PaymentProvider } from './types'

/// Local-dev stand-in — no real card collection happens. The route handler
/// (src/app/api/payments/checkout/route.ts) is responsible for actually
/// marking the invoice PAID when paidImmediately is true; this adapter only
/// signals that it should.
export class MockPaymentAdapter implements PaymentProvider {
  async createCheckout(_request: CheckoutRequest): Promise<CheckoutResult> {
    return {
      providerRef: `MOCK-PAY-${crypto.randomUUID()}`,
      redirectUrl: null,
      paidImmediately: true,
    }
  }
}
