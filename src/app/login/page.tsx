'use client'

import { Suspense, useState } from 'react'
import { signIn, getSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { OAuthButtons } from '@/components/auth/OAuthButtons'

const MFA_REQUIRED = 'MFA_REQUIRED'
const MFA_INVALID = 'MFA_INVALID'

// Codes set by the NextAuth signIn callback (redirected to /login?error=…).
const OAUTH_ERRORS: Record<string, string> = {
  staff_oauth:
    'Firm staff sign in with email, password, and an authenticator code — social sign-in is for clients.',
  oauth_no_email: 'That provider did not share an email address, so we could not sign you in.',
  oauth_unverified: 'Please verify your email with that provider before signing in.',
  account_inactive: 'This account is not active. Please contact the office.',
  oauth_unavailable: 'Social sign-in is temporarily unavailable. Please try email and password.',
  OAuthAccountNotLinked:
    'That email is already registered with a different sign-in method. Use your original method.',
}

function roleHome(role?: string): string {
  if (role === 'CLIENT') return '/portal'
  if (role === 'ATTORNEY' || role === 'PARALEGAL') return '/attorney'
  if (role === 'ADMIN') return '/admin'
  return '/'
}

function LoginForm() {
  const router = useRouter()
  const params = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [totpCode, setTotpCode] = useState('')
  const [showMfa, setShowMfa] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const timedOut = params.get('reason') === 'timeout'
  const oauthErrorCode = params.get('error')
  const oauthError = oauthErrorCode ? OAUTH_ERRORS[oauthErrorCode] : undefined

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const res = await signIn('credentials', { redirect: false, email, password, totpCode })
    setLoading(false)

    if (res?.error === MFA_REQUIRED) {
      setShowMfa(true)
      setError('Enter the 6-digit code from your authenticator app.')
      return
    }
    if (res?.error === MFA_INVALID) {
      setShowMfa(true)
      setError('That authenticator code was not valid. Try again.')
      return
    }
    if (res?.error) {
      setError('Invalid email or password.')
      return
    }
    const session = await getSession()
    router.push(params.get('callbackUrl') || roleHome(session?.user?.role))
    router.refresh()
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4">
      <Link href="/" className="mb-6 text-center text-xl font-semibold text-brand-700">
        Estate<span className="text-brand-500">Create</span>
      </Link>
      <div className="rounded-lg border border-gray-100 bg-white p-8 shadow-sm">
        <h1 className="text-xl font-bold text-gray-900">Sign in</h1>
        {timedOut && <p className="mt-2 text-sm text-amber-700">Your session timed out. Please sign in again.</p>}
        {oauthError && <p className="mt-2 text-sm text-red-600">{oauthError}</p>}
        <div className="mt-6">
          <OAuthButtons callbackUrl={params.get('callbackUrl') || '/portal'} />
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2" />
          </div>
          {showMfa && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Authenticator code</label>
              <input inputMode="numeric" value={totpCode} onChange={(e) => setTotpCode(e.target.value)}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2" placeholder="123456" />
            </div>
          )}
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" disabled={loading}
            className="w-full rounded-md bg-brand-600 px-4 py-2 font-medium text-white hover:bg-brand-700 disabled:opacity-50">
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-gray-500">
          New here?{' '}
          <Link href="/register" className="font-medium text-brand-700 hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
