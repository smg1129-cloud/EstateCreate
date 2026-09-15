'use client'

import { useEffect, useState } from 'react'
import { getProviders, signIn } from 'next-auth/react'
import Link from 'next/link'

type ProviderInfo = { id: string; name: string }

// Providers we know how to render, in display order. Anything else configured
// still renders with a generic label.
const KNOWN: Record<string, { label: string; icon: JSX.Element; className: string }> = {
  google: {
    label: 'Continue with Google',
    className: 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50',
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.26 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z" />
        <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z" />
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z" />
      </svg>
    ),
  },
  'azure-ad': {
    label: 'Continue with Microsoft',
    className: 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50',
    icon: (
      <svg viewBox="0 0 23 23" className="h-5 w-5" aria-hidden="true">
        <path fill="#F25022" d="M1 1h10v10H1z" />
        <path fill="#7FBA00" d="M12 1h10v10H12z" />
        <path fill="#00A4EF" d="M1 12h10v10H1z" />
        <path fill="#FFB900" d="M12 12h10v10H12z" />
      </svg>
    ),
  },
  apple: {
    label: 'Continue with Apple',
    className: 'border border-black bg-black text-white hover:bg-gray-900',
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
        <path d="M17.05 12.54c-.02-2.02 1.65-2.99 1.73-3.04-.94-1.38-2.41-1.57-2.93-1.59-1.25-.13-2.44.73-3.07.73-.63 0-1.61-.71-2.65-.69-1.36.02-2.62.79-3.32 2.01-1.42 2.46-.36 6.1 1.02 8.1.67.98 1.47 2.08 2.52 2.04 1.01-.04 1.39-.65 2.61-.65 1.22 0 1.56.65 2.63.63 1.09-.02 1.78-1 2.44-1.98.77-1.13 1.09-2.23 1.11-2.29-.02-.01-2.13-.82-2.15-3.26zM15.03 6.3c.56-.68.94-1.62.83-2.56-.81.03-1.79.54-2.37 1.22-.52.6-.97 1.56-.85 2.48.9.07 1.83-.46 2.39-1.14z" />
      </svg>
    ),
  },
  facebook: {
    label: 'Continue with Facebook',
    className: 'border border-[#1877F2] bg-[#1877F2] text-white hover:bg-[#166fe0]',
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
        <path d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07c0 6.02 4.39 11.01 10.13 11.93v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.68.24 2.68.24v2.97h-1.51c-1.49 0-1.95.93-1.95 1.89v2.25h3.32l-.53 3.49h-2.79V24C19.61 23.08 24 18.09 24 12.07z" />
      </svg>
    ),
  },
}

export function OAuthButtons({ callbackUrl = '/portal' }: { callbackUrl?: string }) {
  const [providers, setProviders] = useState<ProviderInfo[] | null>(null)

  useEffect(() => {
    let active = true
    getProviders().then((p) => {
      if (!active) return
      const list = Object.values(p ?? {})
        .filter((prov) => prov.id !== 'credentials')
        .map((prov) => ({ id: prov.id, name: prov.name }))
      setProviders(list)
    })
    return () => {
      active = false
    }
  }, [])

  if (!providers || providers.length === 0) return null

  return (
    <div className="mt-2">
      <div className="space-y-2">
        {providers.map((prov) => {
          const known = KNOWN[prov.id]
          return (
            <button
              key={prov.id}
              type="button"
              onClick={() => signIn(prov.id, { callbackUrl })}
              className={`flex w-full items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition ${
                known?.className ?? 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              {known?.icon}
              <span>{known?.label ?? `Continue with ${prov.name}`}</span>
            </button>
          )
        })}
      </div>

      <p className="mt-3 text-center text-xs text-gray-400">
        By continuing with a social account you agree to our{' '}
        <Link href="/legal" className="underline hover:text-gray-600" target="_blank">
          Terms of Service and Privacy Notice
        </Link>{' '}
        and consent to electronic records (E-SIGN / UETA). Social sign-in creates a
        client account; no attorney-client relationship exists until the firm accepts
        your engagement.
      </p>

      <div className="my-5 flex items-center gap-3">
        <span className="h-px flex-1 bg-gray-200" />
        <span className="text-xs uppercase tracking-wide text-gray-400">or</span>
        <span className="h-px flex-1 bg-gray-200" />
      </div>
    </div>
  )
}
