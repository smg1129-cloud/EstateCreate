import crypto from 'crypto'
import type { DocumentModel } from './blocks'

/** Stable content hash of a generated document, used to detect whether a
 * regeneration actually changed anything an attorney already reviewed. We hash
 * the blocks + execution requirements (the client-facing substance), not the
 * meta timestamp or the attorney-only flags. */
export function hashDocument(model: DocumentModel): string {
  const normalized = JSON.stringify({ type: model.type, title: model.title, blocks: model.blocks, execution: model.execution })
  return crypto.createHash('sha256').update(normalized).digest('hex')
}
