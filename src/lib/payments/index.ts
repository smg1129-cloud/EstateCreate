import type { PaymentAdapter } from './types'
import { MockPaymentAdapter } from './mockAdapter'

export * from './types'

let adapter: PaymentAdapter | null = null

/**
 * Resolves the configured payments adapter. Defaults to the mock adapter (no
 * real charge). A real processor (Stripe Checkout, LawPay, etc.) is added here
 * behind the same PaymentAdapter interface once contracted — collecting a fee
 * before attorney review implicates Florida trust-accounting rules (Rules
 * 4-1.5, 5-1.1), so confirm the account setup (operating vs. IOLTA) and refund
 * policy before going live.
 */
export function getPaymentAdapter(): PaymentAdapter {
  if (adapter) return adapter
  const provider = process.env.PAYMENTS_PROVIDER ?? 'mock'
  switch (provider) {
    case 'mock':
      adapter = new MockPaymentAdapter()
      break
    default:
      throw new Error(
        `PAYMENTS_PROVIDER="${provider}" has no adapter implemented yet. Add its adapter behind the PaymentAdapter interface. Use "mock" in development.`,
      )
  }
  return adapter
}
