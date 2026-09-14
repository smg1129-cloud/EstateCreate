import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { getCurrentUser } from '@/lib/session'
import { canAccessMatter } from '@/lib/rbac'
import { db } from '@/lib/db'
import { DOCUMENT_LABELS } from '@/lib/documents/generators'
import { CLIENT_DOC_STATUS, TONE_CLASSES } from '@/lib/matters/display'
import { renderBodyHtml, DOCUMENT_PREVIEW_CSS } from '@/lib/documents/render/html'
import { sendForSignature, refreshSignatureStatus } from '@/lib/matters/service'
import type { DocumentModel, DocumentType } from '@/lib/documents/blocks'

export default async function ClientDocumentPage({ params }: { params: { documentId: string } }) {
  const actor = await getCurrentUser()
  if (!actor) redirect('/login')

  const doc = await db.generatedDocument.findUnique({
    where: { id: params.documentId },
    include: { signature: true },
  })
  if (!doc) notFound()
  if (!(await canAccessMatter(actor, doc.matterId))) redirect('/portal')

  const model = doc.contentJson as unknown as DocumentModel
  const status = CLIENT_DOC_STATUS[doc.status]
  const canSign = doc.status === 'APPROVED'
  const documentId = doc.id

  async function beginSigning() {
    'use server'
    await sendForSignature({ documentId, method: 'REMOTE_ONLINE_NOTARIZATION', actorId: actor!.id })
    revalidatePath(`/portal/documents/${documentId}`)
  }
  async function completeSigning() {
    'use server'
    await refreshSignatureStatus(documentId, actor!.id)
    revalidatePath(`/portal/documents/${documentId}`)
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/portal/documents" className="text-sm text-brand-700 hover:underline">
          ← All documents
        </Link>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-bold text-gray-900">{DOCUMENT_LABELS[doc.type as DocumentType]}</h1>
          <span className={`rounded-full px-3 py-1 text-xs font-medium ${TONE_CLASSES[status.tone]}`}>{status.label}</span>
        </div>
      </div>

      {/* Execution / download panel */}
      {doc.status === 'IN_REVIEW' && (
        <p className="rounded-lg bg-blue-50 p-4 text-sm text-blue-900">
          This document is with a licensed Florida attorney for review. We will notify you when it is approved.
          You can preview the current draft below.
        </p>
      )}
      {doc.status === 'APPROVED' && !doc.signature && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-5">
          <p className="font-medium text-green-900">Your attorney has approved this document.</p>
          <p className="mt-1 text-sm text-green-800">
            You can download it now, or execute it electronically by remote online notarization.
          </p>
          <div className="mt-3 flex flex-wrap gap-3">
            <a href={`/api/documents/${doc.id}?format=pdf`} className="rounded-md bg-white px-4 py-2 text-sm font-medium text-brand-700 ring-1 ring-brand-200 hover:bg-brand-50">
              Download PDF
            </a>
            <a href={`/api/documents/${doc.id}?format=docx`} className="rounded-md bg-white px-4 py-2 text-sm font-medium text-brand-700 ring-1 ring-brand-200 hover:bg-brand-50">
              Download Word
            </a>
            {canSign && (
              <form action={beginSigning}>
                <button className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">
                  Begin signing (Remote Online Notarization)
                </button>
              </form>
            )}
          </div>
        </div>
      )}
      {doc.signature && doc.status !== 'EXECUTED' && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-5">
          <p className="font-medium text-amber-900">Signing in progress</p>
          <p className="mt-1 text-sm text-amber-800">
            Status: {doc.signature.status}. Complete the signing session with your witnesses and the online notary.
          </p>
          <form action={completeSigning} className="mt-3">
            <button className="rounded-md bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700">
              Refresh signing status
            </button>
          </form>
        </div>
      )}
      {doc.status === 'EXECUTED' && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-5">
          <p className="font-medium text-green-900">This document has been executed.</p>
          <a href={`/api/documents/${doc.id}?format=pdf`} className="mt-3 inline-block rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">
            Download executed PDF
          </a>
        </div>
      )}

      {/* Execution instructions */}
      <div className="rounded-lg border border-gray-100 bg-white p-5">
        <h2 className="font-semibold text-gray-900">How to sign this document in Florida</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-gray-600">
          {model.execution.steps.map((s, i) => (
            <li key={i}>{s}</li>
          ))}
        </ul>
        <p className="mt-2 text-xs text-gray-400">
          Requires {model.execution.witnesses} witness{model.execution.witnesses === 1 ? '' : 'es'}
          {model.execution.notaryRequired ? ' and a notary public.' : '.'}
        </p>
      </div>

      {/* Preview */}
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-600">Preview</div>
        <style dangerouslySetInnerHTML={{ __html: DOCUMENT_PREVIEW_CSS }} />
        <div className="max-h-[70vh] overflow-y-auto bg-gray-100 p-4">
          <div dangerouslySetInnerHTML={{ __html: renderBodyHtml(model) }} />
        </div>
      </div>
    </div>
  )
}
