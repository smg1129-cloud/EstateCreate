import type { DocumentStorageAdapter } from './types'
import { LocalDiskDocumentStorageAdapter } from './mockAdapter'

/// Provider selected via DOCUMENT_STORAGE_PROVIDER — no real vendor is
/// wired up yet. Swap in an S3-compatible or DMS (NetDocuments/iManage)
/// adapter here once one is selected; nothing else in the app needs to
/// change since callers only see the DocumentStorageAdapter interface.
export function getDocumentStorageAdapter(): DocumentStorageAdapter {
  const provider = process.env.DOCUMENT_STORAGE_PROVIDER ?? 'mock'
  switch (provider) {
    case 'mock':
      return new LocalDiskDocumentStorageAdapter()
    default:
      throw new Error(`Unknown DOCUMENT_STORAGE_PROVIDER: ${provider}`)
  }
}

export type { DocumentStorageAdapter, SaveFileInput, SaveFileResult } from './types'
