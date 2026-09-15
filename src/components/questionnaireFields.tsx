'use client'

// Shared input primitives for rendering a single questionnaire question. Used
// by the multi-step QuestionnaireWizard (and available to any other form). Each
// `Field` is fully controlled: it renders the right control for the question
// type and reports changes through onChange.

import type { AnswerValue, Question, YesNoExplain } from '@/lib/questionnaire'

export const inputCls = 'mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm'

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

export function Field({ q, value, onChange }: { q: Question; value: AnswerValue; onChange: (v: AnswerValue) => void }) {
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
  const type = f.type === 'date' ? 'date' : 'text'
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600">{f.label}</label>
      <input type={type} className={inputCls} value={(value as string) ?? ''} onChange={(e) => onChange(e.target.value)} />
    </div>
  )
}
