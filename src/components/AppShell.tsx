import Link from 'next/link'
import { SignOutButton } from './SignOutButton'

export interface NavLink {
  href: string
  label: string
}

export function AppShell({
  navLinks,
  userLabel,
  roleLabel,
  children,
}: {
  navLinks: NavLink[]
  userLabel: string
  roleLabel: string
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-8">
            <Link href="/" className="text-lg font-semibold text-brand-700">
              Estate<span className="text-brand-500">Create</span>
            </Link>
            <nav className="hidden gap-5 text-sm md:flex" aria-label="Section">
              {navLinks.map((l) => (
                <Link key={l.href} href={l.href} className="text-gray-600 hover:text-brand-700">
                  {l.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <span className="hidden text-gray-500 sm:inline">
              {userLabel} · <span className="font-medium text-gray-700">{roleLabel}</span>
            </span>
            <SignOutButton />
          </div>
        </div>
      </header>
      <div className="mx-auto max-w-6xl px-4 py-8">{children}</div>
    </div>
  )
}
