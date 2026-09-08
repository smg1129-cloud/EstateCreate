import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/session'
import { AppShell } from '@/components/AppShell'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser()
  // Belt-and-suspenders: middleware.ts already blocks this, but a Server
  // Component should never assume that gate ran.
  if (!user) redirect('/login')

  return <AppShell user={user}>{children}</AppShell>
}
