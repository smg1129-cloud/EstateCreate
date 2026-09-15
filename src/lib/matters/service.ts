// Matter service — the server-side business logic that connects the pure
// document engine to the database, rendered-artifact storage, the audit trail,
// and the e-sign/RON adapter. Server actions and route handlers call these
// functions; they never talk to the engine or Prisma directly for these flows.

import { db } from '@/lib/db'
import { recordAudit } from '@/lib/audit'
import type { Answers } from '@/lib/questionnaire/types'
import {
  getQuestionnaire,
  computeProgress,
  isQuestionnaireComplete,
} from '@/lib/questionnaire'
import { generatePlan, ENGINE_VERSION } from '@/lib/documents/engine'
import { renderDocx } from '@/lib/documents/render/docx'
import { renderPdf } from '@/lib/documents/render/pdf'
import { getStorage, artifactKey } from '@/lib/storage'
import { getEsignAdapter, type ExecutionMethod, type Signer } from '@/lib/esign'
import type { DocumentModel } from '@/lib/documents/blocks'
import type { QuestionnaireKind, DocumentType, Prisma } from '@prisma/client'

// ---- Matter creation ------------------------------------------------------

function matterReference(): string {
  const year = new Date().getFullYear()
  const rand = Math.floor(Math.random() * 1_000_000)
    .toString()
    .padStart(6, '0')
  return `EC-${year}-${rand}`
}

/** Creates the single active matter for a newly registered client. */
export async function createMatterForClient(client: { id: string; organizationId: string }) {
  return db.estateMatter.create({
    data: {
      organizationId: client.organizationId,
      clientId: client.id,
      reference: matterReference(),
      status: 'INTAKE',
    },
  })
}

export async function getActiveMatterForClient(clientId: string) {
  return db.estateMatter.findFirst({
    where: { clientId, status: { not: 'ABANDONED' } },
    orderBy: { createdAt: 'desc' },
  })
}

// ---- Questionnaire persistence -------------------------------------------

/** Merges the latest TRIAGE and ESTATE_INTAKE answers into one object for the
 * engine (which expects triage.* and intake keys together). */
export async function getMergedAnswers(matterId: string): Promise<Answers> {
  const responses = await db.questionnaireResponse.findMany({
    where: { matterId },
    orderBy: { version: 'desc' },
  })
  const merged: Answers = {}
  // Apply oldest-first so the latest version wins per kind.
  const latestByKind = new Map<string, (typeof responses)[number]>()
  for (const r of responses) {
    if (!latestByKind.has(r.kind)) latestByKind.set(r.kind, r)
  }
  for (const r of latestByKind.values()) {
    Object.assign(merged, (r.answers as Answers) ?? {})
  }
  return merged
}

export async function getResponse(matterId: string, kind: QuestionnaireKind) {
  return db.questionnaireResponse.findFirst({
    where: { matterId, kind },
    orderBy: { version: 'desc' },
  })
}

/** Upserts the latest questionnaire response for a matter+kind (edits in place
 * until documents are generated from it). Updates progress + completedAt. */
export async function saveQuestionnaire(params: {
  matterId: string
  kind: QuestionnaireKind
  answers: Answers
  actorId: string
}) {
  const { matterId, kind, answers, actorId } = params
  const q = getQuestionnaire(kind)
  const progress = computeProgress(q, answers)
  const complete = isQuestionnaireComplete(q, answers)

  const existing = await getResponse(matterId, kind)
  const saved = existing
    ? await db.questionnaireResponse.update({
        where: { id: existing.id },
        data: {
          answers: answers as Prisma.InputJsonValue,
          progress: progress as Prisma.InputJsonValue,
          completedAt: complete ? new Date() : null,
        },
      })
    : await db.questionnaireResponse.create({
        data: {
          matterId,
          kind,
          version: 1,
          answers: answers as Prisma.InputJsonValue,
          progress: progress as Prisma.InputJsonValue,
          completedAt: complete ? new Date() : null,
        },
      })

  // Reflect triage plan hint onto the matter as soon as triage is complete.
  if (kind === 'TRIAGE' && complete) {
    await db.estateMatter.update({ where: { id: matterId }, data: { status: 'INTAKE' } })
  }

  await recordAudit({ actorId, action: 'SUBMIT_INTAKE', entityType: 'QuestionnaireResponse', entityId: saved.id, metadata: { kind, complete } })
  return { saved, complete, progress }
}

/** Whether both questionnaires are complete and the plan can be generated. */
export async function canGenerate(matterId: string): Promise<boolean> {
  const triage = await getResponse(matterId, 'TRIAGE')
  const intake = await getResponse(matterId, 'ESTATE_INTAKE')
  return Boolean(triage?.completedAt && intake?.completedAt)
}

// ---- Document generation --------------------------------------------------

