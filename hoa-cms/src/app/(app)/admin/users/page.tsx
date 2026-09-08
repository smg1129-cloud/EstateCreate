import { db } from '@/lib/db'
import { requireActor } from '@/lib/session'
import { canManageUsers, ForbiddenError } from '@/lib/rbac'
import { AutoSubmitSelect } from '@/components/AutoSubmitSelect'
import { createUser, updateUserRole, updateUserStatus } from './actions'

const ROLES = ['ADMIN', 'ATTORNEY', 'PARALEGAL', 'BILLING', 'READONLY'] as const
const INPUT = 'mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm'

export default async function AdminUsersPage() {
  const actor = await requireActor()
  if (!canManageUsers(actor)) throw new ForbiddenError()

  const [users, offices] = await Promise.all([
    db.user.findMany({ where: { organizationId: actor.organizationId }, orderBy: { firstName: 'asc' }, include: { office: true } }),
    db.office.findMany({ where: { organizationId: actor.organizationId } }),
  ])

  return (
    <div>
      <h1 className="text-xl font-semibold text-slate-900">Users</h1>

      <div className="mt-4 overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">Email</th>
              <th className="px-4 py-2">Office</th>
              <th className="px-4 py-2">Role</th>
              <th className="px-4 py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-slate-100 last:border-0">
                <td className="px-4 py-2 text-slate-900">
                  {u.firstName} {u.lastName}
                </td>
                <td className="px-4 py-2 text-slate-600">{u.email}</td>
                <td className="px-4 py-2 text-slate-600">{u.office?.name ?? '—'}</td>
                <td className="px-4 py-2">
                  {u.id === actor.id ? (
                    <span className="text-slate-600">{u.role} (you)</span>
                  ) : (
                    <form action={updateUserRole.bind(null, u.id)}>
                      <AutoSubmitSelect
                        name="role"
                        defaultValue={u.role}
                        options={ROLES}
                        className="rounded-md border border-slate-300 px-2 py-1 text-xs"
                      />
                    </form>
                  )}
                </td>
                <td className="px-4 py-2">
                  {u.id === actor.id ? (
                    <span className="text-slate-600">{u.status}</span>
                  ) : (
                    <form action={updateUserStatus.bind(null, u.id)}>
                      <AutoSubmitSelect
                        name="status"
                        defaultValue={u.status}
                        options={['ACTIVE', 'SUSPENDED', 'DEACTIVATED']}
                        className="rounded-md border border-slate-300 px-2 py-1 text-xs"
                      />
                    </form>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="mt-8 text-sm font-semibold text-slate-900">Add user</h2>
      <form action={createUser} className="mt-3 max-w-xl space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-700" htmlFor="firstName">First name</label>
            <input id="firstName" name="firstName" required className={INPUT} />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700" htmlFor="lastName">Last name</label>
            <input id="lastName" name="lastName" required className={INPUT} />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-700" htmlFor="email">Email</label>
          <input id="email" name="email" type="email" required className={INPUT} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-700" htmlFor="role">Role</label>
            <select id="role" name="role" className={INPUT} defaultValue="PARALEGAL">
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700" htmlFor="officeId">Office</label>
            <select id="officeId" name="officeId" className={INPUT} defaultValue="">
              <option value="">None</option>
              {offices.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-700" htmlFor="barNumber">Florida Bar # (attorneys)</label>
          <input id="barNumber" name="barNumber" className={INPUT} />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-700" htmlFor="password">Temporary password</label>
          <input id="password" name="password" type="password" required minLength={8} className={INPUT} />
        </div>
        <button type="submit" className="rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700">
          Create user
        </button>
      </form>
    </div>
  )
}
