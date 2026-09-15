import Link from 'next/link'

const steps = [
  {
    n: '1',
    title: 'Create your account',
    body: 'Sign up and review the engagement terms. Everything you enter is confidential and protected by attorney-client privilege once your engagement is accepted.',
  },
  {
    n: '2',
    title: 'Answer the questionnaires',
    body: 'A short questionnaire identifies whether you need a will-based or trust-based plan, then a detailed questionnaire captures your family, assets, and wishes.',
  },
  {
    n: '3',
    title: 'We assemble your documents',
    body: 'A coded document engine — not AI — assembles Florida-specific documents from your answers, using a fixed clause library and issue-spotting drawn from a 36-module attorney checklist.',
  },
  {
    n: '4',
    title: 'An attorney reviews and approves',
    body: 'A licensed Florida attorney reviews every document, addresses the flagged issues, and approves or requests changes before anything is finalized.',
  },
  {
    n: '5',
    title: 'Sign and execute',
    body: 'Once approved, execute your documents with the proper Florida formalities — including remote online notarization where permitted.',
  },
]

const docs = [
  ['Last Will & Testament', 'Self-proving, with guardian and personal representative nominations.'],
  ['Revocable Living Trust', 'With a pour-over will, to avoid probate and keep your affairs private.'],
  ['Durable Power of Attorney', 'Chapter 709 powers, including separately-granted enhanced authority.'],
  ['Health Care Surrogate', 'Designate who makes medical decisions and accesses your records.'],
  ['Living Will', 'Your end-of-life wishes for terminal, end-stage, and vegetative conditions.'],
  ['Special Needs Trust', 'Protect a beneficiary’s eligibility for needs-based benefits.'],
]

const faqs = [
  ['Is this just an AI writing my will?', 'No. Documents are assembled by a deterministic, coded engine from a fixed Florida clause library. The same answers always produce the same document. AI is not used to draft your legal documents.'],
  ['Does an attorney actually review my documents?', 'Yes. No document is released to you or sent for signature until a licensed Florida attorney has reviewed and approved that exact version.'],
  ['Is this valid in Florida?', 'The documents are built to Florida statutory requirements, and you execute them with the required formalities (two witnesses, and a notary where required). Your reviewing attorney confirms this for your situation.'],
]

export default function LandingPage() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-brand-800 text-white">
        <div className="mx-auto max-w-6xl px-4 py-20">
          <p className="text-sm font-medium uppercase tracking-wide text-brand-200">Florida estate planning, done right</p>
          <h1 className="mt-3 max-w-3xl text-4xl font-bold leading-tight md:text-5xl">
            Attorney-reviewed wills and trusts, assembled from your answers.
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-brand-100">
            Answer a guided questionnaire and a coded document engine prepares your Florida estate plan — then a
            licensed attorney reviews and approves every page before you sign.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/register" className="rounded-md bg-white px-6 py-3 font-medium text-brand-800 hover:bg-brand-50">
              Get started
            </Link>
            <Link href="#how-it-works" className="rounded-md border border-brand-400 px-6 py-3 font-medium text-white hover:bg-brand-700">
              See how it works
            </Link>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="text-2xl font-bold text-gray-900">How it works</h2>
        <div className="mt-8 grid gap-6 md:grid-cols-5">
          {steps.map((s) => (
            <div key={s.n} className="rounded-lg border border-gray-100 bg-white p-5 shadow-sm">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-600 font-semibold text-white">
                {s.n}
              </div>
              <h3 className="mt-3 font-semibold text-gray-900">{s.title}</h3>
              <p className="mt-2 text-sm text-gray-600">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Documents */}
      <section id="documents" className="bg-gray-50">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="text-2xl font-bold text-gray-900">Documents we prepare</h2>
          <p className="mt-2 text-gray-600">The right set for your situation is chosen automatically from your answers.</p>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {docs.map(([title, body]) => (
              <div key={title} className="rounded-lg border border-gray-100 bg-white p-5">
                <h3 className="font-semibold text-brand-700">{title}</h3>
                <p className="mt-2 text-sm text-gray-600">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="mx-auto max-w-3xl px-4 py-16">
        <h2 className="text-2xl font-bold text-gray-900">Frequently asked</h2>
        <dl className="mt-8 space-y-6">
          {faqs.map(([q, a]) => (
            <div key={q}>
              <dt className="font-semibold text-gray-900">{q}</dt>
              <dd className="mt-1 text-gray-600">{a}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-10 rounded-lg bg-brand-50 p-6 text-center">
          <p className="text-lg font-medium text-brand-800">Ready to protect your family?</p>
          <Link href="/register" className="mt-4 inline-block rounded-md bg-brand-600 px-6 py-3 font-medium text-white hover:bg-brand-700">
            Create your account
          </Link>
        </div>
      </section>
    </div>
  )
}
