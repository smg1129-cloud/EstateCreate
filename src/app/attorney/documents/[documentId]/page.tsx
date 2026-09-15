import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { getCurrentUser } from '@/lib/session'
import { assertCanAccessMatter, canApproveDocuments, requireRole } from '@/lib/rbac'
import { db } from '@/lib/db'
import { DOCUMENT_LABELS } from '@/lib/documents/generators'
import { STAFF_DOC_STATUS, TONE_CLASSES } from '@/lib/matters/display'
import { renderBodyHtml, DOCUMENT_PREVIEW_CSS } from '@/lib/documents/render/html'
import { recordAttorneyDecision, sendForSignature, type AttorneyDecision } from '@/lib/matters/service'
import type { DocumentModel, DocumentType } from '@/lib/documents/blocks'
import { FlagList } from '@/components/review/FlagList'
import { ReviewActions } from '@/components/review/ReviewActions'

export default async function AttorneyDocumentReview({ params }: { params: { documentId: string } }) {
  const actor = await getCurrentUser()
  if (!actor) redirect('/login')
  requireRole(actor, ['ATTORNEY', 'PARALEGAL', 'ADMIN'])

  const doc = await db.generatedDocument.findUnique({
    where: { id: params.documentId },
    include: {
      matter: { include: { client: true } },
      reviews: { include: { reviewer: { select: { firstName: true, lastName: true, role: true } } }, orderBy: { createdAt: 'desc' } },
      signature: true,
    },
  })
  if (!doc) notFound()
  await assertCanAccessMatter(actor, doc.matterId)

  const model = doc.contentJson as unknown as DocumentModel
  const s = STAFF_DOC_STATUS[doc.status]
  const canApprove = canApproveDocuments(actor)
  const documentId = doc.id

  async function onReview(decision: AttorneyDecision, comment: string) {
    'use server'
    const a = await getCurrentUser()
    if (!a) return
    requireRole(a, ['ATTORNEY', 'PARALEGAL', 'ADMIN'])
    // Only an attorney may approve; paralegals may request changes only.
    if (decision === 'APPROVED' && !canApproveDocuments(a)) return
    await recordAttorneyDecision({ documentId, decision, comment: comment || undefined, actorId: a.id })
    revalidatePath(`/attorney/documents/${documentId}`)
  }

  async function onSend() {
    'use server'
    const a = await getCurrentUser()
    if (!a || !canApproveDocuments(a)) return
    await sendForSignature({ documentId, method: 'REMOTE_ONLINE_NOTARIZATION', actorId: a.id })
    revalidatePath(`/attorney/documents/${documentId}`)
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      {/* Preview */}
      <div className="order-2 lg:order-1">
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50 px-4 py-2">
            <span className="text-sm font-medium text-gray-600">Document preview</span>
            <div className="flex gap-3 text-sm">
              <a href={`/api/documents/${doc.id}?format=pdf`} className="text-brand-700 hover:underline">PDF</a>
              <a href={`/api/documents/${doc.id}?format=docx`} className="text-brand-700 hover:underline">Word</a>
            </div>
          </div>
          <style dangerouslySetInnerHTML={{ __html: DOCUMENT_PREVIEW_CSS }} />
          <div className="max-h-[75vh] overflow-y-auto bg-gray-100 p-4">
            <div dangerouslySetInnerHTML={{ __html: renderBodyHtml(model) }} />
          </div>
        </div>
      </div>

      {/* Review sidebar */}
      <div className="order-1 space-y-5 lg:order-2">
        <div>
          <Link href={`/attorney/matters/${doc.matterId}`} className="text-sm text-brand-700 hover:underline">
            ← {doc.matter.client.firstName} {doc.matter.client.lastName}
          </Link>
          <h1 className="mt-1 text-xl font-bold text-gray-900">{DOCUMENT_LABELS[doc.type as DocumentType]}</h1>
          <div className="mt-1 flex items-center gap-2">
            <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${TONE_CLASSES[s.tone]}`}>{s.label}</span>
            <span className="text-xs text-gray-400">v{doc.version}</span>
          </div>
        </div>

        <div className="rounded-lg border border-gray-100 bg-white p-4">
          <h2 className="text-sm font-semibold text-gray-900">Attorney decision</h2>
          {!canApprove && (
            <p className="mt-1 text-xs text-amber-700">
              You can request changes; only a licensed attorney can approve or send for signature.
            </p>
          )}
          <div className="mt-3">
            <ReviewActions canApprove={canApprove} status={doc.status} onReview={onReview} onSend={onSend} />
          </div>
        </div>

        <div className="rounded-lg border border-gray-100 bg-white p-4">
          <h2 className="text-sm font-semibold text-gray-900">Issue-spotting for this document</h2>
          <div className="mt-2">
            <FlagList flags={model.flags ?? []} />
          </div>
        </div>

        <div className="rounded-lg border border-gray-100 bg-white p-4">
          <h2 className="text-sm font-semibold text-gray-900">Execution requirements</h2>
          <p className="mt-1 text-xs text-gray-500">
            {model.execution.witnesses} witness{model.execution.witnesses === 1 ? '' : 'es'}
            {model.execution.notaryRequired ? ' + notary' : ''}
            {model.execution.authority ? ` · ${model.execution.authority}` : ''}
          </p>
        </div>

        <div className="rounded-lg border border-gray-100 bg-white p-4">
          <h2 className="text-sm font-semibold text-gray-900">Review history</h2>
          <ul className="mt-2 space-y-2 text-sm">
            {doc.reviews.map((r) => (
              <li key={r.id} className="border-l-2 border-gray-100 pl-3">
                <div className="text-gray-800">
                  <span className="font-medium">{r.decision.replace('_', ' ').toLowerCase()}</span> by {r.reviewer.firstName} {r.reviewer.lastName}
                </div>
                {r.comment && <p className="text-gray-600">{r.comment}</p>}
                <p className="text-xs text-gray-400">{new Date(r.createdAt).toLocaleString()}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
