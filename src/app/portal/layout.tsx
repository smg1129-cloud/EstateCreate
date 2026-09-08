import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { RoleShell } from '@/components/RoleShell'

const NAV_ITEMS = [
  { href: '/portal', label: 'Dashboard' },
  { href: '/portal/appointments', label: 'Appointments' },
  { href: '/portal/records', label: 'My Records' },
  { href: '/portal/billing', label: 'Billing' },
  { href: '/portal/messages', label: 'Messages' },
  { href: '/portal/profile', label: 'Profile' },
]

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)
  // Belt-and-suspenders: middleware.ts already enforces role-based routing,
  // but server components/layouts must never assume that ran.
  if (!session?.user || session.user.role !== 'PATIENT') redirect('/login')

  const user = await db.user.findUnique({ where: { id: session.user.id } })
  if (!user) redirect('/login')

  return (
    <RoleShell title="Patient Portal" userName={`${user.firstName} ${user.lastName}`} roleLabel="Patient" navItems={NAV_ITEMS}>
      {children}
    </RoleShell>
  )
}
