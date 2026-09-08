import Link from 'next/link'
import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { requireActor } from '@/lib/session'
import { canViewContacts, ForbiddenError } from '@/lib/rbac'

export default async function ContactDetailPage({ params }: { params: Promise<{ contactId: string }> }) {
  const actor = await requireActor()
  if (!canViewContacts(actor)) throw new ForbiddenError()

  const { contactId } = await params
  const contact = await db.contact.findFirst({
    where: { id: contactId, organizationId: actor.organizationId },
    include: {
      clientLinks: { include: { client: true } },
      matterLinks: { include: { matter: true } },
    },
  })
  if (!contact) notFound()

  return (
    <div>
      <h1 className="text-xl font-semibold text-slate-900">
        {contact.firstName} {contact.lastName}
      </h1>
      <p className="mt-1 text-sm text-slate-500">{contact.contactType.replaceAll('_', ' ')}</p>

      <dl className="mt-6 grid max-w-xl grid-cols-2 gap-x-6 gap-y-3 text-sm">
        <dt className="text-slate-500">Company</dt>
        <dd className="text-slate-900">{contact.company ?? '—'}</dd>
        <dt className="text-slate-500">Email</dt>
        <dd className="text-slate-900">{contact.email ?? '—'}</dd>
        <dt className="text-slate-500">Phone</dt>
        <dd className="text-slate-900">{contact.phone ?? '—'}</dd>
        <dt className="text-slate-500">Mailing address</dt>
        <dd className="text-slate-900">
          {[contact.mailingAddressLine1, contact.city, contact.state, contact.postalCode].filter(Boolean).join(', ') || '—'}
        </dd>
      </dl>

      <h2 className="mt-8 text-sm font-semibold text-slate-900">Linked clients</h2>
      <ul className="mt-2 space-y-1 text-sm">
        {contact.clientLinks.map((cl) => (
          <li key={cl.id}>
            <Link href={`/clients/${cl.client.id}`} className="text-brand-700 hover:underline">
              {cl.client.name}
            </Link>{' '}
            <span className="text-slate-500">— {cl.role}</span>
          </li>
        ))}
        {contact.clientLinks.length === 0 && <li className="text-slate-400">None</li>}
      </ul>

      <h2 className="mt-6 text-sm font-semibold text-slate-900">Linked matters</h2>
      <ul className="mt-2 space-y-1 text-sm">
        {contact.matterLinks.map((ml) => (
          <li key={ml.id}>
            <Link href={`/matters/${ml.matter.id}`} className="text-brand-700 hover:underline">
              {ml.matter.matterNumber}
            </Link>{' '}
            <span className="text-slate-500">— {ml.role}</span>
          </li>
        ))}
        {contact.matterLinks.length === 0 && <li className="text-slate-400">None</li>}
      </ul>
    </div>
  )
}
