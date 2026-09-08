import Link from 'next/link'

export function MarketingFooter() {
  return (
    <footer className="border-t border-gray-100 bg-gray-50">
      <div className="mx-auto max-w-6xl px-4 py-8 text-sm text-gray-600">
        <div className="flex flex-col justify-between gap-4 md:flex-row">
          <p>&copy; {new Date().getFullYear()} Meridian Health Telehealth Clinic. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="/privacy" className="hover:text-brand-700">
              Privacy Notice
            </Link>
            <Link href="/terms" className="hover:text-brand-700">
              Terms of Service
            </Link>
            <Link href="/contact" className="hover:text-brand-700">
              Contact
            </Link>
          </div>
        </div>
        <p className="mt-4 text-xs text-gray-400">
          If you are experiencing a medical emergency, call 911 or go to your nearest emergency room. This
          platform is not for emergency use.
        </p>
      </div>
    </footer>
  )
}
