// Questionnaire type system.
//
// Questionnaires are data, not code: a `Questionnaire` is a plain, serializable
// description of sections and questions that a single dynamic form component
// (src/app/portal/intake) renders. Answers are stored as a flat object keyed by
// question `id` (dotted, e.g. "personal.fullName"). Repeatable "group"
// questions store an array of row objects keyed by the group's field ids.
//
// The document engine's context builder (src/lib/documents/context.ts) reads
// answers by these ids, so the ids are a stable contract — treat renaming one
// like a schema migration.

export type QuestionType =
  | 'short_text'
  | 'long_text'
  | 'email'
  | 'phone'
  | 'date'
  | 'number'
  | 'money'
  | 'boolean' // yes/no
  | 'yesno_explain' // yes/no plus a conditional explanation textarea
  | 'select' // single choice
  | 'multiselect' // many choices
  | 'state' // US state code
  | 'group' // repeatable set of sub-fields -> array of row objects

export interface Option {
  value: string
  label: string
}

/** Show this question only when another question's answer matches. */
export interface VisibleWhen {
  questionId: string
  /** equals any of these values. For boolean/yesno use "true"/"false". */
  equals: string[]
}

export interface Question {
  id: string
  label: string
  /** "Why we ask" helper text, mirrored from the source questionnaire. */
  help?: string
  type: QuestionType
  required?: boolean
  placeholder?: string
  options?: Option[]
  /** For 'group' questions: the columns/fields of each repeatable row. */
  fields?: Question[]
  /** Minimum rows for a group before the section counts as complete. */
  minRows?: number
  visibleWhen?: VisibleWhen
  /** Optional grouping hint for two-column layout on wide screens. */
  half?: boolean
}

export interface Section {
  id: string
  title: string
  description?: string
  questions: Question[]
  /** Show this whole section only when a condition matches. */
  visibleWhen?: VisibleWhen
}

export interface Questionnaire {
  id: string
  kind: 'TRIAGE' | 'ESTATE_INTAKE'
  title: string
  intro?: string
  sections: Section[]
}

// Answer value shapes.
export type YesNoExplain = { value: 'yes' | 'no' | 'unsure'; explain?: string }
export type GroupRows = Array<Record<string, unknown>>
export type AnswerValue = string | number | boolean | string[] | YesNoExplain | GroupRows | null | undefined
export type Answers = Record<string, AnswerValue>

// ---- Small readers used by the context builder and the form -------------

export function str(answers: Answers, id: string, fallback = ''): string {
  const v = answers[id]
  return typeof v === 'string' ? v : fallback
}

export function num(answers: Answers, id: string): number | undefined {
  const v = answers[id]
  if (typeof v === 'number') return v
  if (typeof v === 'string' && v.trim() !== '' && !Number.isNaN(Number(v))) return Number(v)
  return undefined
}

export function bool(answers: Answers, id: string): boolean {
  const v = answers[id]
  if (typeof v === 'boolean') return v
  if (typeof v === 'string') return v === 'true' || v === 'yes'
  return false
}

/** Reads a yes/no(/unsure) answer; treats a bare boolean/string too. */
export function yesNo(answers: Answers, id: string): 'yes' | 'no' | 'unsure' | undefined {
  const v = answers[id]
  if (v && typeof v === 'object' && !Array.isArray(v) && 'value' in v) {
    return (v as YesNoExplain).value
  }
  if (typeof v === 'boolean') return v ? 'yes' : 'no'
  if (v === 'yes' || v === 'no' || v === 'unsure') return v
  return undefined
}

export function explain(answers: Answers, id: string): string | undefined {
  const v = answers[id]
  if (v && typeof v === 'object' && !Array.isArray(v) && 'explain' in v) {
    const e = (v as YesNoExplain).explain
    return e && e.trim() ? e.trim() : undefined
  }
  return undefined
}

export function rows(answers: Answers, id: string): GroupRows {
  const v = answers[id]
  return Array.isArray(v) ? (v as GroupRows) : []
}

export function multi(answers: Answers, id: string): string[] {
  const v = answers[id]
  return Array.isArray(v) ? (v as string[]).filter((x) => typeof x === 'string') : []
}
