import { db } from '@/lib/db'
import { LeadCard } from './LeadCard'

const STATUSES = ['NEW', 'CONTACTED', 'QUALIFIED', 'CONVERTED', 'LOST'] as const

export default async function StaffLeadsPage() {
  const leads = await db.lead.findMany({
    orderBy: { createdAt: 'desc' },
    include: { assignedTo: true, communications: { orderBy: { createdAt: 'desc' }, take: 3 } },
  })

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900">Leads</h1>
      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-5">
        {STATUSES.map((status) => (
          <div key={status}>
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">{status}</h2>
            <div className="space-y-3">
              {leads
                .filter((l) => l.status === status)
                .map((lead) => (
                  <LeadCard key={lead.id} lead={lead} />
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
