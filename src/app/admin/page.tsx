import { db } from '@/lib/db'

export default async function AdminOverviewPage() {
  const [userCount, patientCount, expiringLicenses, recentAuditCount] = await Promise.all([
    db.user.count(),
    db.patient.count(),
    db.providerLicense.count({
      where: { status: 'ACTIVE', expiresAt: { lt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 60) } },
    }),
    db.auditLog.count({ where: { createdAt: { gte: new Date(Date.now() - 1000 * 60 * 60 * 24) } } }),
  ])

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900">Admin overview</h1>
      <div className="mt-6 grid gap-4 sm:grid-cols-4">
        <StatCard label="Total users" value={userCount} />
        <StatCard label="Total patients" value={patientCount} />
        <StatCard label="Licenses expiring in 60 days" value={expiringLicenses} />
        <StatCard label="Audit events (24h)" value={recentAuditCount} />
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
