import Link from 'next/link'
import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { requireActor } from '@/lib/session'
import {
  canEditClientsAndMatters,
  canViewClientsAndMatters,
  canViewContacts,
  canViewNotes,
  canEditNotes,
  canViewDocumentMetadata,
  canEditDocuments,
  canDownloadDocuments,
  ForbiddenError,
} from '@/lib/rbac'
import { StatusBadge } from '@/components/StatusBadge'
import { NotesPanel } from '@/components/NotesPanel'
import { DocumentsPanel } from '@/components/DocumentsPanel'
import { withAudit } from '@/lib/audit'

const TABS = [
  { key: 'overview', label: 'Overview' },
  { key: 'matters', label: 'Matters' },
  { key: 'contacts', label: 'Contacts' },
  { key: 'notes', label: 'Notes' },
  { key: 'documents', label: 'Documents' },
] as const

export default async function ClientDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ clientId: string }>
  searchParams: Promise<{ tab?: string }>
}) {
  const actor = await requireActor()
  if (!canViewClientsAndMatters(actor)) throw new ForbiddenError()

  const { clientId } = await params
  const { tab = 'overview' } = await searchParams

  const client = await db.client.findFirst({
    where: { id: clientId, organizationId: actor.organizationId },
    include: {
      office: true,
      relationshipAttorney: true,
      contacts: { include: { contact: true } },
      matters: { orderBy: { openedDate: 'desc' } },
      notes: { orderBy: { createdAt: 'desc' }, include: { author: true } },
      documents: { orderBy: { createdAt: 'desc' }, include: { uploadedBy: true } },
    },
  })
  if (!client) notFound()

  await withAudit(
    { organizationId: actor.organizationId, actorId: actor.id, action: 'VIEW', entityType: 'Client', entityId: client.id },
    async () => {}
  )

  return (
    <div>
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold text-slate-900">{client.name}</h1>
            <StatusBadge status={client.status} />
          </div>
          <p className="mt-1 text-sm text-slate-500">
            {client.clientNumber} · {client.clientType}
            {client.county ? ` · ${client.county} County` : ''}
          </p>
        </div>
        {canEditClientsAndMatters(actor) && (
          <Link
            href={`/clients/${client.id}/edit`}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
          >
            Edit
          </Link>
        )}
      </div>

      <div className="mt-6 border-b border-slate-200">
        <nav className="-mb-px flex gap-6">
          {TABS.map((t) => (
            <Link
              key={t.key}
              href={`/clients/${client.id}?tab=${t.key}`}
              className={`border-b-2 px-1 pb-2 text-sm font-medium ${
                tab === t.key
                  ? 'border-brand-600 text-brand-700'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              {t.label}
            </Link>
          ))}
        </nav>
      </div>

      <div className="mt-6">
        {tab === 'overview' && (
          <dl className="grid max-w-xl grid-cols-2 gap-x-6 gap-y-3 text-sm">
            <dt className="text-slate-500">Address</dt>
            <dd className="text-slate-900">
              {[client.addressLine1, client.addressLine2, client.city, client.state, client.postalCode]
                .filter(Boolean)
                .join(', ') || '—'}
            </dd>
            <dt className="text-slate-500">Office</dt>
            <dd className="text-slate-900">{client.office?.name ?? '—'}</dd>
            <dt className="text-slate-500">Relationship attorney</dt>
            <dd className="text-slate-900">
              {client.relationshipAttorney
                ? `${client.relationshipAttorney.firstName} ${client.relationshipAttorney.lastName}`
                : '—'}
            </dd>
            <dt className="text-slate-500">Federal EIN</dt>
            <dd className="text-slate-900">{client.federalEin ?? '—'}</dd>
          </dl>
        )}

        {tab === 'matters' && (
          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-2">Matter #</th>
                  <th className="px-4 py-2">Title</th>
                  <th className="px-4 py-2">Practice area</th>
                  <th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2">Opened</th>
                </tr>
              </thead>
              <tbody>
                {client.matters.map((m) => (
                  <tr key={m.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                    <td className="px-4 py-2 font-mono text-xs">
                      <Link href={`/matters/${m.id}`} className="text-brand-700 hover:underline">
                        {m.matterNumber}
                      </Link>
                    </td>
                    <td className="px-4 py-2">{m.title}</td>
                    <td className="px-4 py-2 text-slate-600">{m.practiceArea.replaceAll('_', ' ')}</td>
                    <td className="px-4 py-2">
                      <StatusBadge status={m.status} />
                    </td>
                    <td className="px-4 py-2 text-slate-600">{m.openedDate.toLocaleDateString()}</td>
                  </tr>
                ))}
                {client.matters.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                      No matters yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            <div className="border-t border-slate-200 px-4 py-3">
              <Link href={`/matters/collections/new?clientId=${client.id}`} className="text-sm text-brand-700 hover:underline">
                + New Collections matter
              </Link>
            </div>
          </div>
        )}

        {tab === 'contacts' && canViewContacts(actor) && (
          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-2">Name</th>
                  <th className="px-4 py-2">Role</th>
                  <th className="px-4 py-2">Email</th>
                  <th className="px-4 py-2">Phone</th>
                </tr>
              </thead>
              <tbody>
                {client.contacts.map((cc) => (
                  <tr key={cc.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                    <td className="px-4 py-2">
                      <Link href={`/contacts/${cc.contact.id}`} className="text-brand-700 hover:underline">
                        {cc.contact.firstName} {cc.contact.lastName}
                      </Link>
                      {cc.isPrimary && (
                        <span className="ml-2 rounded bg-brand-50 px-1.5 py-0.5 text-xs text-brand-700">Primary</span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-slate-600">{cc.role}</td>
                    <td className="px-4 py-2 text-slate-600">{cc.contact.email ?? '—'}</td>
                    <td className="px-4 py-2 text-slate-600">{cc.contact.phone ?? '—'}</td>
                  </tr>
                ))}
                {client.contacts.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-slate-400">
                      No contacts linked yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            <div className="border-t border-slate-200 px-4 py-3">
              <Link href={`/contacts/new?clientId=${client.id}`} className="text-sm text-brand-700 hover:underline">
                + Link a contact
              </Link>
            </div>
          </div>
        )}

        {tab === 'notes' && canViewNotes(actor) && (
          <NotesPanel
            notes={client.notes}
            clientId={client.id}
            redirectPath={`/clients/${client.id}?tab=notes`}
            canEdit={canEditNotes(actor)}
          />
        )}
        {tab === 'documents' && (
          <DocumentsPanel
            documents={client.documents}
            clientId={client.id}
            redirectPath={`/clients/${client.id}?tab=documents`}
            canView={canViewDocumentMetadata(actor)}
            canUpload={canEditDocuments(actor)}
            canDownload={canDownloadDocuments(actor)}
          />
        )}
      </div>
    </div>
  )
}
