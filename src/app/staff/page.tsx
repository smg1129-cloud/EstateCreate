import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export default async function StaffDashboardPage() {
  const session = await getServerSession(authOptions)

  const [newLeads, openTasks, upcomingAppointments] = await Promise.all([
    db.lead.count({ where: { status: 'NEW' } }),
    db.staffTask.count({ where: { assignedToId: session!.user.id, completedAt: null } }),
    db.appointment.count({ where: { scheduledAt: { gte: new Date() }, status: 'SCHEDULED' } }),
  ])

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900">Staff dashboard</h1>
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="New leads" value={newLeads} />
        <StatCard label="Your open tasks" value={openTasks} />
        <StatCard label="Upcoming appointments" value={upcomingAppointments} />
      </div>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-gray-200 p-5">
      <p className="text-3xl font-semibold text-gray-900">{value}</p>
      <p className="text-sm text-gray-500">{label}</p>
    </div>
  )
}
