'use client'

import { useState, type FormEvent } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { MFA_REQUIRED, MFA_INVALID } from '@/lib/auth'

export default function LoginPage() {
  const router = useRouter()
  const params = useSearchParams()
  const callbackUrl = params.get('callbackUrl') ?? '/'
  const timedOut = params.get('reason') === 'timeout'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [totpCode, setTotpCode] = useState('')
  const [needsTotp, setNeedsTotp] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    const result = await signIn('credentials', {
      email,
      password,
      totpCode: needsTotp ? totpCode : undefined,
      redirect: false,
    })

    setSubmitting(false)

    if (!result) return

    if (result.error === MFA_REQUIRED) {
      setNeedsTotp(true)
      return
    }
    if (result.error === MFA_INVALID) {
      setError('That code was incorrect. Try again.')
      return
    }
    if (result.error) {
      setError('Invalid email or password.')
      return
    }

    router.push(callbackUrl)
    router.refresh()
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4">
      <h1 className="mb-1 text-2xl font-semibold text-gray-900">Sign in</h1>
      <p className="mb-6 text-sm text-gray-600">Meridian Health patient and staff portal.</p>

      {timedOut && (
        <p className="mb-4 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800">
          You were signed out due to inactivity. Please sign in again.
        </p>
      )}
      {error && (
        <p role="alert" className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </p>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            autoComplete="username"
            disabled={needsTotp}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 disabled:bg-gray-100"
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            autoComplete="current-password"
            disabled={needsTotp}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 disabled:bg-gray-100"
          />
        </div>

        {needsTotp && (
          <div>
            <label htmlFor="totp" className="block text-sm font-medium text-gray-700">
              Authenticator app code
            </label>
            <input
              id="totp"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              autoFocus
              required
              value={totpCode}
              onChange={(e) => setTotpCode(e.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
            />
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-md bg-brand-600 px-4 py-2 font-medium text-white hover:bg-brand-700 disabled:opacity-60"
        >
          {submitting ? 'Signing in…' : needsTotp ? 'Verify and sign in' : 'Continue'}
        </button>
      </form>
    </main>
  )
}
