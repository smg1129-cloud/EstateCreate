export const metadata = { title: 'Legal & Disclaimers — EstateCreate' }

export default function LegalPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 text-gray-700">
      <h1 className="text-3xl font-bold text-gray-900">Legal &amp; Disclaimers</h1>

      <h2 className="mt-8 text-xl font-semibold text-gray-900">How your documents are prepared</h2>
      <p className="mt-2">
        EstateCreate assembles your documents from your questionnaire answers using a deterministic, coded
        document engine and a fixed library of Florida-specific clauses. The engine does not use artificial
        intelligence to draft your legal documents; for a given set of answers it produces the same document
        every time.
      </p>

      <h2 className="mt-8 text-xl font-semibold text-gray-900">Attorney review</h2>
      <p className="mt-2">
        Every document is reviewed by a licensed Florida attorney before it is finalized. No document is
        released to you or sent for signature until an attorney has approved that specific version.
      </p>

      <h2 className="mt-8 text-xl font-semibold text-gray-900">No legal advice until engagement</h2>
      <p className="mt-2">
        Browsing this site, creating an account, and completing the questionnaires do not by themselves create
        an attorney-client relationship. That relationship begins only when the firm accepts your engagement.
        Until then, information you submit is kept confidential but is not yet privileged legal advice.
      </p>

      <h2 className="mt-8 text-xl font-semibold text-gray-900">Execution formalities</h2>
      <p className="mt-2">
        Florida law imposes strict formalities for executing wills, trusts, and powers of attorney (for
        example, two witnesses and, for some documents, a notary). Your documents include step-by-step
        execution instructions, and remote online notarization is available where permitted. A document is not
        legally effective until it is properly executed.
      </p>

      <p className="mt-8 text-sm text-gray-500">
        This page is informational and is not itself legal advice. Statutory references reflect Florida and
        federal law and should be confirmed against the current statute.
      </p>
    </div>
  )
}
