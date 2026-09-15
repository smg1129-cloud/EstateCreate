// Rendered-document storage. Bytes never live in the database; they are written
// through this adapter. The "local" adapter (default in dev) writes under
// DOC_STORAGE_DIR; a production deployment swaps in an S3 adapter (SSE-KMS)
// behind the same interface. Storage keys are opaque paths.

import fs from 'fs/promises'
import path from 'path'

export interface StorageAdapter {
  save(key: string, bytes: Buffer, contentType: string): Promise<void>
  read(key: string): Promise<Buffer>
  exists(key: string): Promise<boolean>
}

class LocalStorageAdapter implements StorageAdapter {
  private baseDir: string
  constructor(baseDir: string) {
    this.baseDir = baseDir
  }
  private resolve(key: string): string {
    // Prevent path traversal; keys are app-generated but be defensive.
    const safe = key.replace(/\.\.(\/|\\)/g, '')
    return path.join(this.baseDir, safe)
  }
  async save(key: string, bytes: Buffer): Promise<void> {
    const full = this.resolve(key)
    await fs.mkdir(path.dirname(full), { recursive: true })
    await fs.writeFile(full, bytes)
  }
  async read(key: string): Promise<Buffer> {
    return fs.readFile(this.resolve(key))
  }
  async exists(key: string): Promise<boolean> {
    try {
      await fs.access(this.resolve(key))
      return true
    } catch {
      return false
    }
  }
}

let adapter: StorageAdapter | null = null

export function getStorage(): StorageAdapter {
  if (adapter) return adapter
  const provider = process.env.DOC_STORAGE_PROVIDER ?? 'local'
  if (provider === 'local') {
    adapter = new LocalStorageAdapter(process.env.DOC_STORAGE_DIR ?? '.data/documents')
  } else {
    // An S3 adapter would be constructed here. Fail loudly rather than silently
    // writing client documents to the wrong place.
    throw new Error(`DOC_STORAGE_PROVIDER="${provider}" is not implemented. Use "local" in development.`)
  }
  return adapter
}

/** Conventional storage keys for a document version's rendered artifacts. */
export function artifactKey(matterId: string, documentId: string, ext: 'docx' | 'pdf'): string {
  return `matters/${matterId}/${documentId}.${ext}`
}
