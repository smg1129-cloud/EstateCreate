// E-signature / Remote Online Notarization (RON) adapter interface.
//
// EstateCreate never performs notarization itself. This interface is how an
// APPROVED document is handed to a signing/notarization provider. In dev the
// mock adapter simulates the lifecycle; in production a Florida-registered RON
// platform (or an e-signature vendor for documents that don't require a notary)
// implements the same interface.
//
// Florida execution rules are strict: a self-proved will needs two witnesses
// and a notary (Fla. Stat. 732.502–.503); electronic wills add qualified-
// custodian and vulnerable-adult requirements (Fla. Stat. 732.521–.525); RON
// itself is governed by Fla. Stat. 117.201 et seq. The adapter is responsible
// for satisfying these; the ExecutionRequirement on each DocumentModel tells it
// what a given document needs.

export type SignerRole = 'PRINCIPAL' | 'WITNESS' | 'NOTARY'

export interface Signer {
  role: SignerRole
  name: string
  email?: string
  status?: 'PENDING' | 'SIGNED' | 'DECLINED'
  signedAt?: string
}

export type ExecutionMethod = 'REMOTE_ONLINE_NOTARIZATION' | 'IN_PERSON'

export interface CreateSignatureRequest {
  documentId: string
  title: string
  method: ExecutionMethod
  /** Rendered PDF to be signed/notarized. */
  pdf: Buffer
  signers: Signer[]
  /** Witnesses/notary required for this document (from ExecutionRequirement). */
  requiresNotary: boolean
  requiredWitnesses: number
}

export interface SignatureSession {
  provider: string
  externalRef: string
  status: 'SENT' | 'IN_PROGRESS' | 'COMPLETED' | 'DECLINED'
  /** URL the client/signers visit to complete signing (RON session, etc.). */
  signingUrl?: string
}

export interface SignatureStatusResult {
  externalRef: string
  status: 'SENT' | 'IN_PROGRESS' | 'COMPLETED' | 'DECLINED' | 'EXPIRED'
  signers: Signer[]
  /** The executed, notarized PDF once COMPLETED. */
  completedPdf?: Buffer
}

export interface EsignAdapter {
  readonly name: string
  createSignatureRequest(req: CreateSignatureRequest): Promise<SignatureSession>
  getStatus(externalRef: string): Promise<SignatureStatusResult>
  cancel(externalRef: string): Promise<void>
}
