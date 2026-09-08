export interface SyncLedgerEntryInput {
  matterNumber: string
  clientName: string
  entryType: string
  amountCents: number
  description?: string | null
  entryDate: Date
}

export interface SyncLedgerEntryResult {
  qbReferenceId: string
}

export interface BillingSyncAdapter {
  syncEntry(input: SyncLedgerEntryInput): Promise<SyncLedgerEntryResult>
}
