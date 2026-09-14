'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createStaffUser } from './actions'

export function CreateStaffForm() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaving(true)
    setError('')
    const res = await createStaffUser(new FormData(e.currentTarget))
    setSaving(false)
    if (!res.ok) {
      setError(res.error)
      return
    }
    e.currentTarget.reset()
    setOpen(false)
    router.refresh()
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">
        + Add staff user
      </button>
    )
  }

  return (
    <form onSubmit={onSubmit} className="rounded-lg border border-gray-200 bg-white p-5">
      <h3 className="font-semibold text-gray-900">New staff user</h3>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <input name="firstName" required placeholder="First name" className="rounded-md border border-gray-300 px-3 py-2 text-sm" />
        <input name="lastName" required placeholder="Last name" className="rounded-md border border-gray-300 px-3 py-2 text-sm" />
        <input name="email" type="email" required placeholder="Email" className="rounded-md border border-gray-300 px-3 py-2 text-sm" />
        <select name="role" className="rounded-md border border-gray-300 px-3 py-2 text-sm">
          <option value="ATTORNEY">Attorney</option>
          <option value="PARALEGAL">Paralegal</option>
          <option value="ADMIN">Admin</option>
        </select>
        <input name="barNumber" placeholder="FL Bar number (attorneys)" className="rounded-md border border-gray-300 px-3 py-2 text-sm" />
        <input name="password" type="text" required minLength={10} placeholder="Temporary password (10+ chars)" className="rounded-md border border-gray-300 px-3 py-2 text-sm" />
      </div>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      <div className="mt-3 flex gap-2">
        <button type="submit" disabled={saving} className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50">
          {saving ? 'Creating…' : 'Create user'}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="rounded-md px-4 py-2 text-sm text-gray-500 hover:text-gray-800">
          Cancel
        </button>
      </div>
      <p className="mt-2 text-xs text-gray-400">The user must enroll in two-factor authentication at first sign-in.</p>
    </form>
  )
}
