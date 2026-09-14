import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/session'
import { requireRole } from '@/lib/rbac'
import { db } from '@/lib/db'
import { CreateStaffForm } from './CreateStaffForm'
import { setUserStatus } from './actions'

const STATUS_TONE: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-800',
  SUSPENDED: 'bg-amber-100 text-amber-800',
  DEACTIVATED: 'bg-gray-100 text-gray-600',
}

export default async function AdminUsersPage() {
  const actor = await getCurrentUser()
  if (!actor) redirect('/login')
  requireRole(actor, ['ADMIN'])

  const users = await db.user.findMany({
    where: { organizationId: actor.organizationId },
    orderBy: [{ role: 'asc' }, { lastName: 'asc' }],
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Users</h1>
      </div>
      <CreateStaffForm />

      <div className="overflow-hidden rounded-lg border border-gray-100 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">MFA</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.map((u) => (
              <tr key={u.id}>
                <td className="px-4 py-3 font-medium text-gray-900">
                  {u.firstName} {u.lastName}
                  {u.barNumber && <span className="ml-1 text-xs text-gray-400">Bar #{u.barNumber}</span>}
                </td>
                <td className="px-4 py-3 text-gray-600">{u.email}</td>
                <td className="px-4 py-3 text-gray-600">{u.role}</td>
                <td className="px-4 py-3">
                  {u.role === 'CLIENT' ? (
                    <span className="text-xs text-gray-400">n/a</span>
                  ) : u.mfaEnabled ? (
                    <span className="text-xs text-green-700">Enrolled</span>
                  ) : (
                    <span className="text-xs text-amber-700">Pending</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_TONE[u.status]}`}>{u.status}</span>
                </td>
                <td className="px-4 py-3 text-right">
                  {u.id !== actor.id && (
                    <form action={setUserStatus} className="inline">
                      <input type="hidden" name="userId" value={u.id} />
                      <input type="hidden" name="status" value={u.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE'} />
                      <button className="text-xs font-medium text-brand-700 hover:underline">
                        {u.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
                      </button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
