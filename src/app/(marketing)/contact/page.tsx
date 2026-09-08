'use client'

import { useFormState, useFormStatus } from 'react-dom'
import { submitContactForm, type ContactFormState } from './actions'

const initialState: ContactFormState = { ok: false }

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-md bg-brand-600 px-5 py-2 font-medium text-white hover:bg-brand-700 disabled:opacity-60"
    >
      {pending ? 'Sending…' : 'Send message'}
    </button>
  )
}

export default function ContactPage() {
  const [state, formAction] = useFormState(submitContactForm, initialState)

  return (
    <main className="mx-auto max-w-2xl px-4 py-16">
      <h1 className="text-3xl font-bold text-gray-900">Contact us</h1>
      <p className="mt-2 text-gray-600">
        Questions before booking? Send us a message and our team will follow up. For anything urgent,
        please book a visit directly or contact 911 / your local emergency services.
      </p>

      {state.ok ? (
        <p className="mt-8 rounded-md bg-green-50 px-4 py-3 text-green-800">
          Thanks — we received your message and will be in touch soon.
        </p>
      ) : (
        <form action={formAction} className="mt-8 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                First name
              </label>
              <input
                id="firstName"
                name="firstName"
                required
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
              />
            </div>
            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                Last name
              </label>
              <input
                id="lastName"
                name="lastName"
                required
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
              />
            </div>
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
            />
          </div>
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
              Phone (optional)
            </label>
            <input id="phone" name="phone" className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2" />
          </div>
          <div>
            <label htmlFor="message" className="block text-sm font-medium text-gray-700">
              Message
            </label>
            <textarea
              id="message"
              name="message"
              required
              rows={4}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
            />
          </div>
          {state.error && (
            <p role="alert" className="text-sm text-red-700">
              {state.error}
            </p>
          )}
          <SubmitButton />
        </form>
      )}
    </main>
  )
}
