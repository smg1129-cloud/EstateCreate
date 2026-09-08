'use client'

import { useEffect, useState } from 'react'
import { useFormState, useFormStatus } from 'react-dom'
import Link from 'next/link'
import {
  getStatesWithCoverage,
  getProvidersForState,
  getAvailableSlots,
  submitBooking,
  type BookingProvider,
  type BookingState,
} from './actions'

const STEPS = ['State', 'Provider & time', 'Your info', 'Consent'] as const

const initialBookingState: BookingState = { ok: false }

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-md bg-brand-600 px-6 py-2 font-medium text-white hover:bg-brand-700 disabled:opacity-60"
    >
      {pending ? 'Booking…' : 'Confirm booking'}
    </button>
  )
}

export default function BookPage() {
  const [step, setStep] = useState(0)
  const [states, setStates] = useState<string[]>([])
  const [state, setState] = useState('')
  const [providers, setProviders] = useState<BookingProvider[]>([])
  const [providerId, setProviderId] = useState('')
  const [slots, setSlots] = useState<string[]>([])
  const [slot, setSlot] = useState('')

  const [bookingState, formAction] = useFormState(submitBooking, initialBookingState)

  useEffect(() => {
    getStatesWithCoverage().then(setStates)
  }, [])

  useEffect(() => {
    if (!state) return
    setProviderId('')
    setProviders([])
    getProvidersForState(state).then(setProviders)
  }, [state])

  useEffect(() => {
    if (!providerId) return
    setSlot('')
    setSlots([])
    getAvailableSlots(providerId).then(setSlots)
  }, [providerId])

  if (bookingState.ok) {
    return (
      <main className="mx-auto max-w-xl px-4 py-20 text-center">
        <h1 className="text-2xl font-semibold text-gray-900">You&apos;re booked</h1>
        <p className="mt-3 text-gray-600">
          We&apos;ve created your account and confirmed your appointment. Sign in to view your visit
          details and complete anything else on your patient portal.
        </p>
        <Link
          href="/login"
          className="mt-6 inline-block rounded-md bg-brand-600 px-5 py-2 font-medium text-white hover:bg-brand-700"
        >
          Sign in
        </Link>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-2xl font-bold text-gray-900">Book a visit</h1>

      <ol className="mt-4 mb-8 flex gap-4 text-sm">
        {STEPS.map((label, i) => (
          <li key={label} className={i === step ? 'font-semibold text-brand-700' : 'text-gray-400'}>
            {i + 1}. {label}
          </li>
        ))}
      </ol>

      {step === 0 && (
        <section>
          <label htmlFor="state" className="block text-sm font-medium text-gray-700">
            What state are you located in right now?
          </label>
          <p className="mt-1 text-xs text-gray-500">
            We only show clinicians who are actively licensed to treat patients physically located in
            this state.
          </p>
          <select
            id="state"
            value={state}
            onChange={(e) => setState(e.target.value)}
            className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2"
          >
            <option value="">Select a state…</option>
            {states.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <button
            type="button"
            disabled={!state}
            onClick={() => setStep(1)}
            className="mt-6 rounded-md bg-brand-600 px-5 py-2 font-medium text-white hover:bg-brand-700 disabled:opacity-50"
          >
            Continue
          </button>
        </section>
      )}

      {step === 1 && (
        <section>
          <fieldset>
            <legend className="text-sm font-medium text-gray-700">Choose a provider</legend>
            <div className="mt-2 space-y-3">
              {providers.map((p) => (
                <label
                  key={p.id}
                  className={`block cursor-pointer rounded-lg border p-4 ${
                    providerId === p.id ? 'border-brand-600 ring-1 ring-brand-600' : 'border-gray-200'
                  }`}
                >
                  <input
                    type="radio"
                    name="providerId"
                    value={p.id}
                    checked={providerId === p.id}
                    onChange={() => setProviderId(p.id)}
                    className="sr-only"
                  />
                  <p className="font-medium text-gray-900">{p.name}</p>
                  <p className="text-sm text-gray-600">{p.specialties.join(', ')}</p>
                </label>
              ))}
              {providers.length === 0 && (
                <p className="text-sm text-gray-500">No providers currently licensed in this state.</p>
              )}
            </div>
          </fieldset>

          {providerId && (
            <fieldset className="mt-6">
              <legend className="text-sm font-medium text-gray-700">Choose a time</legend>
              <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
                {slots.map((s) => (
                  <label
                    key={s}
                    className={`cursor-pointer rounded-md border px-3 py-2 text-center text-sm ${
                      slot === s ? 'border-brand-600 bg-brand-50 text-brand-800' : 'border-gray-200'
                    }`}
                  >
                    <input
                      type="radio"
                      name="slot"
                      value={s}
                      checked={slot === s}
                      onChange={() => setSlot(s)}
                      className="sr-only"
                    />
                    {new Date(s).toLocaleString(undefined, {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </label>
                ))}
              </div>
            </fieldset>
          )}

          <div className="mt-6 flex gap-3">
            <button type="button" onClick={() => setStep(0)} className="text-sm text-gray-600 underline">
              Back
            </button>
            <button
              type="button"
              disabled={!providerId || !slot}
              onClick={() => setStep(2)}
              className="rounded-md bg-brand-600 px-5 py-2 font-medium text-white hover:bg-brand-700 disabled:opacity-50"
            >
              Continue
            </button>
          </div>
        </section>
      )}

      {(step === 2 || step === 3) && (
        <form action={formAction}>
          <input type="hidden" name="state" value={state} />
          <input type="hidden" name="providerId" value={providerId} />
          <input type="hidden" name="slot" value={slot} />

          {/* Rendered (not unmounted) at both step 2 and 3 — inputs must stay in
              the DOM so their values are part of the FormData when the form
              is finally submitted at step 3. Only visually hidden via CSS. */}
          <section className={step === 2 ? 'space-y-4' : 'hidden'} aria-hidden={step !== 2}>
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
                <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700">
                  Date of birth
                </label>
                <input
                  id="dateOfBirth"
                  name="dateOfBirth"
                  type="date"
                  required
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
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
                    Phone
                  </label>
                  <input id="phone" name="phone" className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2" />
                </div>
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Create a password for your patient portal
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  minLength={10}
                  required
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
                />
              </div>
              <div>
                <label htmlFor="addressLine1" className="block text-sm font-medium text-gray-700">
                  Address (optional)
                </label>
                <input
                  id="addressLine1"
                  name="addressLine1"
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="city" className="block text-sm font-medium text-gray-700">
                    City
                  </label>
                  <input id="city" name="city" className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2" />
                </div>
                <div>
                  <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700">
                    ZIP code
                  </label>
                  <input
                    id="postalCode"
                    name="postalCode"
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="reasonForVisit" className="block text-sm font-medium text-gray-700">
                  What would you like to discuss? (optional)
                </label>
                <textarea
                  id="reasonForVisit"
                  name="reasonForVisit"
                  rows={3}
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
                />
              </div>

              <div className="flex gap-3">
                <button type="button" onClick={() => setStep(1)} className="text-sm text-gray-600 underline">
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="rounded-md bg-brand-600 px-5 py-2 font-medium text-white hover:bg-brand-700"
                >
                  Continue
                </button>
              </div>
          </section>

          <section className={step === 3 ? 'space-y-4' : 'hidden'} aria-hidden={step !== 3}>
            <p className="text-sm text-gray-600">
              Please review and acknowledge each item before confirming your visit.
            </p>
            <ConsentCheckbox
              name="consentPrivacy"
              label={
                <>
                  I have reviewed the <Link href="/privacy" className="underline">Notice of Privacy Practices</Link>
                </>
              }
            />
            <ConsentCheckbox
              name="consentTelehealth"
              label="I consent to receive care via telehealth and understand its limitations"
            />
            <ConsentCheckbox
              name="consentTerms"
              label={
                <>
                  I agree to the <Link href="/terms" className="underline">Terms of Service</Link>
                </>
              }
            />
            <ConsentCheckbox name="consentFinancial" label="I understand and accept financial responsibility for this visit" />

            {bookingState.error && (
              <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-800">
                {bookingState.error}
              </p>
            )}

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setStep(2)} className="text-sm text-gray-600 underline">
                Back
              </button>
              <SubmitButton />
            </div>
          </section>
        </form>
      )}
    </main>
  )
}

function ConsentCheckbox({ name, label }: { name: string; label: React.ReactNode }) {
  return (
    <label className="flex items-start gap-3 text-sm text-gray-700">
      <input type="checkbox" name={name} required className="mt-1" />
      <span>{label}</span>
    </label>
  )
}
