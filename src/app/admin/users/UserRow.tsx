'use client'

import { useTransition } from 'react'
import type { User } from '@prisma/client'
import { setUserStatus } from './actions'

export function UserRow({ user }: { user: User }) {
  const [pending, startTransition] = useTransition()
  const nextStatus = user.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE'

  return (
    <tr>
      <td className="py-2 font-medium text-gray-900">
        {user.firstName} {user.lastName}
      </td>
      <td className="py-2 text-gray-600">{user.email}</td>
      <td className="py-2 text-gray-600">{user.role}</td>
      <td className="py-2 text-gray-600">{user.status}</td>
      <td className="py-2 text-gray-600">{user.mfaEnabled ? 'Enrolled' : '—'}</td>
      <td className="py-2">
        <button
          disabled={pending}
          onClick={() => startTransition(() => setUserStatus(user.id, nextStatus))}
          className="text-xs text-brand-700 underline disabled:opacity-50"
        >
          {nextStatus === 'SUSPENDED' ? 'Suspend' : 'Reactivate'}
        </button>
      </td>
    </tr>
  )
}
