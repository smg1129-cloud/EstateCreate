'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  isQuestionVisible,
  isSectionVisible,
  type Answers,
  type AnswerValue,
  type Question,
  type Questionnaire,
  type YesNoExplain,
} from '@/lib/questionnaire'

type SubmitResult = { ok: boolean; error?: string; nextPath?: string }

export function QuestionnaireForm({
  questionnaire,
  initialAnswers,
  externalAnswers,
  action,
  submitLabel = 'Save & continue',
}: {
  questionnaire: Questionnaire
  initialAnswers: Answers
  externalAnswers: Answers
  action: (answers: Answers) => Promise<SubmitResult>
  submitLabel?: string
}) {
  const router = useRouter()
  const [answers, setAnswers] = useState<Answers>(initialAnswers ?? {})
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Combined view used only for evaluating visibility conditions (a section in
  // the estate intake can depend on a triage answer).
  const combined = useMemo<Answers>(() => ({ ...externalAnswers, ...answers }), [externalAnswers, answers])

  function set(id: string, value: AnswerValue) {
    setAnswers((prev) => ({ ...prev, [id]: value }))
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    const res = await action(answers)
    setSaving(false)
    if (!res.ok) {
      setError(res.error ?? 'Something went wrong saving your answers.')
      return
    }
    if (res.nextPath) {
      router.push(res.nextPath)
      router.refresh()
    }
  }

  const sections = questionnaire.sections.filter((s) => isSectionVisible(s, combined))

  return (
    <form onSubmit={onSubmit} className="space-y-10">
      {questionnaire.intro && (
        <p className="rounded-lg bg-brand-50 p-4 text-sm text-brand-900">{questionnaire.intro}</p>
      )}
      {sections.map((section) => (
        <section key={section.id} className="rounded-lg border border-gray-100 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">{section.title}</h2>
          {section.description && <p className="mt-1 text-sm text-gray-500">{section.description}</p>}
          <div className="mt-5 space-y-6">
            {section.questions
              .filter((q) => isQuestionVisible(q, combined))
              .map((q) => (
                <Field key={q.id} q={q} value={answers[q.id]} onChange={(v) => set(q.id, v)} />
              ))}
          </div>
        </section>
      ))}
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex items-center gap-3">
        <button type="submit" disabled={saving}
          className="rounded-md bg-brand-600 px-6 py-2.5 font-medium text-white hover:bg-brand-700 disabled:opacity-50">
          {saving ? 'Saving…' : submitLabel}
        </button>
        <span className="text-sm text-gray-400">Your progress is saved.</span>
      </div>
    </form>
  )
}

function Label({ q }: { q: Question }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-800">
        {q.label}
        {q.required && <span className="text-red-500"> *</span>}
      </label>
      {q.help && <p className="mt-0.5 text-xs text-gray-500">{q.help}</p>}
    </div>
  )
}

const inputCls = 'mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm'

