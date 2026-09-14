'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'

export default function MfaSetupPage() {
  const router = useRouter()
  const { update } = useSession()
  const [qr, setQr] = useState<string | null>(null)
  const [otpauth, setOtpauth] = useState<string>('')
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function begin() {
    setLoading(true)
    setError('')
    const res = await fetch('/api/mfa/setup', { method: 'POST' })
    setLoading(false)
    if (!res.ok) {
      setError('Could not start enrollment.')
      return
    }
    const data = await res.json()
    setQr(data.qrDataUrl)
    setOtpauth(data.otpauth)
  }

  async function verify(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const res = await fetch('/api/mfa/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    })
    setLoading(false)
    if (!res.ok) {
      setError('That code was not valid. Try again.')
      return
    }
    await update({ requiresMfaSetup: false })
    router.push('/attorney')
    router.refresh()
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-10">
      <div className="rounded-lg border border-gray-100 bg-white p-8 shadow-sm">
        <h1 className="text-xl font-bold text-gray-900">Set up two-factor authentication</h1>
        <p className="mt-2 text-sm text-gray-600">
          Staff accounts must use an authenticator app. This protects the privileged client information in every
          matter.
        </p>

        {!qr ? (
          <button onClick={begin} disabled={loading}
            className="mt-6 w-full rounded-md bg-brand-600 px-4 py-2 font-medium text-white hover:bg-brand-700 disabled:opacity-50">
            {loading ? 'Preparing…' : 'Begin enrollment'}
          </button>
        ) : (
          <div className="mt-6 space-y-4">
            <p className="text-sm text-gray-600">Scan this with Google Authenticator, Authy, or 1Password:</p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qr} alt="TOTP QR code" className="mx-auto h-44 w-44" />
            <p className="break-all text-center text-xs text-gray-400">{otpauth}</p>
            <form onSubmit={verify} className="space-y-3">
              <input inputMode="numeric" value={code} onChange={(e) => setCode(e.target.value)}
                placeholder="6-digit code" className="w-full rounded-md border border-gray-300 px-3 py-2 text-center tracking-widest" />
              <button type="submit" disabled={loading}
                className="w-full rounded-md bg-brand-600 px-4 py-2 font-medium text-white hover:bg-brand-700 disabled:opacity-50">
                {loading ? 'Verifying…' : 'Verify & finish'}
              </button>
            </form>
          </div>
        )}
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      </div>
    </div>
  )
}
