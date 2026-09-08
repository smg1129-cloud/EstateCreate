import Link from 'next/link'
import { db } from '@/lib/db'
import { requireActor } from '@/lib/session'
import { canViewClientsAndMatters, ForbiddenError } from '@/lib/rbac'
import { StatusBadge } from '@/components/StatusBadge'

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const actor = await requireActor()
  if (!canViewClientsAndMatters(actor)) throw new ForbiddenError()

  const { q } = await searchParams
  const query = (q ?? '').trim()

  const [clients, matters] = query
    ? await Promise.all([
        db.client.findMany({
          where: {
            organizationId: actor.organizationId,
            OR: [
              { name: { contains: query, mode: 'insensitive' } },
              { clientNumber: { contains: query, mode: 'insensitive' } },
            ],
          },
          take: 25,
        }),
        db.matter.findMany({
          where: {
            organizationId: actor.organizationId,
            OR: [
              { matterNumber: { contains: query, mode: 'insensitive' } },
              { title: { contains: query, mode: 'insensitive' } },
            ],
          },
          take: 25,
          include: { client: true },
        }),
      ])
    : [[], []]

  return (
    <div>
      <h1 className="text-xl font-semibold text-slate-900">Search results for &ldquo;{query}&rdquo;</h1>

      <h2 className="mt-6 text-sm font-semibold text-slate-900">Clients</h2>
      <div className="mt-2 overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <tbody>
            {clients.map((c) => (
              <tr key={c.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                <td className="px-4 py-2 font-mono text-xs text-slate-500">{c.clientNumber}</td>
                <td className="px-4 py-2">
                  <Link href={`/clients/${c.id}`} className="text-brand-700 hover:underline">
                    {c.name}
                  </Link>
                </td>
                <td className="px-4 py-2">
                  <StatusBadge status={c.status} />
                </td>
              </tr>
            ))}
            {clients.length === 0 && (
              <tr>
                <td className="px-4 py-6 text-center text-slate-400">No matching clients.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <h2 className="mt-6 text-sm font-semibold text-slate-900">Matters</h2>
      <div className="mt-2 overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <tbody>
            {matters.map((m) => (
              <tr key={m.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                <td className="px-4 py-2 font-mono text-xs text-slate-500">{m.matterNumber}</td>
                <td className="px-4 py-2">
                  <Link href={`/matters/${m.id}`} className="text-brand-700 hover:underline">
                    {m.title}
                  </Link>
                </td>
                <td className="px-4 py-2 text-slate-600">{m.client.name}</td>
                <td className="px-4 py-2">
                  <StatusBadge status={m.status} />
                </td>
              </tr>
            ))}
            {matters.length === 0 && (
              <tr>
                <td className="px-4 py-6 text-center text-slate-400">No matching matters.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
