import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/session'
import { requireRole } from '@/lib/rbac'
import { db } from '@/lib/db'

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-gray-100 bg-white p-5">
      <p className="text-3xl font-bold text-gray-900">{value}</p>
      <p className="mt-1 text-sm text-gray-500">{label}</p>
    </div>
  )
}

export default async function AdminOverview() {
  const actor = await getCurrentUser()
  if (!actor) redirect('/login')
  requireRole(actor, ['ADMIN'])
  const org = actor.organizationId

  const [clients, staff, inReview, approved, completed] = await Promise.all([
    db.user.count({ where: { organizationId: org, role: 'CLIENT' } }),
    db.user.count({ where: { organizationId: org, role: { in: ['ATTORNEY', 'PARALEGAL', 'ADMIN'] } } }),
    db.estateMatter.count({ where: { organizationId: org, status: 'IN_REVIEW' } }),
    db.estateMatter.count({ where: { organizationId: org, status: 'APPROVED' } }),
    db.estateMatter.count({ where: { organizationId: org, status: 'COMPLETED' } }),
  ])

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Firm overview</h1>
      <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <Stat label="Clients" value={clients} />
        <Stat label="Staff" value={staff} />
        <Stat label="In review" value={inReview} />
        <Stat label="Approved" value={approved} />
        <Stat label="Completed" value={completed} />
      </div>
      <div className="flex gap-4 text-sm">
        <Link href="/admin/users" className="font-medium text-brand-700 hover:underline">Manage users →</Link>
        <Link href="/admin/audit-log" className="font-medium text-brand-700 hover:underline">View audit log →</Link>
        <Link href="/attorney" className="font-medium text-brand-700 hover:underline">Open review queue →</Link>
      </div>
    </div>
  )
}
