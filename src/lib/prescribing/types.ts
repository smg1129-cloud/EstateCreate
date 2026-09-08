export interface PrescriptionRequest {
  patientId: string
  providerId: string
  medicationName: string
  dosage: string
  quantity: string
  directions: string
  isControlled: boolean
}

export interface PrescriptionResult {
  externalVendorRef: string
  status: 'SENT' | 'ERROR'
  errorMessage?: string
}

/// Every e-prescribing implementation (mock or real) conforms to this.
/// IMPORTANT: this app has no real e-prescribing implementation. Sending a
/// prescription to a pharmacy — and especially EPCS (controlled-substance
/// e-prescribing under 21 CFR Part 1311) — requires a DEA-audited certified
/// vendor (e.g. DoseSpot, NewCrop). See COMPLIANCE.md before implementing a
/// real adapter here.
export interface PrescribingProvider {
  send(request: PrescriptionRequest): Promise<PrescriptionResult>
}
