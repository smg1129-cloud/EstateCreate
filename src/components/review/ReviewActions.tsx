'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

type Decision = 'APPROVED' | 'CHANGES_REQUESTED' | 'REJECTED'

export function ReviewActions({
  canApprove,
  status,
  onReview,
  onSend,
}: {
  canApprove: boolean
  status: string
  onReview: (decision: Decision, comment: string) => Promise<void>
  onSend: () => Promise<void>
}) {
  const router = useRouter()
  const [comment, setComment] = useState('')
  const [pending, start] = useTransition()

  function review(decision: Decision) {
    if ((decision === 'CHANGES_REQUESTED' || decision === 'REJECTED') && !comment.trim()) {
      alert('Please add a note explaining the requested changes.')
      return
    }
    start(async () => {
      await onReview(decision, comment)
      setComment('')
      router.refresh()
    })
  }

  function send() {
    start(async () => {
      await onSend()
      router.refresh()
    })
  }

  return (
    <div className="space-y-3">
      <textarea
        rows={3}
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Review notes (required when requesting changes or rejecting)…"
        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
      />
      <div className="flex flex-wrap gap-2">
        {canApprove && (
          <button
            onClick={() => review('APPROVED')}
            disabled={pending || status === 'APPROVED' || status === 'EXECUTED'}
            className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
          >
            Approve
          </button>
        )}
        <button
          onClick={() => review('CHANGES_REQUESTED')}
          disabled={pending}
          className="rounded-md bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50"
        >
          Request changes
        </button>
        {canApprove && (
          <button
            onClick={() => review('REJECTED')}
            disabled={pending}
            className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
          >
            Reject
          </button>
        )}
        {canApprove && status === 'APPROVED' && (
          <button
            onClick={send}
            disabled={pending}
            className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
          >
            Send for signature
          </button>
        )}
      </div>
      {pending && <p className="text-sm text-gray-400">Working…</p>}
    </div>
  )
}
