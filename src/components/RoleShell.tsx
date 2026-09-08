import Link from 'next/link'
import { SignOutButton } from '@/components/SignOutButton'

interface NavItem {
  href: string
  label: string
}

export function RoleShell({
  title,
  userName,
  roleLabel,
  navItems,
  children,
}: {
  title: string
  userName: string
  roleLabel: string
  navItems: NavItem[]
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen">
      <aside className="w-56 shrink-0 border-r border-gray-100 bg-gray-50 p-4">
        <p className="mb-1 text-sm font-semibold text-gray-900">{title}</p>
        <p className="mb-6 text-xs text-gray-500">
          {userName} &middot; {roleLabel}
        </p>
        <nav aria-label="Section">
          <ul className="space-y-1 text-sm">
            {navItems.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="block rounded-md px-3 py-2 text-gray-700 hover:bg-gray-100">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="mt-8">
          <SignOutButton />
        </div>
      </aside>
      <main className="flex-1 p-8">{children}</main>
    </div>
  )
}
