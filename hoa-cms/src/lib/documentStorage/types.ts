export interface SaveFileInput {
  buffer: Buffer
  fileName: string
  contentType: string
}

export interface SaveFileResult {
  storageKey: string
  provider: string
}

export interface DocumentStorageAdapter {
  save(input: SaveFileInput): Promise<SaveFileResult>
  read(storageKey: string): Promise<Buffer>
}
