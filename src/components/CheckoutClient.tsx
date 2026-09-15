'use client'

import { useMemo, useState, useTransition } from 'react'
import type { DocumentType } from '@prisma/client'

interface Item {
  type: DocumentType
  label: string
  origin: 'BASE' | 'PROPOSED'
  selected: boolean
  unitPriceCents: number
}

function money(cents: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format((cents ?? 0) / 100)
}

export function CheckoutClient({
  items,
  currency,
  saveSelection,
  pay,
}: {
  items: Item[]
  currency: string
  saveSelection: (selectedTypes: DocumentType[]) => Promise<{ subtotalCents: number }>
  pay: (selectedTypes: DocumentType[]) => Promise<void>
}) {
  const [selected, setSelected] = useState<Record<string, boolean>>(
    () => Object.fromEntries(items.map((i) => [i.type, i.selected])),
  )
  const [saving, startSaving] = useTransition()
  const [paying, startPaying] = useTransition()
  const [error, setError] = useState('')

  const selectedTypes = useMemo(
    () => items.filter((i) => selected[i.type]).map((i) => i.type),
    [items, selected],
  )
  const subtotal = useMemo(
    () => items.filter((i) => selected[i.type]).reduce((s, i) => s + i.unitPriceCents, 0),
    [items, selected],
  )
  const anySelected = selectedTypes.length > 0

  function toggle(type: DocumentType) {
    setSelected((prev) => {
      const next = { ...prev, [type]: !prev[type] }
      // Persist selection in the background so a refresh keeps the choice.
      const types = items.filter((i) => next[i.type]).map((i) => i.type)
      startSaving(() => {
        saveSelection(types).catch(() => {})
      })
      return next
    })
  }

  function onPay() {
    setError('')
    if (!anySelected) {
      setError('Select at least one document to continue.')
      return
    }
    startPaying(async () => {
      try {
        await pay(selectedTypes)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Something went wrong starting checkout.')
      }
    })
  }

  const base = items.filter((i) => i.origin === 'BASE')
  const proposed = items.filter((i) => i.origin === 'PROPOSED')

  return (
    <div className="rounded-lg border border-gray-100 bg-white shadow-sm">
      <Section title="Recommended plan" items={base} selected={selected} toggle={toggle} currency={currency} />
      {proposed.length > 0 && (
        <Section
          title="Suggested based on your answers"
          subtitle="Optional — added because of something you told us. Include or skip."
          items={proposed}
          selected={selected}
          toggle={toggle}
          currency={currency}
        />
      )}

      <div className="flex items-center justify-between border-t border-gray-100 px-5 py-4">
        <span className="text-sm font-medium text-gray-500">
          {saving ? 'Saving…' : `${selectedTypes.length} selected`}
        </span>
        <span className="text-lg font-bold text-gray-900">{money(subtotal, currency)}</span>
      </div>

      <div className="border-t border-gray-100 px-5 py-4">
        {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
        <button
          onClick={onPay}
          disabled={paying || !anySelected}
          className="w-full rounded-md bg-brand-600 px-4 py-2.5 font-medium text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {paying ? 'Redirecting to payment…' : `Pay ${money(subtotal, currency)} & prepare my documents`}
        </button>
        <p className="mt-2 text-center text-xs text-gray-400">
          Your documents are generated only after payment is received.
        </p>
      </div>
    </div>
  )
}

function Section({
  title,
  subtitle,
  items,
  selected,
  toggle,
  currency,
}: {
  title: string
  subtitle?: string
  items: Item[]
  selected: Record<string, boolean>
  toggle: (type: DocumentType) => void
  currency: string
}) {
  if (items.length === 0) return null
  return (
    <div className="border-b border-gray-100 px-5 py-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">{title}</p>
      {subtitle && <p className="mt-0.5 text-xs text-gray-400">{subtitle}</p>}
      <ul className="mt-3 space-y-2">
        {items.map((i) => (
          <li key={i.type}>
            <label className="flex cursor-pointer items-center justify-between gap-3 rounded-md px-2 py-2 hover:bg-gray-50">
              <span className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={Boolean(selected[i.type])}
                  onChange={() => toggle(i.type)}
                  className="h-4 w-4 rounded border-gray-300 text-brand-600"
                />
                <span className="text-sm text-gray-800">{i.label}</span>
              </span>
              <span className="text-sm font-medium text-gray-700">{money(i.unitPriceCents, currency)}</span>
            </label>
          </li>
        ))}
      </ul>
    </div>
  )
}
