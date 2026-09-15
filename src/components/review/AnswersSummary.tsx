import {
  isQuestionVisible,
  isSectionVisible,
  type Answers,
  type Question,
  type Questionnaire,
  type YesNoExplain,
} from '@/lib/questionnaire'

function formatValue(q: Question, value: unknown): string | null {
  if (value == null || value === '') return null
  switch (q.type) {
    case 'boolean':
      return value === true ? 'Yes' : value === false ? 'No' : null
    case 'yesno_explain': {
      const v = value as YesNoExplain
      if (!v.value) return null
      const base = v.value === 'unsure' ? 'Not sure' : v.value === 'yes' ? 'Yes' : 'No'
      return v.explain ? `${base} — ${v.explain}` : base
    }
    case 'select': {
      const opt = q.options?.find((o) => o.value === value)
      return opt?.label ?? String(value)
    }
    case 'multiselect': {
      const arr = Array.isArray(value) ? (value as string[]) : []
      if (arr.length === 0) return null
      return arr.map((v) => q.options?.find((o) => o.value === v)?.label ?? v).join(', ')
    }
    case 'money':
      return `$${String(value)}`
    default:
      return String(value)
  }
}

function GroupRows({ q, rows }: { q: Question; rows: Record<string, unknown>[] }) {
  if (!rows.length) return null
  return (
    <div className="mt-1 space-y-2">
      {rows.map((row, i) => (
        <div key={i} className="rounded border border-gray-100 bg-gray-50 p-2 text-sm">
          {q.fields?.map((f) => {
            const val = formatValue(f, row[f.id])
            if (val == null) return null
            return (
              <div key={f.id} className="flex gap-2">
                <span className="text-gray-500">{f.label}:</span>
                <span className="text-gray-800">{val}</span>
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}

export function AnswersSummary({ questionnaire, answers }: { questionnaire: Questionnaire; answers: Answers }) {
  const sections = questionnaire.sections.filter((s) => isSectionVisible(s, answers))
  const anyAnswered = sections.some((s) =>
    s.questions.some((q) => isQuestionVisible(q, answers) && answers[q.id] != null)
  )
  if (!anyAnswered) return <p className="text-sm text-gray-400">No answers recorded.</p>

  return (
    <div className="space-y-4">
      {sections.map((section) => {
        const visible = section.questions.filter((q) => isQuestionVisible(q, answers))
        const rows = visible
          .map((q) => {
            if (q.type === 'group') {
              const groupRows = Array.isArray(answers[q.id]) ? (answers[q.id] as Record<string, unknown>[]) : []
              if (!groupRows.length) return null
              return (
                <div key={q.id}>
                  <p className="text-sm font-medium text-gray-700">{q.label}</p>
                  <GroupRows q={q} rows={groupRows} />
                </div>
              )
            }
            const val = formatValue(q, answers[q.id])
            if (val == null) return null
            return (
              <div key={q.id} className="text-sm">
                <span className="text-gray-500">{q.label}: </span>
                <span className="text-gray-800">{val}</span>
              </div>
            )
          })
          .filter(Boolean)
        if (rows.length === 0) return null
        return (
          <div key={section.id}>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">{section.title}</p>
            <div className="mt-1 space-y-1.5">{rows}</div>
          </div>
        )
      })}
    </div>
  )
}
