'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function PayInvoiceButton({ invoiceId }: { invoiceId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handlePay() {
    setLoading(true)
    setError(null)
    const res = await fetch('/api/payments/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ invoiceId }),
    })
    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      setError(data.error ?? 'Could not start payment.')
      return
    }
    if (data.redirectUrl) {
      window.location.href = data.redirectUrl
    } else {
      router.refresh()
    }
  }

  return (
    <div className="text-right">
      <button
        onClick={handlePay}
        disabled={loading}
        className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
      >
        {loading ? 'Starting…' : 'Pay now'}
      </button>
      {error && <p className="mt-1 text-xs text-red-700">{error}</p>}
    </div>
  )
}
