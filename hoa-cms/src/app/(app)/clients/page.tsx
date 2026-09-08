import Link from 'next/link'
import { db } from '@/lib/db'
import { requireActor } from '@/lib/session'
import { canViewClientsAndMatters } from '@/lib/rbac'
import { ForbiddenError } from '@/lib/rbac'
import { StatusBadge } from '@/components/StatusBadge'

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const actor = await requireActor()
  if (!canViewClientsAndMatters(actor)) throw new ForbiddenError()

  const { q } = await searchParams

  const clients = await db.client.findMany({
    where: {
      organizationId: actor.organizationId,
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: 'insensitive' } },
              { clientNumber: { contains: q, mode: 'insensitive' } },
            ],
          }
        : {}),
    },
    orderBy: { name: 'asc' },
    take: 100,
    include: { _count: { select: { matters: true } } },
  })

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-900">Clients</h1>
        <Link
          href="/clients/new"
          className="rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700"
        >
          New Client
        </Link>
      </div>

      <form method="GET" className="mt-4">
        <input
          type="search"
          name="q"
          defaultValue={q ?? ''}
          placeholder="Search by name or client number..."
          className="w-80 rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
      </form>

      <div className="mt-4 overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-2">Client #</th>
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">Type</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Matters</th>
            </tr>
          </thead>
          <tbody>
            {clients.map((c) => (
              <tr key={c.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                <td className="px-4 py-2 font-mono text-xs text-slate-500">
                  <Link href={`/clients/${c.id}`} className="text-brand-700 hover:underline">
                    {c.clientNumber}
                  </Link>
                </td>
                <td className="px-4 py-2">
                  <Link href={`/clients/${c.id}`} className="font-medium text-slate-900 hover:text-brand-700">
                    {c.name}
                  </Link>
                </td>
                <td className="px-4 py-2 text-slate-600">{c.clientType}</td>
                <td className="px-4 py-2">
                  <StatusBadge status={c.status} />
                </td>
                <td className="px-4 py-2 text-slate-600">{c._count.matters}</td>
              </tr>
            ))}
            {clients.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                  No clients found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
