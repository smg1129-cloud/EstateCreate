import type { Answers, Question, Questionnaire, Section, VisibleWhen } from './types'
import { triageQuestionnaire } from './triage'
import { intakeQuestionnaire } from './intake'

export * from './types'
export { triageQuestionnaire } from './triage'
export { intakeQuestionnaire } from './intake'

export function getQuestionnaire(kind: 'TRIAGE' | 'ESTATE_INTAKE'): Questionnaire {
  return kind === 'TRIAGE' ? triageQuestionnaire : intakeQuestionnaire
}

/** Normalizes an answer to the string form used by visibleWhen.equals. */
function answerAsConditionValue(value: unknown): string[] {
  if (value == null) return []
  if (typeof value === 'boolean') return [value ? 'true' : 'false']
  if (typeof value === 'number') return [String(value)]
  if (typeof value === 'string') return [value]
  if (Array.isArray(value)) return value.map((v) => String(v))
  if (typeof value === 'object' && 'value' in (value as Record<string, unknown>)) {
    return [String((value as Record<string, unknown>).value)]
  }
  return []
}

function conditionMet(cond: VisibleWhen, answers: Answers): boolean {
  const actual = answerAsConditionValue(answers[cond.questionId])
  return actual.some((a) => cond.equals.includes(a))
}

export function isQuestionVisible(question: Question, answers: Answers): boolean {
  return question.visibleWhen ? conditionMet(question.visibleWhen, answers) : true
}

export function isSectionVisible(section: Section, answers: Answers): boolean {
  return section.visibleWhen ? conditionMet(section.visibleWhen, answers) : true
}

function isAnswered(question: Question, answers: Answers): boolean {
  const v = answers[question.id]
  if (v == null) return false
  if (typeof v === 'string') return v.trim() !== ''
  if (Array.isArray(v)) {
    if (question.type === 'group') return v.length >= (question.minRows ?? 1)
    return v.length > 0
  }
  if (typeof v === 'object' && 'value' in (v as Record<string, unknown>)) {
    return Boolean((v as Record<string, unknown>).value)
  }
  return true // numbers, booleans
}

/** Required, currently-visible questions that are still blank in a section. */
export function missingRequired(section: Section, answers: Answers): Question[] {
  if (!isSectionVisible(section, answers)) return []
  return section.questions.filter(
    (q) => q.required && isQuestionVisible(q, answers) && !isAnswered(q, answers)
  )
}

/** Whether a section counts as complete (all visible required questions filled). */
export function isSectionComplete(section: Section, answers: Answers): boolean {
  return missingRequired(section, answers).length === 0
}

/** Sections that are currently visible for these answers. */
export function visibleSections(questionnaire: Questionnaire, answers: Answers): Section[] {
  return questionnaire.sections.filter((s) => isSectionVisible(s, answers))
}

/** Whole-questionnaire completeness: every visible section complete. */
export function isQuestionnaireComplete(questionnaire: Questionnaire, answers: Answers): boolean {
  return visibleSections(questionnaire, answers).every((s) => isSectionComplete(s, answers))
}

/** Progress map { [sectionId]: complete } used by the portal UI. */
export function computeProgress(questionnaire: Questionnaire, answers: Answers): Record<string, boolean> {
  const out: Record<string, boolean> = {}
  for (const s of visibleSections(questionnaire, answers)) {
    out[s.id] = isSectionComplete(s, answers)
  }
  return out
}
