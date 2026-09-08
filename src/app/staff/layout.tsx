import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { RoleShell } from '@/components/RoleShell'

const NAV_ITEMS = [
  { href: '/staff', label: 'Dashboard' },
  { href: '/staff/leads', label: 'Leads' },
  { href: '/staff/patients', label: 'Patients' },
  { href: '/staff/tasks', label: 'Tasks' },
]

export default async function StaffLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)
  if (!session?.user || !['STAFF', 'ADMIN'].includes(session.user.role)) redirect('/login')

  const user = await db.user.findUnique({ where: { id: session.user.id } })
  if (!user) redirect('/login')

  return (
    <RoleShell title="Staff CRM" userName={`${user.firstName} ${user.lastName}`} roleLabel={user.role} navItems={NAV_ITEMS}>
      {children}
    </RoleShell>
  )
}
