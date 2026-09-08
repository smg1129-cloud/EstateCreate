import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export default async function ProvidersPage() {
  const providers = await db.provider.findMany({
    include: { user: true, licenses: { where: { status: 'ACTIVE' } } },
  })

  return (
    <main className="mx-auto max-w-4xl px-4 py-16">
      <h1 className="text-3xl font-bold text-gray-900">Our Providers</h1>
      <p className="mt-2 text-gray-600">
        We only let you book with a clinician who holds an active license in your state.
      </p>

      <ul className="mt-10 space-y-6">
        {providers.map((p) => (
          <li key={p.id} className="rounded-lg border border-gray-200 p-5">
            <h2 className="text-lg font-semibold text-gray-900">
              {p.user.firstName} {p.user.lastName}
            </h2>
            <p className="text-sm text-gray-600">{p.specialties.join(', ')}</p>
            {p.bio && <p className="mt-2 text-sm text-gray-600">{p.bio}</p>}
            <p className="mt-3 text-xs text-gray-500">
              Licensed in: {p.licenses.map((l) => l.state).join(', ') || 'No active licenses'}
            </p>
          </li>
        ))}
        {providers.length === 0 && <p className="text-sm text-gray-500">No providers yet.</p>}
      </ul>
    </main>
  )
}
