import Link from 'next/link'
import { db } from '@/lib/db'
import { getCurrentPatientOrRedirect } from '@/lib/currentPatient'

export default async function PortalDashboardPage() {
  const { patient } = await getCurrentPatientOrRedirect()

  const nextAppointment = await db.appointment.findFirst({
    where: { patientId: patient.id, scheduledAt: { gte: new Date() }, status: { not: 'CANCELLED' } },
    orderBy: { scheduledAt: 'asc' },
    include: { provider: { include: { user: true } } },
  })

  const openInvoiceCount = await db.invoice.count({ where: { patientId: patient.id, status: 'OPEN' } })

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-semibold text-gray-900">Welcome back, {patient.user.firstName}</h1>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-gray-200 p-5">
          <h2 className="font-medium text-gray-900">Next appointment</h2>
          {nextAppointment ? (
            <>
              <p className="mt-2 text-sm text-gray-700">
                {new Date(nextAppointment.scheduledAt).toLocaleString(undefined, {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                })}
              </p>
              <p className="text-sm text-gray-500">
                with {nextAppointment.provider.user.firstName} {nextAppointment.provider.user.lastName}
              </p>
              <Link href="/portal/appointments" className="mt-3 inline-block text-sm text-brand-700 underline">
                View details
              </Link>
            </>
          ) : (
            <p className="mt-2 text-sm text-gray-500">Nothing scheduled.</p>
          )}
        </div>

        <div className="rounded-lg border border-gray-200 p-5">
          <h2 className="font-medium text-gray-900">Billing</h2>
          <p className="mt-2 text-sm text-gray-700">
            {openInvoiceCount > 0 ? `${openInvoiceCount} invoice(s) awaiting payment` : 'You are all caught up'}
          </p>
          <Link href="/portal/billing" className="mt-3 inline-block text-sm text-brand-700 underline">
            View billing
          </Link>
        </div>
      </div>
    </div>
  )
}
