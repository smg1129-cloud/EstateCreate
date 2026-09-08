import Link from 'next/link'

export default function AdminHomePage() {
  return (
    <div>
      <h1 className="text-xl font-semibold text-slate-900">Admin</h1>
      <div className="mt-4 flex gap-4 text-sm">
        <Link href="/admin/users" className="text-brand-700 hover:underline">
          Manage users →
        </Link>
        <Link href="/admin/audit-log" className="text-brand-700 hover:underline">
          View audit log →
        </Link>
      </div>
    </div>
  )
}