function Field({ q, value, onChange }: { q: Question; value: AnswerValue; onChange: (v: AnswerValue) => void }) {
  switch (q.type) {
    case 'long_text':
      return (
        <div>
          <Label q={q} />
          <textarea rows={3} className={inputCls} value={(value as string) ?? ''} onChange={(e) => onChange(e.target.value)} />
        </div>
      )
    case 'boolean':
      return (
        <div>
          <Label q={q} />
          <div className="mt-1 flex gap-4 text-sm">
            {[['Yes', true], ['No', false]].map(([lbl, val]) => (
              <label key={String(val)} className="flex items-center gap-1.5">
                <input type="radio" name={q.id} checked={value === val} onChange={() => onChange(val as boolean)} />
                {lbl}
              </label>
            ))}
          </div>
        </div>
      )
    case 'yesno_explain': {
      const v = (value as YesNoExplain) ?? { value: undefined as unknown as YesNoExplain['value'] }
      return (
        <div>
          <Label q={q} />
          <div className="mt-1 flex gap-4 text-sm">
            {(['yes', 'no', 'unsure'] as const).map((opt) => (
              <label key={opt} className="flex items-center gap-1.5 capitalize">
                <input type="radio" name={q.id} checked={v.value === opt}
                  onChange={() => onChange({ value: opt, explain: v.explain })} />
                {opt === 'unsure' ? 'Not sure' : opt}
              </label>
            ))}
          </div>
          {v.value === 'yes' && (
            <textarea rows={2} className={inputCls} placeholder="Please explain" value={v.explain ?? ''}
              onChange={(e) => onChange({ value: 'yes', explain: e.target.value })} />
          )}
        </div>
      )
    }
    case 'select':
      return (
        <div>
          <Label q={q} />
          <div className="mt-1 space-y-1.5">
            {q.options?.map((o) => (
              <label key={o.value} className="flex items-start gap-2 text-sm">
                <input type="radio" name={q.id} className="mt-1" checked={value === o.value} onChange={() => onChange(o.value)} />
                <span>{o.label}</span>
              </label>
            ))}
          </div>
        </div>
      )
    case 'multiselect': {
      const arr = Array.isArray(value) ? (value as string[]) : []
      return (
        <div>
          <Label q={q} />
          <div className="mt-1 space-y-1.5">
            {q.options?.map((o) => (
              <label key={o.value} className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={arr.includes(o.value)}
                  onChange={(e) => onChange(e.target.checked ? [...arr, o.value] : arr.filter((x) => x !== o.value))} />
                {o.label}
              </label>
            ))}
          </div>
        </div>
      )
    }
    case 'group':
      return <GroupField q={q} value={value} onChange={onChange} />
    default: {
      const type = q.type === 'money' || q.type === 'number' ? 'text' : q.type === 'date' ? 'date' : q.type === 'email' ? 'email' : 'text'
      return (
        <div>
          <Label q={q} />
          <input type={type} className={inputCls} placeholder={q.placeholder ?? (q.type === 'money' ? '$' : q.type === 'state' ? 'FL' : '')}
            value={(value as string) ?? ''} onChange={(e) => onChange(e.target.value)} />
        </div>
      )
    }
  }
}

function GroupField({ q, value, onChange }: { q: Question; value: AnswerValue; onChange: (v: AnswerValue) => void }) {
  const rows = Array.isArray(value) ? (value as Record<string, unknown>[]) : []

  function updateRow(i: number, field: string, v: unknown) {
    const next = rows.map((r, idx) => (idx === i ? { ...r, [field]: v } : r))
    onChange(next as AnswerValue)
  }
  function addRow() {
    onChange([...rows, {}] as AnswerValue)
  }
  function removeRow(i: number) {
    onChange(rows.filter((_, idx) => idx !== i) as AnswerValue)
  }

  return (
    <div>
      <Label q={q} />
      <div className="mt-2 space-y-4">
        {rows.map((row, i) => (
          <div key={i} className="rounded-md border border-gray-200 bg-gray-50 p-3">
            <div className="grid gap-3 sm:grid-cols-2">
              {q.fields?.map((f) => (
                <SubField key={f.id} f={f} value={row[f.id]} onChange={(v) => updateRow(i, f.id, v)} />
              ))}
            </div>
            <button type="button" onClick={() => removeRow(i)} className="mt-2 text-xs text-red-600 hover:underline">
              Remove
            </button>
          </div>
        ))}
        <button type="button" onClick={addRow}
          className="rounded-md border border-dashed border-brand-400 px-4 py-1.5 text-sm font-medium text-brand-700 hover:bg-brand-50">
          + Add {rows.length === 0 ? '' : 'another'}
        </button>
      </div>
    </div>
  )
}

function SubField({ f, value, onChange }: { f: Question; value: unknown; onChange: (v: unknown) => void }) {
  if (f.type === 'boolean') {
    return (
      <label className="flex items-center gap-2 text-sm text-gray-700">
        <input type="checkbox" checked={value === true} onChange={(e) => onChange(e.target.checked)} />
        {f.label}
      </label>
    )
  }
  if (f.type === 'select') {
    return (
      <div>
        <label className="block text-xs font-medium text-gray-600">{f.label}</label>
        <select className={inputCls} value={(value as string) ?? ''} onChange={(e) => onChange(e.target.value)}>
          <option value="">Select…</option>
          {f.options?.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>
    )
  }
  const type = f.type === 'date' ? 'date' : f.type === 'number' ? 'text' : 'text'
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600">{f.label}</label>
      <input type={type} className={inputCls} value={(value as string) ?? ''} onChange={(e) => onChange(e.target.value)} />
    </div>
  )
}
