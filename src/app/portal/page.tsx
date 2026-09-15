import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/session'
import { db } from '@/lib/db'
import { getActiveMatterForClient, getResponse } from '@/lib/matters/service'
import { getLatestQuote, hasCapturedPayment, formatMoney } from '@/lib/billing/service'

const MATTER_STATUS_COPY: Record<string, { label: string; help: string }> = {
  INTAKE: { label: 'Getting started', help: 'Complete your questionnaires so we can prepare your documents.' },
  READY_TO_GENERATE: { label: 'Ready to prepare', help: 'Your answers are complete. We are assembling your documents.' },
  AWAITING_PAYMENT: { label: 'Payment needed', help: 'Review your recommended documents and fees, then check out to begin preparation.' },
  IN_REVIEW: { label: 'In attorney review', help: 'Your documents are being reviewed by a licensed Florida attorney.' },
  CHANGES_REQUESTED: { label: 'Changes requested', help: 'Your attorney asked for some updates. Please review the notes.' },
  APPROVED: { label: 'Approved', help: 'Your documents are approved and ready to sign.' },
  EXECUTION: { label: 'Ready to sign', help: 'Follow the signing instructions to execute your documents.' },
  COMPLETED: { label: 'Complete', help: 'Your executed documents are available to download.' },
  ABANDONED: { label: 'Closed', help: '' },
}

function Step({ n, title, done, active, href, cta }: { n: number; title: string; done: boolean; active: boolean; href?: string; cta?: string }) {
  return (
    <div className={`flex items-start gap-3 rounded-lg border p-4 ${active ? 'border-brand-300 bg-brand-50' : 'border-gray-100 bg-white'}`}>
      <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${done ? 'bg-brand-600 text-white' : active ? 'bg-brand-200 text-brand-800' : 'bg-gray-100 text-gray-500'}`}>
        {done ? '✓' : n}
      </div>
      <div className="flex-1">
        <p className="font-medium text-gray-900">{title}</p>
        {active && href && cta && (
          <Link href={href} className="mt-2 inline-block rounded-md bg-brand-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-brand-700">
            {cta}
          </Link>
        )}
      </div>
    </div>
  )
}

export default async function PortalDashboard() {
  const actor = await getCurrentUser()
  if (!actor) redirect('/login')
  const matter = await getActiveMatterForClient(actor.id)
  if (!matter) {
    return <p className="text-gray-600">No active matter found. Please contact the office.</p>
  }

  const triage = await getResponse(matter.id, 'TRIAGE')
  const intake = await getResponse(matter.id, 'ESTATE_INTAKE')
  const docCount = await db.generatedDocument.count({ where: { matterId: matter.id, status: { not: 'SUPERSEDED' } } })

  const triageDone = Boolean(triage?.completedAt)
  const intakeDone = Boolean(intake?.completedAt)
  const status = MATTER_STATUS_COPY[matter.status] ?? { label: matter.status, help: '' }

  // Billing state.
  const quote = await getLatestQuote(matter.id)
  const paid = await hasCapturedPayment(matter.id)
  const selectedCount = quote?.items.filter((i) => i.selected).length ?? 0
  const estimateCents = quote?.items.filter((i) => i.selected).reduce((s, i) => s + i.unitPriceCents, 0) ?? 0

  return (
    <div className="space-y-8">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Your estate plan</h1>
          <p className="text-sm text-gray-500">Matter {matter.reference}</p>
        </div>
        <div className="rounded-full bg-brand-100 px-4 py-1.5 text-sm font-medium text-brand-800">{status.label}</div>
      </div>
      {status.help && <p className="text-gray-600">{status.help}</p>}

      <div className="grid gap-3">
        <Step n={1} title="Tell us what you need (quick questionnaire)" done={triageDone} active={!triageDone}
          href="/portal/intake/triage" cta="Start" />
        <Step n={2} title="Your estate & asset questionnaire" done={intakeDone} active={triageDone && !intakeDone}
          href="/portal/intake/estate" cta={intake ? 'Continue' : 'Start'} />
        <Step n={3} title="Review your documents & fees, then pay" done={paid} active={intakeDone && !paid}
          href="/portal/checkout" cta="Review & pay" />
        <Step n={4} title="We prepare your documents & an attorney reviews them" done={paid && matter.status !== 'IN_REVIEW' && docCount > 0} active={paid && matter.status === 'IN_REVIEW'}
          href="/portal/documents" cta="View status" />
        <Step n={5} title="Review, sign, and execute" done={matter.status === 'COMPLETED'} active={matter.status === 'APPROVED' || matter.status === 'EXECUTION'}
          href="/portal/documents" cta="Go to documents" />
      </div>

      {/* Preliminary estimate after triage, before payment. */}
      {triageDone && !paid && quote && selectedCount > 0 && (
        <div className="rounded-lg border border-brand-100 bg-brand-50 p-5">
          <p className="text-sm font-medium text-brand-900">
            {intakeDone ? 'Your documents & fees' : 'Estimated fees so far'}
          </p>
          <p className="mt-1 text-2xl font-bold text-brand-900">{formatMoney(estimateCents, quote.currency)}</p>
          <p className="mt-1 text-sm text-brand-800">
            {selectedCount} document{selectedCount === 1 ? '' : 's'} selected · flat fee per document.
            {!intakeDone && ' This may change based on your detailed answers.'}
          </p>
          <Link href="/portal/checkout" className="mt-3 inline-block rounded-md bg-brand-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-brand-700">
            {intakeDone ? 'Review & pay' : 'View estimate'}
          </Link>
        </div>
      )}

      {docCount > 0 && (
        <div className="rounded-lg border border-gray-100 bg-white p-5">
          <p className="text-gray-700">
            You have {docCount} document{docCount === 1 ? '' : 's'} in progress.{' '}
            <Link href="/portal/documents" className="font-medium text-brand-700 hover:underline">
              View your documents →
            </Link>
          </p>
        </div>
      )}

      {triageDone && !intakeDone && (
        <p className="text-sm text-gray-500">
          Tip: You do not have to answer every question in one sitting — your progress is saved as you go.
        </p>
      )}
    </div>
  )
}
