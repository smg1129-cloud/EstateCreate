'use client'

import { useTransition } from 'react'
import type { Provider, ProviderLicense, User } from '@prisma/client'
import { setLicenseStatus } from './actions'

type LicenseWithProvider = ProviderLicense & { provider: Provider & { user: User } }

export function LicenseRow({ license }: { license: LicenseWithProvider }) {
  const [pending, startTransition] = useTransition()
  const expired = license.expiresAt < new Date()

  return (
    <tr>
      <td className="py-2 font-medium text-gray-900">
        {license.provider.user.firstName} {license.provider.user.lastName}
      </td>
      <td className="py-2 text-gray-600">{license.state}</td>
      <td className="py-2 text-gray-600">{license.licenseNumber}</td>
      <td className="py-2 text-gray-600">{new Date(license.expiresAt).toLocaleDateString()}</td>
      <td className="py-2">
        <span
          className={`rounded px-1.5 py-0.5 text-xs ${
            license.status === 'ACTIVE' && !expired
              ? 'bg-green-100 text-green-800'
              : 'bg-red-100 text-red-800'
          }`}
        >
          {expired ? 'EXPIRED' : license.status}
        </span>
      </td>
      <td className="py-2">
        <button
          disabled={pending}
          onClick={() =>
            startTransition(() => setLicenseStatus(license.id, license.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE'))
          }
          className="text-xs text-brand-700 underline disabled:opacity-50"
        >
          {license.status === 'ACTIVE' ? 'Suspend' : 'Reactivate'}
        </button>
      </td>
    </tr>
  )
}
