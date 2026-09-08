import { createPrescription } from './prescribe'

export function PrescribeForm({ patientId }: { patientId: string }) {
  return (
    <form action={createPrescription} className="space-y-2 rounded-lg border border-gray-200 p-4">
      <input type="hidden" name="patientId" value={patientId} />
      <p className="text-xs font-medium uppercase text-gray-500">New prescription</p>
      <div className="rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-900">
        Demo only — routed through a mock adapter, not a real pharmacy network. Controlled-substance
        e-prescribing (EPCS) requires a DEA-certified vendor before this can be used with real patients.
        See COMPLIANCE.md.
      </div>
      <div className="grid grid-cols-2 gap-2">
        <input name="medicationName" placeholder="Medication" required className="rounded-md border border-gray-300 px-2 py-1 text-sm" />
        <input name="dosage" placeholder="Dosage" required className="rounded-md border border-gray-300 px-2 py-1 text-sm" />
        <input name="quantity" placeholder="Quantity" required className="rounded-md border border-gray-300 px-2 py-1 text-sm" />
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input type="checkbox" name="isControlled" />
          Controlled substance
        </label>
      </div>
      <textarea name="directions" placeholder="Directions for use" required rows={2} className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm" />
      <button className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">
        Send prescription
      </button>
    </form>
  )
}
