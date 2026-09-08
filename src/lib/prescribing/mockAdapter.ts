import crypto from 'crypto'
import type { PrescribingProvider, PrescriptionRequest, PrescriptionResult } from './types'

/// Local-dev stand-in only. Simulates a vendor accepting the prescription
/// and returning a reference id — it never contacts a pharmacy or any real
/// e-prescribing network. Controlled-substance ("isControlled") requests
/// are flagged clearly in the UI (see PrescribeForm.tsx) precisely because
/// this mock must never be mistaken for EPCS-capable infrastructure.
export class MockPrescribingAdapter implements PrescribingProvider {
  async send(request: PrescriptionRequest): Promise<PrescriptionResult> {
    return {
      externalVendorRef: `MOCK-${crypto.randomUUID()}`,
      status: 'SENT',
    }
  }
}
