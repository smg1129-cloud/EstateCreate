import { randomUUID } from 'crypto'
import type { BillingSyncAdapter, SyncLedgerEntryInput, SyncLedgerEntryResult } from './types'

/// Fabricates a QuickBooks-shaped reference id and returns immediately —
/// no real accounting system is contacted. Shaped so a real QuickBooks
/// Online adapter can be dropped in behind the same interface once the
/// firm selects/authorizes one (OAuth app setup, chart-of-accounts
/// mapping, etc. are all outside what code alone can decide).
export class MockBillingSyncAdapter implements BillingSyncAdapter {
  async syncEntry(_input: SyncLedgerEntryInput): Promise<SyncLedgerEntryResult> {
    return { qbReferenceId: `MOCK-${randomUUID().slice(0, 8).toUpperCase()}` }
  }
}
