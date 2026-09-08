import Link from 'next/link'
import { db } from '@/lib/db'
import { requireActor } from '@/lib/session'
import { canViewDeadlines, canEditDeadlines, ForbiddenError } from '@/lib/rbac'
import { completeDeadline } from './actions'

export default async function DeadlinesPage({
  searchParams,
}: {
  searchParams: Promise<{ scope?: string }>
}) {
  const actor = await requireActor()
  if (!canViewDeadlines(actor)) throw new ForbiddenError()

  const { scope = 'mine' } = await searchParams

  const deadlines = await db.deadline.findMany({
    where: {
      matter: { organizationId: actor.organizationId },
      status: 'OPEN',
      assignedToId: scope === 'mine' ? actor.id : undefined,
    },
    orderBy: { dueDate: 'asc' },
    take: 200,
    include: { matter: { include: { client: true } }, assignedTo: true },
  })

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-900">Deadlines</h1>
      </div>

      <div className="mt-4 flex gap-4 text-sm">
        <Link href="/deadlines?scope=mine" className={scope === 'mine' ? 'font-semibold text-brand-700' : 'text-slate-500'}>
          My deadlines
        </Link>
        <Link href="/deadlines?scope=all" className={scope === 'all' ? 'font-semibold text-brand-700' : 'text-slate-500'}>
          Firm-wide
        </Link>
      </div>

      <div className="mt-4 overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-2">Due</th>
              <th className="px-4 py-2">Title</th>
              <th className="px-4 py-2">Type</th>
              <th className="px-4 py-2">Matter</th>
              <th className="px-4 py-2">Assigned to</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {deadlines.map((d) => {
              const overdue = d.dueDate < new Date()
              return (
                <tr key={d.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                  <td className={`px-4 py-2 ${overdue ? 'font-semibold text-red-600' : 'text-slate-600'}`}>
                    {d.dueDate.toLocaleDateString()}
                  </td>
                  <td className="px-4 py-2 text-slate-900">{d.title}</td>
                  <td className="px-4 py-2 text-slate-600">{d.type.replaceAll('_', ' ')}</td>
                  <td className="px-4 py-2">
                    <Link href={`/matters/${d.matterId}`} className="text-brand-700 hover:underline">
                      {d.matter.matterNumber}
                    </Link>{' '}
                    <span className="text-slate-500">— {d.matter.client.name}</span>
                  </td>
                  <td className="px-4 py-2 text-slate-600">
                    {d.assignedTo.firstName} {d.assignedTo.lastName}
                  </td>
                  <td className="px-4 py-2">
                    {canEditDeadlines(actor) && (
                      <form action={completeDeadline.bind(null, d.matterId, d.id)}>
                        <button type="submit" className="text-xs text-brand-700 hover:underline">
                          Mark complete
                        </button>
                      </form>
                    )}
                  </td>
                </tr>
              )
            })}
            {deadlines.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                  No open deadlines.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
