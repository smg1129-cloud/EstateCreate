import type { BillingSyncAdapter } from './types'
import { MockBillingSyncAdapter } from './mockAdapter'

/// Provider selected via BILLING_SYNC_PROVIDER — no accounting vendor is
/// wired up yet. A real QuickBooks Online adapter goes here once the firm
/// authorizes one; every LedgerEntry already carries qbSyncStatus/
/// qbReferenceId so backfilling historical entries is a batch job, not a
/// schema change.
export function getBillingSyncAdapter(): BillingSyncAdapter {
  const provider = process.env.BILLING_SYNC_PROVIDER ?? 'mock'
  switch (provider) {
    case 'mock':
      return new MockBillingSyncAdapter()
    default:
      throw new Error(`Unknown BILLING_SYNC_PROVIDER: ${provider}`)
  }
}

export type { BillingSyncAdapter, SyncLedgerEntryInput, SyncLedgerEntryResult } from './types'
