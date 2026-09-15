import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/session'
import { db } from '@/lib/db'
import { getActiveMatterForClient } from '@/lib/matters/service'
import { DOCUMENT_LABELS } from '@/lib/documents/generators'
import { CLIENT_DOC_STATUS, TONE_CLASSES } from '@/lib/matters/display'
import type { DocumentType } from '@/lib/documents/blocks'

export default async function PortalDocumentsPage() {
  const actor = await getCurrentUser()
  if (!actor) redirect('/login')
  const matter = await getActiveMatterForClient(actor.id)
  if (!matter) redirect('/portal')

  const docs = await db.generatedDocument.findMany({
    where: { matterId: matter.id, status: { not: 'SUPERSEDED' } },
    orderBy: { type: 'asc' },
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My documents</h1>
        <p className="text-sm text-gray-500">Matter {matter.reference}</p>
      </div>

      {docs.length === 0 ? (
        <div className="rounded-lg border border-gray-100 bg-white p-6 text-gray-600">
          Your documents have not been prepared yet. Complete your{' '}
          <Link href="/portal/intake/estate" className="font-medium text-brand-700 hover:underline">
            estate questionnaire
          </Link>{' '}
          to get started.
        </div>
      ) : (
        <>
          <p className="text-sm text-gray-600">
            Each document is reviewed by a licensed Florida attorney. You can preview any document now; downloads
            and signing become available once a document is approved.
          </p>
          <ul className="divide-y divide-gray-100 overflow-hidden rounded-lg border border-gray-100 bg-white">
            {docs.map((d) => {
              const status = CLIENT_DOC_STATUS[d.status]
              return (
                <li key={d.id} className="flex items-center justify-between gap-4 p-4">
                  <div>
                    <p className="font-medium text-gray-900">{DOCUMENT_LABELS[d.type as DocumentType]}</p>
                    <p className="text-xs text-gray-500">Version {d.version}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`rounded-full px-3 py-1 text-xs font-medium ${TONE_CLASSES[status.tone]}`}>
                      {status.label}
                    </span>
                    <Link href={`/portal/documents/${d.id}`} className="text-sm font-medium text-brand-700 hover:underline">
                      View
                    </Link>
                  </div>
                </li>
              )
            })}
          </ul>
        </>
      )}
    </div>
  )
}
