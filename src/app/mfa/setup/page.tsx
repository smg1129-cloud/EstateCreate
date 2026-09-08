'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

const ROLE_HOME: Record<string, string> = {
  PATIENT: '/portal',
  STAFF: '/staff',
  CLINICIAN: '/clinician',
  ADMIN: '/admin',
}

export default function MfaSetupPage() {
  const { data: session, update } = useSession()
  const router = useRouter()

  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
  const [secret, setSecret] = useState<string | null>(null)
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [verifying, setVerifying] = useState(false)

  useEffect(() => {
    fetch('/api/mfa/setup', { method: 'POST' })
      .then((r) => r.json())
      .then((data) => {
        setQrDataUrl(data.qrDataUrl)
        setSecret(data.secret)
      })
  }, [])

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault()
    setVerifying(true)
    setError(null)

    const res = await fetch('/api/mfa/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    })

    setVerifying(false)

    if (!res.ok) {
      setError('That code did not match. Check your app and try again.')
      return
    }

    await update()
    const role = session?.user?.role ?? 'PATIENT'
    router.push(ROLE_HOME[role] ?? '/')
    router.refresh()
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4">
      <h1 className="mb-1 text-2xl font-semibold text-gray-900">Set up multi-factor authentication</h1>
      <p className="mb-6 text-sm text-gray-600">
        Staff, clinician, and admin accounts require MFA before continuing. Scan this QR code with an
        authenticator app (e.g. Google Authenticator, 1Password, Authy).
      </p>

      {qrDataUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={qrDataUrl} alt="Scan this QR code with your authenticator app" className="mb-4 h-48 w-48" />
      ) : (
        <p className="mb-4 text-sm text-gray-500">Generating your setup code…</p>
      )}

      {secret && (
        <p className="mb-6 break-all rounded-md bg-gray-50 px-3 py-2 font-mono text-xs text-gray-600">
          Can&apos;t scan? Enter this key manually: {secret}
        </p>
      )}

      {error && (
        <p role="alert" className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </p>
      )}

      <form onSubmit={handleVerify} className="space-y-4">
        <div>
          <label htmlFor="code" className="block text-sm font-medium text-gray-700">
            Enter the 6-digit code from your app
          </label>
          <input
            id="code"
            type="text"
            inputMode="numeric"
            required
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
          />
        </div>
        <button
          type="submit"
          disabled={verifying}
          className="w-full rounded-md bg-brand-600 px-4 py-2 font-medium text-white hover:bg-brand-700 disabled:opacity-60"
        >
          {verifying ? 'Verifying…' : 'Enable MFA and continue'}
        </button>
      </form>
    </main>
  )
}
