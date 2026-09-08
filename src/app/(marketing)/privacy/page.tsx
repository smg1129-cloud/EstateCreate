export const metadata = { title: 'Privacy Notice — Meridian Health' }

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16">
      <div className="mb-8 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        Placeholder content — this is not a real Notice of Privacy Practices. It must be drafted or
        reviewed by healthcare privacy counsel before this site handles real patient data. Version tag
        below is what <code>ConsentRecord.version</code> stores when a patient acknowledges this page.
      </div>
      <h1 className="text-3xl font-bold text-gray-900">Notice of Privacy Practices</h1>
      <p className="mt-2 text-sm text-gray-500">Version 2026-01-v1</p>

      <div className="prose prose-sm mt-6 max-w-none text-gray-700">
        <p>
          This notice describes how medical information about you may be used and disclosed, and how you
          can get access to this information. A real notice must cover, at minimum: the categories of
          protected health information (PHI) collected, permitted uses and disclosures (treatment,
          payment, healthcare operations), your rights under HIPAA (access, amendment, accounting of
          disclosures, restriction requests, breach notification), how to file a complaint, and the
          organization&apos;s effective date and contact information.
        </p>
      </div>
    </main>
  )
}
