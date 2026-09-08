import { db } from '@/lib/db'
import { createStaffUser } from './actions'
import { UserRow } from './UserRow'

export default async function AdminUsersPage() {
  const users = await db.user.findMany({ orderBy: { createdAt: 'desc' } })

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-semibold text-gray-900">Users</h1>

      <table className="mt-6 w-full text-left text-sm">
        <thead className="border-b border-gray-200 text-xs uppercase text-gray-500">
          <tr>
            <th className="py-2">Name</th>
            <th className="py-2">Email</th>
            <th className="py-2">Role</th>
            <th className="py-2">Status</th>
            <th className="py-2">MFA</th>
            <th className="py-2" />
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {users.map((u) => (
            <UserRow key={u.id} user={u} />
          ))}
        </tbody>
      </table>

      <div className="mt-10 max-w-md rounded-lg border border-gray-200 p-4">
        <h2 className="mb-3 text-sm font-semibold text-gray-900">Create staff/clinician/admin account</h2>
        <form action={createStaffUser} className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <input name="firstName" placeholder="First name" required className="rounded-md border border-gray-300 px-2 py-1 text-sm" />
            <input name="lastName" placeholder="Last name" required className="rounded-md border border-gray-300 px-2 py-1 text-sm" />
          </div>
          <input name="email" type="email" placeholder="Email" required className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm" />
          <select name="role" className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm">
            <option value="STAFF">Staff</option>
            <option value="CLINICIAN">Clinician</option>
            <option value="ADMIN">Admin</option>
          </select>
          <input name="npi" placeholder="NPI (clinician only)" className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm" />
          <input name="password" type="password" placeholder="Temporary password (10+ chars)" minLength={10} required className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm" />
          <p className="text-xs text-gray-400">
            This account must complete MFA enrollment on first sign-in before reaching any screen.
          </p>
          <button className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">
            Create account
          </button>
        </form>
      </div>
    </div>
  )
}
