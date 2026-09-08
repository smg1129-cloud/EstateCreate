import Link from 'next/link'
import type { Role } from '@prisma/client'
import { SignOutButton } from '@/components/SignOutButton'

const NAV_ITEMS = [
  { href: '/', label: 'Dashboard' },
  { href: '/clients', label: 'Clients' },
  { href: '/matters', label: 'Matters' },
  { href: '/contacts', label: 'Contacts' },
  { href: '/deadlines', label: 'Deadlines' },
]

export function AppShell({
  children,
  user,
}: {
  children: React.ReactNode
  user: { firstName: string; lastName: string; role: Role }
}) {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-8">
            <span className="text-sm font-semibold text-brand-700">HOA/Condo CMS</span>
            <nav className="flex gap-5">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-sm text-slate-600 hover:text-brand-700"
                >
                  {item.label}
                </Link>
              ))}
              {user.role === 'ADMIN' && (
                <Link href="/admin" className="text-sm text-slate-600 hover:text-brand-700">
                  Admin
                </Link>
              )}
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <form method="GET" action="/search">
              <input
                type="search"
                name="q"
                placeholder="Search clients or matters..."
                className="w-64 rounded-md border border-slate-300 px-3 py-1 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </form>
            <span className="text-sm text-slate-500">
              {user.firstName} {user.lastName}{' '}
              <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-medium text-slate-500">
                {user.role}
              </span>
            </span>
            <SignOutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-6 py-8">{children}</main>
    </div>
  )
}
