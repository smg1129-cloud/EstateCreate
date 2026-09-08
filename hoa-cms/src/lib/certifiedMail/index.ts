import type { CertifiedMailAdapter } from './types'
import { MockCertifiedMailAdapter } from './mockAdapter'

/// Provider selected via CERTIFIED_MAIL_PROVIDER — no real vendor is wired
/// up yet (see COMPLIANCE-style notes in the project README), so this only
/// resolves to the mock adapter today. Swap in a real implementation here
/// once a vendor (Lob, Simple Certified Mail, PSI, ...) is selected.
export function getCertifiedMailAdapter(): CertifiedMailAdapter {
  const provider = process.env.CERTIFIED_MAIL_PROVIDER ?? 'mock'
  switch (provider) {
    case 'mock':
      return new MockCertifiedMailAdapter()
    default:
      throw new Error(`Unknown CERTIFIED_MAIL_PROVIDER: ${provider}`)
  }
}

export type { CertifiedMailAdapter, SendCertifiedMailInput, SendCertifiedMailResult } from './types'
