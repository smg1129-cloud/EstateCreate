import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import { getCurrentUser } from '@/lib/session'
import { assertCanAccessMatter } from '@/lib/rbac'
import { db } from '@/lib/db'
import { getMergedAnswers } from '@/lib/matters/service'
import { getQuestionnaire, type Answers } from '@/lib/questionnaire'
import { DOCUMENT_LABELS } from '@/lib/documents/generators'
import { STAFF_DOC_STATUS, TONE_CLASSES, MATTER_STATUS_LABEL } from '@/lib/matters/display'
import type { ReviewFlag, DocumentType } from '@/lib/documents/blocks'
import { FlagList } from '@/components/review/FlagList'
import { AnswersSummary } from '@/components/review/AnswersSummary'
import { formatMoney } from '@/lib/billing/service'
import { RefundControl } from './RefundControl'

export default async function MatterOverview({ params }: { params: { matterId: string } }) {
  const actor = await getCurrentUser()
  if (!actor) redirect('/login')
  await assertCanAccessMatter(actor, params.matterId)

  const matter = await db.estateMatter.findUnique({
    where: { id: params.matterId },
    include: {
      client: true,
      documents: { where: { status: { not: 'SUPERSEDED' } }, orderBy: { type: 'asc' } },
    },
  })
  if (!matter) notFound()

  const answers = (await getMergedAnswers(matter.id)) as Answers
  const summary = (matter.planSummary as { planType?: string; rationale?: string[]; flags?: ReviewFlag[] } | null) ?? {}

  const payment = await db.payment.findFirst({
    where: { matterId: matter.id, status: { in: ['SUCCEEDED', 'REFUNDED'] } },
    orderBy: { createdAt: 'desc' },
  })
  const canRefund = payment?.status === 'SUCCEEDED' && (actor.role === 'ATTORNEY' || actor.role === 'ADMIN')

  return (
    <div className="space-y-8">
      <div>
        <Link href="/attorney" className="text-sm text-brand-700 hover:underline">← Review queue</Link>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {matter.client.firstName} {matter.client.lastName}
            </h1>
            <p className="text-sm text-gray-500">
              Matter {matter.reference} · {matter.client.email}
            </p>
          </div>
          <span className="rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-700">
            {MATTER_STATUS_LABEL[matter.status]}
          </span>
        </div>
      </div>

      {/* Plan recommendation */}
      <section className="rounded-lg border border-gray-100 bg-white p-5">
        <h2 className="font-semibold text-gray-900">Recommended plan</h2>
        <p className="mt-1 text-sm text-gray-600">
          {summary.planType === 'TRUST_BASED' ? 'Trust-based plan' : summary.planType === 'WILL_BASED' ? 'Will-based plan' : 'Undetermined'}
        </p>
        {summary.rationale && summary.rationale.length > 0 && (
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-gray-600">
            {summary.rationale.map((r, i) => <li key={i}>{r}</li>)}
          </ul>
        )}
      </section>

      {/* Issue-spotting flags */}
      <section className="rounded-lg border border-gray-100 bg-white p-5">
        <h2 className="font-semibold text-gray-900">Issue-spotting notes</h2>
        <p className="mt-1 text-xs text-gray-500">
          Generated from the intake using the firm’s attorney checklist. These are prompts for your review, not
          advice, and are never shown to the client.
        </p>
        <div className="mt-3">
          <FlagList flags={summary.flags ?? []} />
        </div>
      </section>

      {/* Billing */}
      {payment && (
        <section className="rounded-lg border border-gray-100 bg-white p-5">
          <h2 className="font-semibold text-gray-900">Billing</h2>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm text-gray-600">
              {payment.status === 'REFUNDED' ? (
                <span>
                  <span className="font-medium text-gray-900">{formatMoney(payment.amountCents, payment.currency)}</span>{' '}
                  refunded{payment.refundReason ? ` — ${payment.refundReason}` : ''}.
                </span>
              ) : (
                <span>
                  <span className="font-medium text-gray-900">{formatMoney(payment.amountCents, payment.currency)}</span>{' '}
                  paid for {payment.paidForTypes.length} document{payment.paidForTypes.length === 1 ? '' : 's'} · flat fee.
                </span>
              )}
            </div>
            {canRefund && <RefundControl matterId={matter.id} />}
          </div>
        </section>
      )}

      {/* Documents */}
      <section>
        <h2 className="font-semibold text-gray-900">Documents</h2>
        <ul className="mt-3 divide-y divide-gray-100 overflow-hidden rounded-lg border border-gray-100 bg-white">
          {matter.documents.map((d) => {
            const s = STAFF_DOC_STATUS[d.status]
            return (
              <li key={d.id} className="flex items-center justify-between gap-4 p-4">
                <div>
                  <p className="font-medium text-gray-900">{DOCUMENT_LABELS[d.type as DocumentType]}</p>
                  <p className="text-xs text-gray-500">v{d.version} · engine {d.engineVersion}</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`rounded-full px-3 py-1 text-xs font-medium ${TONE_CLASSES[s.tone]}`}>{s.label}</span>
                  <Link href={`/attorney/documents/${d.id}`} className="text-sm font-medium text-brand-700 hover:underline">
                    Review →
                  </Link>
                </div>
              </li>
            )
          })}
        </ul>
      </section>

      {/* Intake answers */}
      <section className="rounded-lg border border-gray-100 bg-white p-5">
        <h2 className="font-semibold text-gray-900">Client intake</h2>
        <div className="mt-3 space-y-6">
          {(['TRIAGE', 'ESTATE_INTAKE'] as const).map((kind) => {
            const q = getQuestionnaire(kind)
            return (
              <div key={kind}>
                <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">{q.title}</h3>
                <div className="mt-2">
                  <AnswersSummary questionnaire={q} answers={answers} />
                </div>
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}
