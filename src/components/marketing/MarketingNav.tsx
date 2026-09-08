import Link from 'next/link'

const links = [
  { href: '/services', label: 'Services' },
  { href: '/providers', label: 'Our Providers' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
]

export function MarketingNav() {
  return (
    <header className="border-b border-gray-100">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4" aria-label="Main">
        <Link href="/" className="text-lg font-semibold text-brand-700">
          Meridian Health
        </Link>
        <ul className="hidden gap-6 text-sm text-gray-700 md:flex">
          {links.map((link) => (
            <li key={link.href}>
              <Link href={link.href} className="hover:text-brand-700">
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-sm font-medium text-gray-700 hover:text-brand-700">
            Sign in
          </Link>
          <Link
            href="/book"
            className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
          >
            Book a visit
          </Link>
        </div>
      </nav>
    </header>
  )
}
