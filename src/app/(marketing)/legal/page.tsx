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

      {/*
        FEES & REFUNDS — firm policy the attorney must confirm before going live.
        These terms are written to match the app's flow (a flat fee per document
        charged at checkout, before preparation; refunds supported). Two choices
        are the firm's to finalize and must be reflected here and in the
        engagement letter: (1) at what point each document's fee is EARNED, and
        (2) whether unearned fees sit in operating or trust/IOLTA (Rules
        Regulating The Florida Bar 4-1.5 and 5-1.1). Edit the language below to
        state the firm's actual policy; see COMPLIANCE.md.
      */}
      <h2 className="mt-8 text-xl font-semibold text-gray-900">Fees, payment &amp; refunds</h2>
      <p className="mt-2">
        Documents are offered for a <strong>flat fee per document</strong>. After you
        complete the questionnaires, you are shown the recommended documents and the
        fee for each, and you choose which to purchase. Payment is collected at
        checkout, and <strong>your documents are prepared only after payment is
        received</strong>. Each document&rsquo;s fee covers preparing that document and
        having it reviewed by a licensed Florida attorney; it does not include
        ongoing representation, future amendments, court filings, recording fees,
        notary or witness costs, or trust funding, unless separately agreed in
        writing.
      </p>
      <p className="mt-2">
        <strong>Refunds.</strong> If the firm declines your engagement, determines it
        cannot serve you, or an attorney does not approve a document you paid for and
        cannot deliver an approved version, the fee for each such undelivered document
        is <strong>refunded in full</strong> to your original payment method. If you
        cancel <em>before</em> the firm has begun preparing a document, that
        document&rsquo;s fee is refundable. Once a document has been prepared and
        reviewed by an attorney and made available to you, that document&rsquo;s fee
        has been earned and is non-refundable, except where the firm is unable to
        deliver an attorney-approved version. Paying a fee does not, by itself,
        create an attorney-client relationship or guarantee that any particular
        document will be produced (see below).
      </p>
      <p className="mt-2">
        Refunds are processed through the original payment method within a reasonable
        time after the firm determines a refund is due. Questions about a charge or
        refund can be directed to the firm at any time.
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
