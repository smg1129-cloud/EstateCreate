export const metadata = { title: 'Terms of Service — Meridian Health' }

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16">
      <div className="mb-8 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        Placeholder content — not real terms of service. Needs review by counsel covering telehealth
        informed consent, scope-of-service limitations, emergency-use disclaimers, and state-specific
        telehealth practice requirements before this site handles real patients. Version tag below is
        what <code>ConsentRecord.version</code> stores when a patient acknowledges this page.
      </div>
      <h1 className="text-3xl font-bold text-gray-900">Terms of Service</h1>
      <p className="mt-2 text-sm text-gray-500">Version 2026-01-v1</p>

      <div className="prose prose-sm mt-6 max-w-none text-gray-700">
        <p>
          By using this platform you agree to receive care via telehealth, subject to its limitations
          (no emergency services; some conditions require in-person evaluation). A real version must
          address consent to telehealth treatment, identity verification, prescribing limitations,
          cancellation/no-show policy, billing terms, and dispute resolution.
        </p>
      </div>
    </main>
  )
}
