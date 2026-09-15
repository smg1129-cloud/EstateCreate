import { redirect } from 'next/navigation'
import { AppShell } from '@/components/AppShell'
import { getCurrentUserRecord } from '@/lib/session'

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUserRecord()
  if (!user) redirect('/login')
  if (user.role !== 'CLIENT') redirect('/')

  return (
    <AppShell
      userLabel={`${user.firstName} ${user.lastName}`}
      roleLabel="Client"
      navLinks={[
        { href: '/portal', label: 'Overview' },
        { href: '/portal/documents', label: 'My Documents' },
      ]}
    >
      {children}
    </AppShell>
  )
}