async function renderAndStore(matterId: string, documentId: string, model: DocumentModel) {
  const storage = getStorage()
  const [docx, pdf] = await Promise.all([renderDocx(model), renderPdf(model)])
  const docxKey = artifactKey(matterId, documentId, 'docx')
  const pdfKey = artifactKey(matterId, documentId, 'pdf')
  await Promise.all([
    storage.save(docxKey, docx, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'),
    storage.save(pdfKey, pdf, 'application/pdf'),
  ])
  return { docxKey, pdfKey }
}

/**
 * Generates (or regenerates) the full document set for a matter from its
 * current answers. Prior, non-executed versions of each type are superseded so
 * review history is preserved. Newly generated documents enter IN_REVIEW and
 * land in the attorney queue.
 */
export async function generateMatterDocuments(
  matterId: string,
  actorId: string,
  options?: { onlyTypes?: DocumentType[] },
) {
  const answers = await getMergedAnswers(matterId)
  const plan = generatePlan(answers)
  const intake = await getResponse(matterId, 'ESTATE_INTAKE')

  // When a paid quote scopes the set, generate only the document types the
  // client actually paid for (the payment gate). Absent a filter, the full
  // recommended set is generated (e.g. the seed / an admin regeneration).
  const onlyTypes = options?.onlyTypes ? new Set(options.onlyTypes) : null
  const documentsToBuild = onlyTypes
    ? plan.documents.filter((d) => onlyTypes.has(d.type))
    : plan.documents

  // Supersede existing, non-executed documents.
  await db.generatedDocument.updateMany({
    where: { matterId, status: { in: ['DRAFT', 'IN_REVIEW', 'CHANGES_REQUESTED', 'APPROVED', 'REJECTED'] } },
    data: { status: 'SUPERSEDED' },
  })

  const created: string[] = []
  for (const doc of documentsToBuild) {
    const priorMax = await db.generatedDocument.findFirst({
      where: { matterId, type: doc.type },
      orderBy: { version: 'desc' },
      select: { version: true },
    })
    const version = (priorMax?.version ?? 0) + 1

    const row = await db.generatedDocument.create({
      data: {
        matterId,
        type: doc.type,
        version,
        status: 'IN_REVIEW',
        title: doc.model.title,
        contentJson: doc.model as unknown as Prisma.InputJsonValue,
        contentHash: doc.hash,
        engineVersion: ENGINE_VERSION,
        builtFromQuestionnaireId: intake?.id,
      },
    })
    const { docxKey, pdfKey } = await renderAndStore(matterId, row.id, doc.model)
    await db.generatedDocument.update({ where: { id: row.id }, data: { docxKey, pdfKey } })
    // Record submission into the review queue.
    await db.documentReview.create({
      data: { documentId: row.id, reviewerId: actorId, decision: 'SUBMITTED', comment: 'Auto-submitted for attorney review on generation.' },
    })
    created.push(row.id)
  }

  await db.estateMatter.update({
    where: { id: matterId },
    data: {
      status: 'IN_REVIEW',
      planType: plan.recommendation.planType === 'TRUST_BASED' ? 'TRUST_BASED' : 'WILL_BASED',
      recommendedDocTypes: plan.recommendation.documentTypes,
      planSummary: {
        planType: plan.recommendation.planType,
        rationale: plan.recommendation.rationale,
        flags: plan.flags,
      } as unknown as Prisma.InputJsonValue,
    },
  })

  await recordAudit({ actorId, action: 'GENERATE', entityType: 'EstateMatter', entityId: matterId, metadata: { count: created.length, docTypes: plan.recommendation.documentTypes } })
  return { count: created.length, plan }
}

// ---- Attorney review ------------------------------------------------------

export type AttorneyDecision = 'APPROVED' | 'CHANGES_REQUESTED' | 'REJECTED'

export async function recordAttorneyDecision(params: {
  documentId: string
  decision: AttorneyDecision
  comment?: string
  annotations?: { blockRef: string; comment: string }[]
  actorId: string
}) {
  const { documentId, decision, comment, annotations, actorId } = params
  const doc = await db.generatedDocument.findUnique({ where: { id: documentId } })
  if (!doc) throw new Error('Document not found')

  await db.documentReview.create({
    data: {
      documentId,
      reviewerId: actorId,
      decision,
      comment,
      annotations: annotations ? (annotations as unknown as Prisma.InputJsonValue) : undefined,
    },
  })
  await db.generatedDocument.update({ where: { id: documentId }, data: { status: decision } })

  await recordAudit({
    actorId,
    action: decision === 'APPROVED' ? 'APPROVE' : decision === 'REJECTED' ? 'REJECT' : 'REQUEST_CHANGES',
    entityType: 'GeneratedDocument',
    entityId: documentId,
  })

  await rollUpMatterStatus(doc.matterId)
}

/** Sets the matter status from the aggregate state of its current documents. */
export async function rollUpMatterStatus(matterId: string) {
  const docs = await db.generatedDocument.findMany({
    where: { matterId, status: { not: 'SUPERSEDED' } },
    select: { status: true },
  })
  if (docs.length === 0) return
  const anyChanges = docs.some((d) => d.status === 'CHANGES_REQUESTED' || d.status === 'REJECTED')
  const allApprovedOrExecuted = docs.every((d) => d.status === 'APPROVED' || d.status === 'EXECUTED')
  const anyExecuted = docs.some((d) => d.status === 'EXECUTED')
  const allExecuted = docs.every((d) => d.status === 'EXECUTED')

  let status: 'IN_REVIEW' | 'CHANGES_REQUESTED' | 'APPROVED' | 'EXECUTION' | 'COMPLETED' = 'IN_REVIEW'
  if (allExecuted) status = 'COMPLETED'
  else if (anyExecuted) status = 'EXECUTION'
  else if (allApprovedOrExecuted) status = 'APPROVED'
  else if (anyChanges) status = 'CHANGES_REQUESTED'

  await db.estateMatter.update({ where: { id: matterId }, data: { status } })
}

// ---- Execution (e-sign / RON) --------------------------------------------

export async function sendForSignature(params: {
  documentId: string
  method: ExecutionMethod
  actorId: string
}) {
  const { documentId, method, actorId } = params
  const doc = await db.generatedDocument.findUnique({
    where: { id: documentId },
    include: { matter: { include: { client: true } } },
  })
  if (!doc) throw new Error('Document not found')
  // Hard gate: only an APPROVED document may be sent for signature.
  if (doc.status !== 'APPROVED') {
    throw new Error('Only an attorney-approved document can be sent for signature.')
  }

  const model = doc.contentJson as unknown as DocumentModel
  const pdf = await renderPdf(model)
  const adapter = getEsignAdapter()

  const signers: Signer[] = [
    { role: 'PRINCIPAL', name: `${doc.matter.client.firstName} ${doc.matter.client.lastName}`, email: doc.matter.client.email },
  ]
  for (let i = 0; i < model.execution.witnesses; i++) {
    signers.push({ role: 'WITNESS', name: `Witness ${i + 1}` })
  }
  if (model.execution.notaryRequired) {
    signers.push({ role: 'NOTARY', name: 'Notary Public' })
  }

  const session = await adapter.createSignatureRequest({
    documentId,
    title: doc.title,
    method,
    pdf,
    signers,
    requiresNotary: model.execution.notaryRequired,
    requiredWitnesses: model.execution.witnesses,
  })

  const sig = await db.signatureRequest.upsert({
    where: { documentId },
    create: {
      documentId,
      method,
      provider: session.provider,
      externalRef: session.externalRef,
      status: 'SENT',
      signers: signers as unknown as Prisma.InputJsonValue,
    },
    update: {
      method,
      provider: session.provider,
      externalRef: session.externalRef,
      status: 'SENT',
      signers: signers as unknown as Prisma.InputJsonValue,
    },
  })
  await db.signatureEvent.create({ data: { signatureRequestId: sig.id, type: 'SENT', payload: { signingUrl: session.signingUrl } as Prisma.InputJsonValue } })
  await db.estateMatter.update({ where: { id: doc.matterId }, data: { status: 'EXECUTION' } })
  await recordAudit({ actorId, action: 'SEND_FOR_SIGNATURE', entityType: 'GeneratedDocument', entityId: documentId, metadata: { method } })

  return { session }
}

/** Polls the adapter and syncs signature status; marks the document EXECUTED
 * and stores the completed PDF when signing finishes. */
export async function refreshSignatureStatus(documentId: string, actorId: string) {
  const sig = await db.signatureRequest.findUnique({ where: { documentId } })
  if (!sig?.externalRef) return null
  const adapter = getEsignAdapter()
  const result = await adapter.getStatus(sig.externalRef)

  const statusMap: Record<string, 'SENT' | 'IN_PROGRESS' | 'COMPLETED' | 'DECLINED' | 'EXPIRED'> = {
    SENT: 'SENT',
    IN_PROGRESS: 'IN_PROGRESS',
    COMPLETED: 'COMPLETED',
    DECLINED: 'DECLINED',
    EXPIRED: 'EXPIRED',
  }
  await db.signatureRequest.update({
    where: { documentId },
    data: {
      status: statusMap[result.status] ?? 'IN_PROGRESS',
      signers: result.signers as unknown as Prisma.InputJsonValue,
      completedAt: result.status === 'COMPLETED' ? new Date() : null,
    },
  })
  await db.signatureEvent.create({ data: { signatureRequestId: sig.id, type: result.status } })

  if (result.status === 'COMPLETED') {
    const doc = await db.generatedDocument.findUnique({ where: { id: documentId } })
    if (doc && result.completedPdf) {
      const key = artifactKey(doc.matterId, `${documentId}-executed`, 'pdf')
      await getStorage().save(key, result.completedPdf, 'application/pdf')
      await db.generatedDocument.update({ where: { id: documentId }, data: { status: 'EXECUTED', pdfKey: key } })
      await rollUpMatterStatus(doc.matterId)
      await recordAudit({ actorId, action: 'SIGN', entityType: 'GeneratedDocument', entityId: documentId })
    }
  }
  return result
}
