// Mock e-sign / RON adapter for development. It simulates the signing lifecycle
// in-memory: creating a request returns a fake signing URL and marks it SENT;
// getStatus advances it to COMPLETED after the first poll so the end-to-end
// flow (send -> complete -> executed doc delivered) can be exercised without a
// real vendor. Never use this to execute a real document.

import type {
  CreateSignatureRequest,
  EsignAdapter,
  SignatureSession,
  SignatureStatusResult,
  Signer,
} from './types'

interface MockRecord {
  externalRef: string
  signers: Signer[]
  polls: number
  pdf: Buffer
}

const store = new Map<string, MockRecord>()

export class MockEsignAdapter implements EsignAdapter {
  readonly name = 'mock'

  async createSignatureRequest(req: CreateSignatureRequest): Promise<SignatureSession> {
    const externalRef = `mock_${req.documentId}_${Date.now()}`
    store.set(externalRef, {
      externalRef,
      signers: req.signers.map((s) => ({ ...s, status: 'PENDING' })),
      polls: 0,
      pdf: req.pdf,
    })
    return {
      provider: this.name,
      externalRef,
      status: 'SENT',
      signingUrl: `/attorney/execution/mock/${externalRef}`,
    }
  }

  async getStatus(externalRef: string): Promise<SignatureStatusResult> {
    const rec = store.get(externalRef)
    if (!rec) {
      return { externalRef, status: 'EXPIRED', signers: [] }
    }
    rec.polls += 1
    // Simulate completion after the request has been "opened" once.
    const completed = rec.polls >= 1
    if (completed) {
      rec.signers = rec.signers.map((s) => ({ ...s, status: 'SIGNED', signedAt: new Date().toISOString() }))
    }
    return {
      externalRef,
      status: completed ? 'COMPLETED' : 'IN_PROGRESS',
      signers: rec.signers,
      completedPdf: completed ? rec.pdf : undefined,
    }
  }

  async cancel(externalRef: string): Promise<void> {
    store.delete(externalRef)
  }
}
