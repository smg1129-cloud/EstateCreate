import type { CertifiedMailAdapter, SendCertifiedMailInput, SendCertifiedMailResult } from './types'

/// Fabricates a USPS-shaped tracking number and returns immediately —
/// no real mail is sent. Delivery status is advanced manually in the UI
/// via a dev-only "simulate delivery" control (see actions.ts) rather than
/// polling a real carrier API.
export class MockCertifiedMailAdapter implements CertifiedMailAdapter {
  async send(_input: SendCertifiedMailInput): Promise<SendCertifiedMailResult> {
    const digits = Array.from({ length: 20 }, () => Math.floor(Math.random() * 10)).join('')
    return {
      trackingNumber: `9407 3000 0000 ${digits.slice(0, 4)} ${digits.slice(4, 8)}`,
      provider: 'mock',
    }
  }
}
