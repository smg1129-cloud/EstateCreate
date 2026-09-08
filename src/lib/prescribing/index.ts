import { MockPrescribingAdapter } from './mockAdapter'
import type { PrescribingProvider } from './types'

export type { PrescriptionRequest, PrescriptionResult, PrescribingProvider } from './types'

/// Only "mock" exists today. PRESCRIBING_PROVIDER is read here (rather than
/// hardcoding the mock) so a real, certified vendor adapter can be dropped
/// in later behind the same interface without touching call sites.
export function getPrescribingProvider(): PrescribingProvider {
  const provider = process.env.PRESCRIBING_PROVIDER ?? 'mock'
  switch (provider) {
    case 'mock':
      return new MockPrescribingAdapter()
    default:
      throw new Error(
        `Unknown PRESCRIBING_PROVIDER "${provider}" — no certified e-prescribing vendor is integrated yet. See COMPLIANCE.md.`
      )
  }
}
