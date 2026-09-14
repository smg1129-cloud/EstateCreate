import { redirect } from 'next/navigation'
import { AppShell } from '@/components/AppShell'
import { getCurrentUserRecord } from '@/lib/session'

export default async function AttorneyLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUserRecord()
  if (!user) redirect('/login')
  if (user.role !== 'ATTORNEY' && user.role !== 'PARALEGAL' && user.role !== 'ADMIN') redirect('/')

  return (
    <AppShell
      userLabel={`${user.firstName} ${user.lastName}`}
      roleLabel={user.role === 'ATTORNEY' ? 'Attorney' : user.role === 'PARALEGAL' ? 'Paralegal' : 'Admin'}
      navLinks={[
        { href: '/attorney', label: 'Review queue' },
        ...(user.role === 'ADMIN' ? [{ href: '/admin', label: 'Admin' }] : []),
      ]}
    >
      {children}
    </AppShell>
  )
}
