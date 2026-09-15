'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { registerClient } from './actions'
import { OAuthButtons } from '@/components/auth/OAuthButtons'

export default function RegisterPage() {
  const router = useRouter()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const form = new FormData(e.currentTarget)
    const res = await registerClient(form)
    if (!res.ok) {
      setError(res.error)
      setLoading(false)
      return
    }
    // Auto sign-in with the same credentials, then go to the portal.
    const signInRes = await signIn('credentials', {
      redirect: false,
      email: String(form.get('email')),
      password: String(form.get('password')),
    })
    setLoading(false)
    if (signInRes?.error) {
      router.push('/login')
      return
    }
    router.push('/portal')
    router.refresh()
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-10">
      <Link href="/" className="mb-6 text-center text-xl font-semibold text-brand-700">
        Estate<span className="text-brand-500">Create</span>
      </Link>
      <div className="rounded-lg border border-gray-100 bg-white p-8 shadow-sm">
        <h1 className="text-xl font-bold text-gray-900">Create your account</h1>
        <p className="mt-1 text-sm text-gray-500">Start your Florida estate plan. Takes a few minutes.</p>
        <div className="mt-6">
          <OAuthButtons callbackUrl="/portal" />
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">First name</label>
              <input name="firstName" required className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Last name</label>
              <input name="lastName" required className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input name="email" type="email" required className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input name="password" type="password" required minLength={10}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2" />
            <p className="mt-1 text-xs text-gray-400">At least 10 characters.</p>
          </div>
          <label className="flex items-start gap-2 text-sm text-gray-600">
            <input type="checkbox" name="acceptTerms" className="mt-1" />
            <span>
              I have read and agree to the{' '}
              <Link href="/legal" className="text-brand-700 underline" target="_blank">
                Terms of Service and Privacy Notice
              </Link>
              , and I understand that no attorney-client relationship exists until the firm accepts my engagement.
            </span>
          </label>
          <label className="flex items-start gap-2 text-sm text-gray-600">
            <input type="checkbox" name="acceptElectronic" className="mt-1" />
            <span>I consent to receiving records and signing documents electronically (E-SIGN / UETA).</span>
          </label>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" disabled={loading}
            className="w-full rounded-md bg-brand-600 px-4 py-2 font-medium text-white hover:bg-brand-700 disabled:opacity-50">
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-gray-500">
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-brand-700 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
