import Link from 'next/link'
import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { requireActor } from '@/lib/session'
import {
  canViewClientsAndMatters,
  canViewOwnerLedger,
  canEditOwnerLedger,
  canTransitionCollectionsStatus,
  canViewCertifiedMail,
  canEditCertifiedMail,
  canViewFirmLedger,
  canEditFirmLedger,
  canViewDeadlines,
  canEditDeadlines,
  canViewNotes,
  canEditNotes,
  canViewDocumentMetadata,
  canEditDocuments,
  canDownloadDocuments,
  ForbiddenError,
} from '@/lib/rbac'
import { allowedNextStatuses } from '@/lib/collections/stateMachine'
import { StatusBadge } from '@/components/StatusBadge'
import { NotesPanel } from '@/components/NotesPanel'
import { DocumentsPanel } from '@/components/DocumentsPanel'
import { StatusPipeline } from '@/components/collections/StatusPipeline'
import { withAudit } from '@/lib/audit'
import {
  addOwnerLedgerEntry,
  transitionCollectionsStatus,
  sendCertifiedMail,
  simulateCertifiedMailDelivery,
  addFirmLedgerEntry,
  syncFirmLedgerEntry,
} from '../actions'
import { completeDeadline, createDeadline } from '../../../deadlines/actions'

const TABS = [
  { key: 'overview', label: 'Overview' },
  { key: 'ledger', label: 'Owner Ledger' },
  { key: 'billing', label: 'Firm Billing' },
  { key: 'linked', label: 'Linked Matters' },
  { key: 'mail', label: 'Certified Mail' },
  { key: 'documents', label: 'Documents' },
  { key: 'notes', label: 'Notes' },
  { key: 'deadlines', label: 'Deadlines' },
] as const

function centsToDisplay(cents: number): string {
  const dollars = cents / 100
  return dollars.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
}

