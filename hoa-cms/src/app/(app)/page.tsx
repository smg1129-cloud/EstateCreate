import Link from 'next/link'
import { getCurrentUser } from '@/lib/session'
import { db } from '@/lib/db'
import { canViewDeadlines } from '@/lib/rbac'

export default async function DashboardPage() {
  const user = await getCurrentUser()

  const deadlines =
    user && canViewDeadlines(user)
      ? await db.deadline.findMany({
          where: { assignedToId: user.id, status: 'OPEN', matter: { organizationId: user.organizationId } },
          orderBy: { dueDate: 'asc' },
          take: 10,
          include: { matter: { include: { client: true } } },
        })
      : []

  return (
    <div>
      <h1 className="text-xl font-semibold text-slate-900">Welcome, {user?.firstName}.</h1>
      <p className="mt-1 text-sm text-slate-500">Signed in as {user?.role}.</p>

      {user && canViewDeadlines(user) && (
        <div className="mt-8">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">My upcoming deadlines</h2>
            <Link href="/deadlines" className="text-sm text-brand-700 hover:underline">
              View all
            </Link>
          </div>
          <div className="mt-3 overflow-hidden rounded-lg border border-slate-200 bg-white">
            <table className="w-full text-left text-sm">
              <tbody>
                {deadlines.map((d) => {
                  const overdue = d.dueDate < new Date()
                  return (
                    <tr key={d.id} className="border-b border-slate-100 last:border-0">
                      <td className={`px-4 py-2 ${overdue ? 'font-semibold text-red-600' : 'text-slate-600'}`}>
                        {d.dueDate.toLocaleDateString()}
                      </td>
                      <td className="px-4 py-2 text-slate-900">{d.title}</td>
                      <td className="px-4 py-2">
                        <Link href={`/matters/${d.matterId}`} className="text-brand-700 hover:underline">
                          {d.matter.matterNumber}
                        </Link>{' '}
                        <span className="text-slate-500">— {d.matter.client.name}</span>
                      </td>
                    </tr>
                  )
                })}
                {deadlines.length === 0 && (
                  <tr>
                    <td className="px-4 py-6 text-center text-slate-400">No open deadlines assigned to you.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
