import { RoleShell } from '@/components/RoleShell'
import { getCurrentProviderOrRedirect } from '@/lib/currentProvider'

const NAV_ITEMS = [
  { href: '/clinician', label: "Today's schedule" },
  { href: '/clinician/schedule', label: 'Full schedule' },
]

export default async function ClinicianLayout({ children }: { children: React.ReactNode }) {
  const { provider } = await getCurrentProviderOrRedirect()

  return (
    <RoleShell
      title="Clinician Portal"
      userName={`${provider.user.firstName} ${provider.user.lastName}`}
      roleLabel="Clinician"
      navItems={NAV_ITEMS}
    >
      {children}
    </RoleShell>
  )
}
