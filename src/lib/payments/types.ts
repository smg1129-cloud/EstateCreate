export interface CheckoutRequest {
  invoiceId: string
  amountCents: number
  currency: string
  patientEmail: string
  successUrl: string
  cancelUrl: string
}

export interface CheckoutResult {
  providerRef: string
  redirectUrl: string | null
  // true when the mock adapter has already marked the invoice paid
  // synchronously (no real payment step exists in dev without Stripe keys).
  paidImmediately: boolean
}

/// Card data must never touch our server directly — both adapters keep us
/// out of PCI scope: Stripe Checkout/Elements collect the card, the mock
/// adapter collects nothing at all.
export interface PaymentProvider {
  createCheckout(request: CheckoutRequest): Promise<CheckoutResult>
}