export default async function CollectionsMatterDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ matterId: string }>
  searchParams: Promise<{ tab?: string }>
}) {
  const actor = await requireActor()
  if (!canViewClientsAndMatters(actor)) throw new ForbiddenError()

  const { matterId } = await params
  const { tab = 'overview' } = await searchParams

  const matter = await db.matter.findFirst({
    where: { id: matterId, organizationId: actor.organizationId, practiceArea: 'COLLECTIONS' },
    include: {
      client: true,
      responsibleAttorney: true,
      assignedParalegal: true,
      contacts: { include: { contact: true } },
      childMatters: { include: { bankruptcyDetail: true, evictionDetail: true } },
      certifiedMailings: { orderBy: { mailedDate: 'desc' } },
      deadlines: { orderBy: { dueDate: 'asc' }, include: { assignedTo: true } },
      notes: { orderBy: { createdAt: 'desc' }, include: { author: true } },
      documents: { orderBy: { createdAt: 'desc' }, include: { uploadedBy: true } },
      ledgerEntries: { orderBy: { entryDate: 'desc' }, include: { createdBy: true } },
      collectionsDetail: {
        include: {
          liens: { orderBy: { recordedDate: 'desc' } },
          paymentPlans: { orderBy: { createdAt: 'desc' } },
          ledgerEntries: { orderBy: { entryDate: 'desc' }, include: { createdBy: true } },
        },
      },
    },
  })
  if (!matter || !matter.collectionsDetail) notFound()
  const detail = matter.collectionsDetail

  await withAudit(
    { organizationId: actor.organizationId, actorId: actor.id, action: 'VIEW', entityType: 'Matter', entityId: matter.id },
    async () => {}
  )

  const staff =
    tab === 'deadlines'
      ? await db.user.findMany({ where: { organizationId: actor.organizationId, status: 'ACTIVE' }, orderBy: { firstName: 'asc' } })
      : []

  const owner = matter.contacts.find((c) => c.role === 'Primary Owner')?.contact
  const nextStatuses = allowedNextStatuses(detail.status)
  const permittedTargets = nextStatuses.filter((s) => canTransitionCollectionsStatus(actor, s))
  const boundTransition = transitionCollectionsStatus.bind(null, matter.id)
  const boundLedgerEntry = addOwnerLedgerEntry.bind(null, matter.id)

  return (
    <div>
      <div className="flex items-center gap-2">
        <h1 className="text-xl font-semibold text-slate-900">{matter.title}</h1>
        <StatusBadge status={matter.status} />
      </div>
      <p className="mt-1 text-sm text-slate-500">
        {matter.matterNumber} ·{' '}
        <Link href={`/clients/${matter.clientId}`} className="text-brand-700 hover:underline">
          {matter.client.name}
        </Link>{' '}
        · {detail.unitAddressLine1}, {detail.unitCity}, {detail.unitState} {detail.unitPostalCode}
        {owner && ` · Owner: ${owner.firstName} ${owner.lastName}`}
      </p>

      {detail.bankruptcyStayActive && (
        <div className="mt-4 rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <strong>Bankruptcy stay active.</strong> The federal automatic stay halts collection actions on this
          matter absent relief from the bankruptcy court. Forward pipeline transitions require an explicit
          override, which is logged to the audit trail.
        </div>
      )}

      <div className="mt-6 border-b border-slate-200">
        <nav className="-mb-px flex gap-6 overflow-x-auto">
          {TABS.map((t) => (
            <Link
              key={t.key}
              href={`/matters/collections/${matter.id}?tab=${t.key}`}
              className={`whitespace-nowrap border-b-2 px-1 pb-2 text-sm font-medium ${
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
          <div className="grid grid-cols-2 gap-8">
            <div>
              <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                <dt className="text-slate-500">Responsible attorney</dt>
                <dd className="text-slate-900">
                  {matter.responsibleAttorney.firstName} {matter.responsibleAttorney.lastName}
                </dd>
                <dt className="text-slate-500">Assigned paralegal</dt>
                <dd className="text-slate-900">
                  {matter.assignedParalegal
                    ? `${matter.assignedParalegal.firstName} ${matter.assignedParalegal.lastName}`
                    : '—'}
                </dd>
                <dt className="text-slate-500">Current balance</dt>
                <dd className="font-semibold text-slate-900">{centsToDisplay(detail.currentBalanceCents)}</dd>
                <dt className="text-slate-500">Payment plan</dt>
                <dd className="text-slate-900">{detail.paymentPlanActive ? 'Active' : 'None'}</dd>
                {detail.caseNumber && (
                  <>
                    <dt className="text-slate-500">Case number</dt>
                    <dd className="text-slate-900">{detail.caseNumber}</dd>
                    <dt className="text-slate-500">Court</dt>
                    <dd className="text-slate-900">{detail.court ?? '—'}</dd>
                  </>
                )}
                {detail.judgmentAmountCents != null && (
                  <>
                    <dt className="text-slate-500">Judgment amount</dt>
                    <dd className="text-slate-900">{centsToDisplay(detail.judgmentAmountCents)}</dd>
                  </>
                )}
                {detail.saleHeldDate && (
                  <>
                    <dt className="text-slate-500">Sale price</dt>
                    <dd className="text-slate-900">
                      {detail.salePriceCents != null ? centsToDisplay(detail.salePriceCents) : '—'}
                    </dd>
                  </>
                )}
              </dl>

              {detail.liens.length > 0 && (
                <div className="mt-6">
                  <h2 className="text-sm font-semibold text-slate-900">Liens</h2>
                  <ul className="mt-2 space-y-1 text-sm text-slate-700">
                    {detail.liens.map((l) => (
                      <li key={l.id}>
                        Recorded {l.recordedDate.toLocaleDateString()} — OR {l.orBook}/{l.orPage} —{' '}
                        {centsToDisplay(l.amountCents)}
                        {l.releasedDate && ' (released)'}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <h2 className="text-sm font-semibold text-slate-900">Pipeline</h2>
              <p className="mt-1 text-xs text-slate-500">
                Last changed {detail.statusChangedAt.toLocaleDateString()}
              </p>
              <div className="mt-4">
                <StatusPipeline
                  currentStatus={detail.status}
                  allowedNext={nextStatuses}
                  permittedTargets={permittedTargets}
                  bankruptcyStayActive={detail.bankruptcyStayActive}
                  action={boundTransition}
                />
              </div>
            </div>
          </div>
        )}

        {tab === 'ledger' && canViewOwnerLedger(actor) && (
          <div>
            <div className="mb-4 rounded-lg border border-slate-200 bg-white p-4">
              <span className="text-sm text-slate-500">Current balance</span>
              <div className="text-2xl font-semibold text-slate-900">{centsToDisplay(detail.currentBalanceCents)}</div>
            </div>

            <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-2">Date</th>
                    <th className="px-4 py-2">Type</th>
                    <th className="px-4 py-2">Description</th>
                    <th className="px-4 py-2">Entered by</th>
                    <th className="px-4 py-2 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {detail.ledgerEntries.map((e) => (
                    <tr key={e.id} className="border-b border-slate-100 last:border-0">
                      <td className="px-4 py-2 text-slate-600">{e.entryDate.toLocaleDateString()}</td>
                      <td className="px-4 py-2 text-slate-600">{e.entryType.replaceAll('_', ' ')}</td>
                      <td className="px-4 py-2 text-slate-600">{e.description ?? '—'}</td>
                      <td className="px-4 py-2 text-slate-600">
                        {e.createdBy.firstName} {e.createdBy.lastName}
                      </td>
                      <td className={`px-4 py-2 text-right font-mono ${e.amountCents < 0 ? 'text-emerald-700' : 'text-slate-900'}`}>
                        {e.amountCents < 0 ? '-' : ''}
                        {centsToDisplay(Math.abs(e.amountCents))}
                      </td>
                    </tr>
                  ))}
                  {detail.ledgerEntries.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                        No ledger entries yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {canEditOwnerLedger(actor) && (
              <form action={boundLedgerEntry} className="mt-6 flex max-w-xl items-end gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700" htmlFor="entryType">Type</label>
                  <select id="entryType" name="entryType" className="mt-1 rounded-md border border-slate-300 px-3 py-2 text-sm">
                    <option value="ASSESSMENT">Assessment</option>
                    <option value="LATE_FEE">Late fee</option>
                    <option value="INTEREST">Interest</option>
                    <option value="ATTORNEY_FEE">Attorney fee</option>
                    <option value="COST">Cost</option>
                    <option value="PAYMENT">Payment</option>
                    <option value="ADJUSTMENT">Adjustment</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700" htmlFor="amountDollars">Amount ($)</label>
                  <input id="amountDollars" name="amountDollars" type="number" step="0.01" required className="mt-1 w-32 rounded-md border border-slate-300 px-3 py-2 text-sm" />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-medium text-slate-700" htmlFor="description">Description</label>
                  <input id="description" name="description" className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
                </div>
                <button type="submit" className="rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700">
                  Add entry
                </button>
              </form>
            )}
          </div>
        )}

        {tab === 'billing' && canViewFirmLedger(actor) && (
          <div>
            <p className="mb-4 text-xs text-slate-500">
              What the firm bills {matter.client.name} for legal services on this matter — distinct from the
              Owner Ledger, which tracks what the delinquent owner owes the Association.
            </p>
            <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-2">Date</th>
                    <th className="px-4 py-2">Type</th>
                    <th className="px-4 py-2">Description</th>
                    <th className="px-4 py-2">Entered by</th>
                    <th className="px-4 py-2">QuickBooks</th>
                    <th className="px-4 py-2 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {matter.ledgerEntries.map((e) => (
                    <tr key={e.id} className="border-b border-slate-100 last:border-0">
                      <td className="px-4 py-2 text-slate-600">{e.entryDate.toLocaleDateString()}</td>
                      <td className="px-4 py-2 text-slate-600">{e.entryType}</td>
                      <td className="px-4 py-2 text-slate-600">{e.description ?? '—'}</td>
                      <td className="px-4 py-2 text-slate-600">
                        {e.createdBy.firstName} {e.createdBy.lastName}
                      </td>
                      <td className="px-4 py-2">
                        {e.qbSyncStatus === 'SYNCED' ? (
                          <span className="text-xs text-emerald-700">Synced ({e.qbReferenceId})</span>
                        ) : canEditFirmLedger(actor) ? (
                          <form action={syncFirmLedgerEntry.bind(null, matter.id, e.id)}>
                            <button type="submit" className="text-xs text-brand-700 hover:underline">
                              Sync to QuickBooks (mock)
                            </button>
                          </form>
                        ) : (
                          <span className="text-xs text-slate-400">Not synced</span>
                        )}
                      </td>
                      <td className="px-4 py-2 text-right font-mono text-slate-900">{centsToDisplay(e.amountCents)}</td>
                    </tr>
                  ))}
                  {matter.ledgerEntries.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                        No billing entries yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {canEditFirmLedger(actor) && (
              <form action={addFirmLedgerEntry.bind(null, matter.id)} className="mt-6 flex max-w-xl items-end gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700" htmlFor="firmEntryType">Type</label>
                  <select id="firmEntryType" name="entryType" className="mt-1 rounded-md border border-slate-300 px-3 py-2 text-sm">
                    <option value="FEE">Fee</option>
                    <option value="COST">Cost</option>
                    <option value="PAYMENT">Payment</option>
                    <option value="ADJUSTMENT">Adjustment</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700" htmlFor="firmAmountDollars">Amount ($)</label>
                  <input id="firmAmountDollars" name="amountDollars" type="number" step="0.01" required className="mt-1 w-32 rounded-md border border-slate-300 px-3 py-2 text-sm" />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-medium text-slate-700" htmlFor="firmDescription">Description</label>
                  <input id="firmDescription" name="description" className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
                </div>
                <button type="submit" className="rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700">
                  Add entry
                </button>
              </form>
            )}
          </div>
        )}

        {tab === 'linked' && (
          <div>
            <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-2">Matter #</th>
                    <th className="px-4 py-2">Type</th>
                    <th className="px-4 py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {matter.childMatters.map((cm) => (
                    <tr key={cm.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                      <td className="px-4 py-2 font-mono text-xs">
                        <Link href={`/matters/${cm.id}`} className="text-brand-700 hover:underline">
                          {cm.matterNumber}
                        </Link>
                      </td>
                      <td className="px-4 py-2 text-slate-600">{cm.matterType.replace('_ANCILLARY', '')}</td>
                      <td className="px-4 py-2">
                        <StatusBadge status={cm.status} />
                      </td>
                    </tr>
                  ))}
                  {matter.childMatters.length === 0 && (
                    <tr>
                      <td colSpan={3} className="px-4 py-8 text-center text-slate-400">
                        No linked bankruptcy or eviction matters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
              <div className="flex gap-4 border-t border-slate-200 px-4 py-3 text-sm">
                <Link href={`/matters/collections/${matter.id}/bankruptcy/new`} className="text-brand-700 hover:underline">
                  + Add Bankruptcy Matter
                </Link>
                <Link href={`/matters/collections/${matter.id}/eviction/new`} className="text-brand-700 hover:underline">
                  + Add Eviction Matter
                </Link>
              </div>
            </div>

            {detail.paymentPlans.length > 0 && (
              <div className="mt-6">
                <h2 className="text-sm font-semibold text-slate-900">Payment plans</h2>
                <ul className="mt-2 space-y-1 text-sm text-slate-700">
                  {detail.paymentPlans.map((p) => (
                    <li key={p.id}>
                      Started {p.startDate.toLocaleDateString()} — {centsToDisplay(p.monthlyAmountCents)}/mo — {p.status}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {tab === 'mail' && canViewCertifiedMail(actor) && (
          <div>
            <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-2">Mailed</th>
                    <th className="px-4 py-2">Recipient</th>
                    <th className="px-4 py-2">Tracking #</th>
                    <th className="px-4 py-2">Status</th>
                    <th className="px-4 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {matter.certifiedMailings.map((m) => (
                    <tr key={m.id} className="border-b border-slate-100 last:border-0">
                      <td className="px-4 py-2 text-slate-600">{m.mailedDate.toLocaleDateString()}</td>
                      <td className="px-4 py-2 text-slate-600">{m.recipientName}</td>
                      <td className="px-4 py-2 font-mono text-xs text-slate-600">{m.trackingNumber}</td>
                      <td className="px-4 py-2">
                        <StatusBadge status={m.status} />
                      </td>
                      <td className="px-4 py-2">
                        {canEditCertifiedMail(actor) && m.status !== 'DELIVERED' && (
                          <form action={simulateCertifiedMailDelivery.bind(null, matter.id, m.id)}>
                            <button type="submit" className="text-xs text-brand-700 hover:underline">
                              Simulate delivery (dev)
                            </button>
                          </form>
                        )}
                      </td>
                    </tr>
                  ))}
                  {matter.certifiedMailings.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                        No certified mail sent yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {canEditCertifiedMail(actor) && (
              <form action={sendCertifiedMail.bind(null, matter.id)} className="mt-6 max-w-md space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700" htmlFor="recipientName">Recipient name</label>
                  <input
                    id="recipientName"
                    name="recipientName"
                    required
                    defaultValue={owner ? `${owner.firstName} ${owner.lastName}` : ''}
                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700" htmlFor="recipientAddress">Recipient address</label>
                  <textarea
                    id="recipientAddress"
                    name="recipientAddress"
                    required
                    defaultValue={owner ? `${detail.unitAddressLine1}, ${detail.unitCity}, ${detail.unitState} ${detail.unitPostalCode}` : ''}
                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                    rows={2}
                  />
                </div>
                <button type="submit" className="rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700">
                  Send via certified mail
                </button>
                <p className="text-xs text-slate-400">
                  Using the mock provider — no real mail is sent. Configure CERTIFIED_MAIL_PROVIDER to switch to a
                  real vendor once one is selected.
                </p>
              </form>
            )}
          </div>
        )}
        {tab === 'documents' && (
          <DocumentsPanel
            documents={matter.documents}
            matterId={matter.id}
            redirectPath={`/matters/collections/${matter.id}?tab=documents`}
            canView={canViewDocumentMetadata(actor)}
            canUpload={canEditDocuments(actor)}
            canDownload={canDownloadDocuments(actor)}
          />
        )}
        {tab === 'notes' && canViewNotes(actor) && (
          <NotesPanel
            notes={matter.notes}
            matterId={matter.id}
            redirectPath={`/matters/collections/${matter.id}?tab=notes`}
            canEdit={canEditNotes(actor)}
          />
        )}

        {tab === 'deadlines' && canViewDeadlines(actor) && (
          <div>
            <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-2">Due</th>
                    <th className="px-4 py-2">Title</th>
                    <th className="px-4 py-2">Type</th>
                    <th className="px-4 py-2">Assigned to</th>
                    <th className="px-4 py-2">Status</th>
                    <th className="px-4 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {matter.deadlines.map((d) => (
                    <tr key={d.id} className="border-b border-slate-100 last:border-0">
                      <td className="px-4 py-2 text-slate-600">{d.dueDate.toLocaleDateString()}</td>
                      <td className="px-4 py-2 text-slate-900">{d.title}</td>
                      <td className="px-4 py-2 text-slate-600">{d.type.replaceAll('_', ' ')}</td>
                      <td className="px-4 py-2 text-slate-600">
                        {d.assignedTo.firstName} {d.assignedTo.lastName}
                      </td>
                      <td className="px-4 py-2">
                        <StatusBadge status={d.status} />
                      </td>
                      <td className="px-4 py-2">
                        {canEditDeadlines(actor) && d.status === 'OPEN' && (
                          <form action={completeDeadline.bind(null, matter.id, d.id)}>
                            <button type="submit" className="text-xs text-brand-700 hover:underline">
                              Mark complete
                            </button>
                          </form>
                        )}
                      </td>
                    </tr>
                  ))}
                  {matter.deadlines.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                        No deadlines yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {canEditDeadlines(actor) && (
              <form action={createDeadline} className="mt-6 max-w-xl space-y-3">
                <input type="hidden" name="matterId" value={matter.id} />
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700" htmlFor="title">Title</label>
                    <input id="title" name="title" required className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700" htmlFor="type">Type</label>
                    <select id="type" name="type" className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm">
                      <option value="STATUTE_OF_LIMITATIONS">Statute of limitations</option>
                      <option value="HEARING">Hearing</option>
                      <option value="FILING">Filing</option>
                      <option value="FOLLOW_UP">Follow up</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700" htmlFor="dueDate">Due date</label>
                    <input id="dueDate" name="dueDate" type="date" required className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700" htmlFor="assignedToId">Assigned to</label>
                    <select id="assignedToId" name="assignedToId" required defaultValue="" className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm">
                      <option value="" disabled>Select...</option>
                      {staff.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.firstName} {s.lastName}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700" htmlFor="notes">Notes</label>
                  <input id="notes" name="notes" className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
                </div>
                <button type="submit" className="rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700">
                  Add deadline
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
