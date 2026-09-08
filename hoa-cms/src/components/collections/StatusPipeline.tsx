'use client'

import { useState } from 'react'
import type { CollectionsStatus } from '@prisma/client'

const LABELS: Record<CollectionsStatus, string> = {
  NEW_REFERRAL: 'New Referral',
  DEMAND_LETTER_SENT: 'Demand Letter Sent',
  LIEN_RECORDED: 'Lien Recorded',
  REFERRED_TO_SUIT: 'Referred to Suit',
  SUIT_FILED: 'Suit Filed',
  ANSWER_PERIOD: 'Answer Period',
  JUDGMENT: 'Judgment',
  SALE_SCHEDULED: 'Sale Scheduled',
  SALE_HELD: 'Sale Held',
  CLOSED: 'Closed',
}

const INPUT = 'mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500'
const LABEL_CLS = 'block text-sm font-medium text-slate-700'

export function StatusPipeline({
  currentStatus,
  allowedNext,
  permittedTargets,
  bankruptcyStayActive,
  action,
}: {
  currentStatus: CollectionsStatus
  allowedNext: CollectionsStatus[]
  /// Which of allowedNext the current actor may actually apply — computed
  /// server-side from lib/rbac.ts. Passed as plain data, not a function:
  /// Server Components cannot pass closures to Client Components.
  permittedTargets: CollectionsStatus[]
  bankruptcyStayActive: boolean
  action: (formData: FormData) => void
}) {
  const [target, setTarget] = useState<CollectionsStatus | ''>('')
  const canTransition = (to: CollectionsStatus) => permittedTargets.includes(to)

  if (allowedNext.length === 0) {
    return <p className="text-sm text-slate-500">This matter is closed. No further transitions are available.</p>
  }

  return (
    <form action={action} className="max-w-md space-y-4">
      <div>
        <label className={LABEL_CLS} htmlFor="to">
          Move from <span className="font-semibold">{LABELS[currentStatus]}</span> to
        </label>
        <select
          id="to"
          name="to"
          required
          value={target}
          onChange={(e) => setTarget(e.target.value as CollectionsStatus)}
          className={INPUT}
        >
          <option value="" disabled>
            Select next status...
          </option>
          {allowedNext.map((s) => (
            <option key={s} value={s} disabled={!canTransition(s)}>
              {LABELS[s]}
              {!canTransition(s) ? ' (Attorney/Admin only)' : ''}
            </option>
          ))}
        </select>
      </div>

      {target === 'LIEN_RECORDED' && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={LABEL_CLS} htmlFor="orBook">O.R. Book</label>
              <input id="orBook" name="orBook" required className={INPUT} />
            </div>
            <div>
              <label className={LABEL_CLS} htmlFor="orPage">O.R. Page</label>
              <input id="orPage" name="orPage" required className={INPUT} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={LABEL_CLS} htmlFor="lienAmountDollars">Lien amount ($)</label>
              <input id="lienAmountDollars" name="lienAmountDollars" type="number" step="0.01" required className={INPUT} />
            </div>
            <div>
              <label className={LABEL_CLS} htmlFor="recordedDate">Recorded date</label>
              <input id="recordedDate" name="recordedDate" type="date" required className={INPUT} />
            </div>
          </div>
        </div>
      )}

      {target === 'SUIT_FILED' && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={LABEL_CLS} htmlFor="caseNumber">Case number</label>
            <input id="caseNumber" name="caseNumber" required className={INPUT} />
          </div>
          <div>
            <label className={LABEL_CLS} htmlFor="court">Court</label>
            <input id="court" name="court" required className={INPUT} />
          </div>
        </div>
      )}

      {target === 'JUDGMENT' && (
        <div>
          <label className={LABEL_CLS} htmlFor="judgmentAmountDollars">Judgment amount ($)</label>
          <input id="judgmentAmountDollars" name="judgmentAmountDollars" type="number" step="0.01" required className={INPUT} />
        </div>
      )}

      {target === 'SALE_SCHEDULED' && (
        <div>
          <label className={LABEL_CLS} htmlFor="saleScheduledDate">Sale date</label>
          <input id="saleScheduledDate" name="saleScheduledDate" type="date" required className={INPUT} />
        </div>
      )}

      {target === 'SALE_HELD' && (
        <div>
          <label className={LABEL_CLS} htmlFor="salePriceDollars">Sale price ($)</label>
          <input id="salePriceDollars" name="salePriceDollars" type="number" step="0.01" required className={INPUT} />
        </div>
      )}

      {target === 'CLOSED' && (
        <div>
          <label className={LABEL_CLS} htmlFor="closedReason">Reason</label>
          <select id="closedReason" name="closedReason" required defaultValue="" className={INPUT}>
            <option value="" disabled>Select...</option>
            <option value="PAID_IN_FULL">Paid in full</option>
            <option value="WRITTEN_OFF">Written off</option>
            <option value="SETTLED">Settled</option>
            <option value="TRANSFERRED_OUT">Transferred out</option>
            <option value="OTHER">Other</option>
          </select>
        </div>
      )}

      {bankruptcyStayActive && target && target !== 'CLOSED' && (
        <div className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2">
          <label className="flex items-start gap-2 text-sm text-amber-900">
            <input type="checkbox" name="overrideStay" required className="mt-0.5" />
            <span>
              I confirm this action is authorized despite the active bankruptcy stay (e.g. relief from stay has
              been obtained). This override will be recorded in the audit log.
            </span>
          </label>
        </div>
      )}

      <button
        type="submit"
        disabled={!target || !canTransition(target)}
        className="rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Apply transition
      </button>
    </form>
  )
}
