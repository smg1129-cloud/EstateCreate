import type { EsignAdapter } from './types'
import { MockEsignAdapter } from './mockAdapter'

export * from './types'

let adapter: EsignAdapter | null = null

/** Resolves the configured e-sign/RON adapter. Defaults to the mock adapter.
 * Real providers (a Florida-registered RON platform, or an e-signature vendor)
 * are added here behind the same interface once contracted. */
export function getEsignAdapter(): EsignAdapter {
  if (adapter) return adapter
  const provider = process.env.ESIGN_PROVIDER ?? 'mock'
  switch (provider) {
    case 'mock':
      adapter = new MockEsignAdapter()
      break
    default:
      throw new Error(
        `ESIGN_PROVIDER="${provider}" has no adapter implemented yet. Contract a Florida-registered RON provider and add its adapter. Use "mock" in development.`
      )
  }
  return adapter
}
