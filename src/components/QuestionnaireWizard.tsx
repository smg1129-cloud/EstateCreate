'use client'

// A section-by-section questionnaire wizard: one section per screen, a
// clickable step sidebar, a progress bar, per-section required-field validation,
// and auto-save on every step change. Answers persist through `saveProgress`
// (no navigation) as the client moves between sections; the final step calls
// `submit`, which finalizes and returns the next path.

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  isQuestionVisible,
  isSectionVisible,
  missingRequired,
  type Answers,
  type AnswerValue,
  type Questionnaire,
  type Section,
} from '@/lib/questionnaire'
import { Field } from './questionnaireFields'

type SaveResult = { ok: boolean; error?: string; nextPath?: string }

export function QuestionnaireWizard({
  questionnaire,
  initialAnswers,
  externalAnswers,
  saveProgress,
  submit,
  finalLabel = 'Submit',
}: {
  questionnaire: Questionnaire
  initialAnswers: Answers
  externalAnswers: Answers
  saveProgress: (answers: Answers) => Promise<SaveResult>
  submit: (answers: Answers) => Promise<SaveResult>
  finalLabel?: string
}) {
  const router = useRouter()
  const [answers, setAnswers] = useState<Answers>(initialAnswers ?? {})
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  const combined = useMemo<Answers>(() => ({ ...externalAnswers, ...answers }), [externalAnswers, answers])
  const sections = useMemo<Section[]>(
    () => questionnaire.sections.filter((s) => isSectionVisible(s, combined)),
    [questionnaire, combined]
  )

  // Resume at the first section with missing required answers, else the start.
  const [step, setStep] = useState(() => {
    const initCombined = { ...externalAnswers, ...(initialAnswers ?? {}) }
    const visible = questionnaire.sections.filter((s) => isSectionVisible(s, initCombined))
    const idx = visible.findIndex((s) => missingRequired(s, initCombined).length > 0)
    return idx < 0 ? 0 : idx
  })
  const [reached, setReached] = useState(step)

  const total = sections.length
  const clamped = Math.min(step, Math.max(0, total - 1))
  const current = sections[clamped]
  const isLast = clamped === total - 1

  if (!current) return null

  const currentMissing = missingRequired(current, combined)

  function set(id: string, value: AnswerValue) {
    setAnswers((prev) => ({ ...prev, [id]: value }))
    setSaved(false)
  }

  async function persist(): Promise<boolean> {
    setSaving(true)
    setError('')
    const res = await saveProgress(answers)
    setSaving(false)
    if (!res.ok) {
      setError(res.error ?? 'Could not save your answers. Please try again.')
      return false
    }
    setSaved(true)
    return true
  }

  function goToStep(i: number) {
    setStep(i)
    setReached((r) => Math.max(r, i))
    setError('')
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function jumpTo(i: number) {
    if (i === clamped) return
    if (await persist()) goToStep(i)
  }

  async function next() {
    if (currentMissing.length > 0) {
      setError('Please complete the required fields on this page before continuing.')
      return
    }
    if (await persist()) goToStep(clamped + 1)
  }

  function back() {
    if (clamped > 0) goToStep(clamped - 1)
  }

  async function finish() {
    const firstIncomplete = sections.findIndex((s) => missingRequired(s, combined).length > 0)
    if (firstIncomplete >= 0) {
      goToStep(firstIncomplete)
      setError('Please complete the required fields on this page before submitting.')
      return
    }
    setSaving(true)
    setError('')
    const res = await submit(answers)
    setSaving(false)
    if (!res.ok) {
      setError(res.error ?? 'Something went wrong. Please try again.')
      return
    }
    if (res.nextPath) {
      router.push(res.nextPath)
      router.refresh()
    }
  }

  const percent = Math.round(((clamped + 1) / total) * 100)

  return (
    <div>
      {/* Progress bar */}
      <div className="mb-6">
        <div className="mb-1 flex items-center justify-between text-sm text-gray-500">
          <span>
            Section {clamped + 1} of {total}
          </span>
          <span>{percent}% complete</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
          <div className="h-full rounded-full bg-brand-600 transition-all" style={{ width: `${percent}%` }} />
        </div>
      </div>

      <div className="grid gap-8 md:grid-cols-[220px_1fr]">
        {/* Step sidebar */}
        <nav className="hidden md:block" aria-label="Sections">
          <ol className="space-y-1">
            {sections.map((s, i) => {
              const done = i !== clamped && i <= reached && missingRequired(s, combined).length === 0
              const isCurrent = i === clamped
              return (
                <li key={s.id}>
                  <button
                    type="button"
                    onClick={() => jumpTo(i)}
                    className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm ${
                      isCurrent ? 'bg-brand-50 font-medium text-brand-800' : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <span
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] ${
                        isCurrent ? 'bg-brand-600 text-white' : done ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'
                      }`}
                    >
                      {done ? '✓' : i + 1}
                    </span>
                    <span className="truncate">{s.title}</span>
                  </button>
                </li>
              )
            })}
          </ol>
        </nav>

        {/* Current section */}
        <div>
          {clamped === 0 && questionnaire.intro && (
            <p className="mb-5 rounded-lg bg-brand-50 p-4 text-sm text-brand-900">{questionnaire.intro}</p>
          )}
          <section className="rounded-lg border border-gray-100 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">{current.title}</h2>
            {current.description && <p className="mt-1 text-sm text-gray-500">{current.description}</p>}
            <div className="mt-5 space-y-6">
              {current.questions
                .filter((q) => isQuestionVisible(q, combined))
                .map((q) => (
                  <Field key={q.id} q={q} value={answers[q.id]} onChange={(v) => set(q.id, v)} />
                ))}
            </div>
          </section>

          {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

          <div className="mt-6 flex items-center justify-between">
            <button
              type="button"
              onClick={back}
              disabled={clamped === 0 || saving}
              className="rounded-md border border-gray-300 px-5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40"
            >
              ← Back
            </button>
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-400">{saving ? 'Saving…' : saved ? 'Saved ✓' : 'Progress saves as you go'}</span>
              {isLast ? (
                <button
                  type="button"
                  onClick={finish}
                  disabled={saving}
                  className="rounded-md bg-brand-600 px-6 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
                >
                  {finalLabel}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={next}
                  disabled={saving}
                  className="rounded-md bg-brand-600 px-6 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
                >
                  Next →
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
