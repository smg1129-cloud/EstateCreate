// Payments adapter interface. The flat-fee checkout goes through this so a real
// processor (Stripe, LawPay, etc.) can be dropped in behind the same shape
// without touching the billing service. Money is always in the smallest
// currency unit (cents).

export interface CheckoutLineItem {
  label: string
  amountCents: number
  quantity: number
}

export interface CreateCheckoutParams {
  /** Our Payment row id — round-trips back so we can reconcile on return. */
  paymentId: string
  quoteId: string
  matterId: string
  amountCents: number
  currency: string
  clientEmail: string
  lineItems: CheckoutLineItem[]
  /** Where the processor sends the client after success / cancel. */
  successUrl: string
  cancelUrl: string
}

export interface CheckoutSession {
  provider: string
  /** Processor's session / intent reference. */
  externalRef: string
  /** URL to send the client to in order to pay. */
  checkoutUrl: string
  status: 'PENDING'
}

export type ProviderPaymentStatus = 'PENDING' | 'SUCCEEDED' | 'FAILED'

export interface PaymentStatusResult {
  status: ProviderPaymentStatus
  amountCents?: number
}

export interface RefundResult {
  status: 'REFUNDED'
  externalRef?: string
}

export interface PaymentAdapter {
  createCheckout(params: CreateCheckoutParams): Promise<CheckoutSession>
  getStatus(externalRef: string): Promise<PaymentStatusResult>
  refund(externalRef: string, amountCents?: number): Promise<RefundResult>
}
