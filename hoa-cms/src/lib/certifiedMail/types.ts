export interface SendCertifiedMailInput {
  recipientName: string
  recipientAddress: string
  /// Opaque reference to the letter being mailed — the mock adapter
  /// ignores this, a real vendor (e.g. Lob, Simple Certified Mail) would
  /// use it to attach the actual document content to the mail piece.
  documentId?: string
}

export interface SendCertifiedMailResult {
  trackingNumber: string
  provider: string
}

export interface CertifiedMailAdapter {
  send(input: SendCertifiedMailInput): Promise<SendCertifiedMailResult>
}
