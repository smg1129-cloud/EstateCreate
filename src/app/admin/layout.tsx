import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { RoleShell } from '@/components/RoleShell'

const NAV_ITEMS = [
  { href: '/admin', label: 'Overview' },
  { href: '/admin/users', label: 'Users' },
  { href: '/admin/licenses', label: 'Provider licenses' },
  { href: '/admin/audit-log', label: 'Audit log' },
]

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.role !== 'ADMIN') redirect('/login')

  const user = await db.user.findUnique({ where: { id: session.user.id } })
  if (!user) redirect('/login')

  return (
    <RoleShell title="Admin" userName={`${user.firstName} ${user.lastName}`} roleLabel="Admin" navItems={NAV_ITEMS}>
      {children}
    </RoleShell>
  )
}
