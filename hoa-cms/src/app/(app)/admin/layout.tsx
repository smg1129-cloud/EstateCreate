import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getCurrentUser } from '@/lib/session'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser()
  // Belt-and-suspenders: middleware.ts already blocks non-admins from
  // /admin, but a Server Component should never assume that gate ran.
  if (!user || user.role !== 'ADMIN') redirect('/')

  return (
    <div>
      <nav className="mb-6 flex gap-5 border-b border-slate-200 pb-3 text-sm">
        <Link href="/admin/users" className="text-slate-600 hover:text-brand-700">
          Users
        </Link>
        <Link href="/admin/audit-log" className="text-slate-600 hover:text-brand-700">
          Audit Log
        </Link>
      </nav>
      {children}
    </div>
  )
}
