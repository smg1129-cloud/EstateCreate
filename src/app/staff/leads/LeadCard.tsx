'use client'

import { useTransition } from 'react'
import type { CommunicationLog, Lead, User } from '@prisma/client'
import { updateLeadStatus, addLeadNote } from './actions'

type LeadWithRelations = Lead & { assignedTo: User | null; communications: CommunicationLog[] }

const STATUS_OPTIONS = ['NEW', 'CONTACTED', 'QUALIFIED', 'CONVERTED', 'LOST']

export function LeadCard({ lead }: { lead: LeadWithRelations }) {
  const [pending, startTransition] = useTransition()

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3 text-sm shadow-sm">
      <p className="font-medium text-gray-900">
        {lead.firstName} {lead.lastName}
      </p>
      <p className="text-xs text-gray-500">{lead.email || lead.phone || 'No contact info'}</p>
      <p className="text-xs text-gray-400">Source: {lead.source ?? 'unknown'}</p>

      <select
        value={lead.status}
        disabled={pending}
        onChange={(e) => startTransition(() => updateLeadStatus(lead.id, e.target.value))}
        className="mt-2 w-full rounded-md border border-gray-300 px-2 py-1 text-xs"
      >
        {STATUS_OPTIONS.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>

      {lead.communications.length > 0 && (
        <ul className="mt-2 space-y-1 border-t border-gray-100 pt-2 text-xs text-gray-600">
          {lead.communications.map((c) => (
            <li key={c.id}>{c.body}</li>
          ))}
        </ul>
      )}

      <form action={addLeadNote} className="mt-2 flex gap-1">
        <input type="hidden" name="leadId" value={lead.id} />
        <input
          name="body"
          placeholder="Add note…"
          required
          className="flex-1 rounded-md border border-gray-300 px-2 py-1 text-xs"
        />
        <button type="submit" className="rounded-md bg-brand-600 px-2 py-1 text-xs font-medium text-white">
          Add
        </button>
      </form>
    </div>
  )
}
