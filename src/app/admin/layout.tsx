import { redirect } from 'next/navigation'
import { AppShell } from '@/components/AppShell'
import { getCurrentUserRecord } from '@/lib/session'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUserRecord()
  if (!user) redirect('/login')
  if (user.role !== 'ADMIN') redirect('/')

  return (
    <AppShell
      userLabel={`${user.firstName} ${user.lastName}`}
      roleLabel="Admin"
      navLinks={[
        { href: '/admin', label: 'Overview' },
        { href: '/admin/users', label: 'Users' },
        { href: '/admin/audit-log', label: 'Audit log' },
        { href: '/attorney', label: 'Review queue' },
      ]}
    >
      {children}
    </AppShell>
  )
}
