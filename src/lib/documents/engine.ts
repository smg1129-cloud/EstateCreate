// The engine: turns questionnaire answers into a recommended, generated plan.
// Pure and deterministic (no database, no I/O, no LLM) so it is trivially
// testable and reproducible. The service layer (src/lib/matters) persists the
// result and renders artifacts.

import type { Answers } from '@/lib/questionnaire/types'
import type { DocumentModel, DocumentType, ReviewFlag } from './blocks'
import { buildContext, type IntakeContext } from './context'
import { GENERATORS } from './generators'
import { hashDocument } from './hash'
import { recommendDocuments, type PlanRecommendation } from './rules'

export interface GeneratedDoc {
  type: DocumentType
  model: DocumentModel
  hash: string
}

export interface PlanResult {
  context: IntakeContext
  recommendation: PlanRecommendation
  documents: GeneratedDoc[]
  /** Matter-level flags (issue-spotting) plus any doc-level flags bubbled up. */
  flags: ReviewFlag[]
}

export function generateOne(type: DocumentType, ctx: IntakeContext): GeneratedDoc {
  const model = GENERATORS[type](ctx)
  return { type, model, hash: hashDocument(model) }
}

export function generatePlan(answers: Answers): PlanResult {
  const context = buildContext(answers)
  const recommendation = recommendDocuments(context)
  const documents = recommendation.documentTypes.map((type) => generateOne(type, context))
  const docFlags = documents.flatMap((d) => d.model.flags)
  return {
    context,
    recommendation,
    documents,
    flags: [...recommendation.flags, ...docFlags],
  }
}

export { ENGINE_VERSION } from './generators/shared'
