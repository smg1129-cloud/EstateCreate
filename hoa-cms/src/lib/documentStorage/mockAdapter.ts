import { promises as fs } from 'fs'
import path from 'path'
import { randomUUID } from 'crypto'
import type { DocumentStorageAdapter, SaveFileInput, SaveFileResult } from './types'

/// Local-disk storage under DOCUMENT_STORAGE_LOCAL_DIR (gitignored). Fine
/// for a single-instance dev/demo deployment; a real production deployment
/// (especially multi-instance) should swap this for an S3-compatible or
/// vendor (NetDocuments/iManage/SharePoint) adapter behind the same
/// interface — see README for the decision this firm still needs to make.
export class LocalDiskDocumentStorageAdapter implements DocumentStorageAdapter {
  private baseDir: string

  constructor() {
    this.baseDir = process.env.DOCUMENT_STORAGE_LOCAL_DIR ?? './uploads'
  }

  async save(input: SaveFileInput): Promise<SaveFileResult> {
    await fs.mkdir(this.baseDir, { recursive: true })
    // The storage key is an opaque UUID, never the user-supplied file
    // name — that name is attacker-controlled input and only ever used
    // for display/Content-Disposition, never as (or part of) a filesystem
    // path, to rule out path traversal.
    const key = randomUUID()
    await fs.writeFile(path.join(this.baseDir, key), input.buffer)
    return { storageKey: key, provider: 'mock' }
  }

  async read(storageKey: string): Promise<Buffer> {
    if (!/^[0-9a-f-]{36}$/i.test(storageKey)) throw new Error('Invalid storage key')
    return fs.readFile(path.join(this.baseDir, storageKey))
  }
}
