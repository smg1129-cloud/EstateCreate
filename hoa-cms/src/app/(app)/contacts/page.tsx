import Link from 'next/link'
import { db } from '@/lib/db'
import { requireActor } from '@/lib/session'
import { canViewContacts, ForbiddenError } from '@/lib/rbac'

export default async function ContactsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const actor = await requireActor()
  if (!canViewContacts(actor)) throw new ForbiddenError()

  const { q } = await searchParams

  const contacts = await db.contact.findMany({
    where: {
      organizationId: actor.organizationId,
      ...(q
        ? {
            OR: [
              { firstName: { contains: q, mode: 'insensitive' } },
              { lastName: { contains: q, mode: 'insensitive' } },
              { company: { contains: q, mode: 'insensitive' } },
            ],
          }
        : {}),
    },
    orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
    take: 100,
  })

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-900">Contacts</h1>
        <Link
          href="/contacts/new"
          className="rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700"
        >
          New Contact
        </Link>
      </div>

      <form method="GET" className="mt-4">
        <input
          type="search"
          name="q"
          defaultValue={q ?? ''}
          placeholder="Search by name or company..."
          className="w-80 rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
      </form>

      <div className="mt-4 overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">Type</th>
              <th className="px-4 py-2">Company</th>
              <th className="px-4 py-2">Email</th>
              <th className="px-4 py-2">Phone</th>
            </tr>
          </thead>
          <tbody>
            {contacts.map((c) => (
              <tr key={c.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                <td className="px-4 py-2">
                  <Link href={`/contacts/${c.id}`} className="font-medium text-brand-700 hover:underline">
                    {c.firstName} {c.lastName}
                  </Link>
                </td>
                <td className="px-4 py-2 text-slate-600">{c.contactType.replaceAll('_', ' ')}</td>
                <td className="px-4 py-2 text-slate-600">{c.company ?? '—'}</td>
                <td className="px-4 py-2 text-slate-600">{c.email ?? '—'}</td>
                <td className="px-4 py-2 text-slate-600">{c.phone ?? '—'}</td>
              </tr>
            ))}
            {contacts.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                  No contacts found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
