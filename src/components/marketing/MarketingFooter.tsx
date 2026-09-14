import Link from 'next/link'

export function MarketingFooter() {
  return (
    <footer className="border-t border-gray-100 bg-gray-50">
      <div className="mx-auto max-w-6xl px-4 py-8 text-sm text-gray-600">
        <div className="flex flex-col justify-between gap-4 md:flex-row">
          <p>&copy; {new Date().getFullYear()} EstateCreate. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="/legal" className="hover:text-brand-700">
              Legal &amp; Disclaimers
            </Link>
            <Link href="/login" className="hover:text-brand-700">
              Sign in
            </Link>
          </div>
        </div>
        <p className="mt-4 text-xs text-gray-400">
          EstateCreate prepares Florida estate-planning documents from your answers using a coded document
          engine, and every document is reviewed by a licensed Florida attorney before it is finalized. Using
          this service does not create an attorney-client relationship until an engagement is accepted. This
          site is not a substitute for individualized legal advice.
        </p>
      </div>
    </footer>
  )
}
