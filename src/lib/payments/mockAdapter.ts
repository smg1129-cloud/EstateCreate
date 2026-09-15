import type {
  PaymentAdapter,
  CreateCheckoutParams,
  CheckoutSession,
  PaymentStatusResult,
  RefundResult,
} from './types'

/**
 * Development payment adapter. It does not move money — it stands in for a
 * hosted checkout by pointing the client at an in-app "simulated payment" page
 * (`/portal/checkout/mock/[paymentId]`) with Pay / Cancel buttons. Confirming
 * there calls the same service finalizer a real processor's webhook/redirect
 * would, so the rest of the flow (generation gate, refunds) is exercised for
 * real. Swap PAYMENTS_PROVIDER to a real adapter for production.
 */
export class MockPaymentAdapter implements PaymentAdapter {
  async createCheckout(params: CreateCheckoutParams): Promise<CheckoutSession> {
    return {
      provider: 'mock',
      externalRef: `mock_${params.paymentId}`,
      checkoutUrl: `/portal/checkout/mock/${params.paymentId}`,
      status: 'PENDING',
    }
  }

  // The mock page drives status transitions via the service, so a poll simply
  // reports pending; finalization is explicit, not inferred here.
  async getStatus(_externalRef: string): Promise<PaymentStatusResult> {
    return { status: 'PENDING' }
  }

  async refund(externalRef: string): Promise<RefundResult> {
    return { status: 'REFUNDED', externalRef }
  }
}
