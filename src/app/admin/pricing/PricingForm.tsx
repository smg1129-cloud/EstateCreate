'use client'

import { useState, useTransition } from 'react'
import { savePrices } from './actions'
import type { DocumentType } from '@prisma/client'

interface Row {
  type: DocumentType
  label: string
  dollars: string
  active: boolean
}

export function PricingForm({ rows }: { rows: Row[] }) {
  const [saving, startSaving] = useTransition()
  const [message, setMessage] = useState('')

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setMessage('')
    const formData = new FormData(e.currentTarget)
    startSaving(async () => {
      const res = await savePrices(formData)
      setMessage(res.ok ? `Saved ${res.count} prices.` : res.error)
    })
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="overflow-hidden rounded-lg border border-gray-100 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-4 py-3">Document</th>
              <th className="px-4 py-3 w-40">Fee (USD)</th>
              <th className="px-4 py-3 w-28">Offered</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((r) => (
              <tr key={r.type}>
                <td className="px-4 py-3 text-gray-800">{r.label}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <span className="text-gray-400">$</span>
                    <input
                      type="number"
                      name={`price_${r.type}`}
                      defaultValue={r.dollars}
                      min="0"
                      step="0.01"
                      className="w-28 rounded-md border border-gray-300 px-2 py-1"
                    />
                  </div>
                </td>
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    name={`active_${r.type}`}
                    defaultChecked={r.active}
                    className="h-4 w-4 rounded border-gray-300 text-brand-600"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="rounded-md bg-brand-600 px-4 py-2 font-medium text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save pricing'}
        </button>
        {message && <span className="text-sm text-gray-600">{message}</span>}
      </div>
    </form>
  )
}
