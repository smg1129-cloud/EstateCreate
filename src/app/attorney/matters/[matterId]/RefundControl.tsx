'use client'

import { useState, useTransition } from 'react'
import { refundPayment } from './actions'

export function RefundControl({ matterId }: { matterId: string }) {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState('')

  function onConfirm() {
    setError('')
    startTransition(async () => {
      const res = await refundPayment(matterId, reason)
      if (!res.ok) setError(res.error)
      else setOpen(false)
    })
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-md border border-red-300 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50"
      >
        Issue refund
      </button>
    )
  }

  return (
    <div className="rounded-md border border-red-200 bg-red-50 p-3">
      <p className="text-sm font-medium text-red-800">Refund this payment?</p>
      <p className="mt-1 text-xs text-red-700">
        Use this when the firm cannot serve the client or the plan is rejected.
        The client is refunded the full amount.
      </p>
      <textarea
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Reason (recorded in the audit log)"
        className="mt-2 w-full rounded-md border border-red-300 px-2 py-1 text-sm"
        rows={2}
      />
      {error && <p className="mt-1 text-sm text-red-700">{error}</p>}
      <div className="mt-2 flex gap-2">
        <button
          onClick={onConfirm}
          disabled={pending}
          className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
        >
          {pending ? 'Refunding…' : 'Confirm refund'}
        </button>
        <button
          onClick={() => setOpen(false)}
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
