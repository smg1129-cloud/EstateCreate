import { redirect, notFound } from 'next/navigation'
import { getCurrentUser } from '@/lib/session'
import { assertCanAccessMatter } from '@/lib/rbac'
import { getQuestionnaire, type Answers } from '@/lib/questionnaire'
import {
  getActiveMatterForClient,
  getResponse,
  saveQuestionnaire,
  canGenerate,
  generateMatterDocuments,
} from '@/lib/matters/service'
import { QuestionnaireWizard } from '@/components/QuestionnaireWizard'
import type { QuestionnaireKind } from '@prisma/client'

const KIND_MAP: Record<string, QuestionnaireKind> = {
  triage: 'TRIAGE',
  estate: 'ESTATE_INTAKE',
}

export default async function IntakePage({ params }: { params: { kind: string } }) {
  const mapped = KIND_MAP[params.kind]
  if (!mapped) notFound()
  const kind: QuestionnaireKind = mapped

  const actor = await getCurrentUser()
  if (!actor) redirect('/login')
  const matter = await getActiveMatterForClient(actor.id)
  if (!matter) redirect('/portal')

  // The estate intake depends on triage answers (for conditional sections).
  const triageResp = await getResponse(matter.id, 'TRIAGE')
  if (kind === 'ESTATE_INTAKE' && !triageResp?.completedAt) {
    redirect('/portal/intake/triage')
  }

  const questionnaire = getQuestionnaire(kind)
  const thisResp = await getResponse(matter.id, kind)
  const initialAnswers = (thisResp?.answers as Answers) ?? {}
  const externalAnswers = (triageResp?.answers as Answers) ?? {}

  const matterId = matter.id
  const actorId = actor.id
  const orgId = matter.organizationId

  // Persist partial answers as the client moves between sections (no navigation,
  // no document generation — just saves and recomputes progress/completeness).
  async function saveProgress(answers: Answers) {
    'use server'
    await assertCanAccessMatter({ id: actorId, role: 'CLIENT', organizationId: orgId }, matterId)
    await saveQuestionnaire({ matterId, kind, answers, actorId })
    return { ok: true }
  }

  // Final step: save, then advance the flow (triage → estate; estate → generate).
  async function submit(answers: Answers) {
    'use server'
    await assertCanAccessMatter({ id: actorId, role: 'CLIENT', organizationId: orgId }, matterId)
    const { complete } = await saveQuestionnaire({ matterId, kind, answers, actorId })

    if (kind === 'TRIAGE') {
      return { ok: true, nextPath: '/portal/intake/estate' }
    }
    if (complete && (await canGenerate(matterId))) {
      await generateMatterDocuments(matterId, actorId)
      return { ok: true, nextPath: '/portal/documents' }
    }
    return { ok: true, nextPath: '/portal' }
  }

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="text-2xl font-bold text-gray-900">{questionnaire.title}</h1>
      <p className="mt-1 text-sm text-gray-500">
        {kind === 'TRIAGE' ? 'Step 1 of 2' : 'Step 2 of 2'} · Matter {matter.reference}
      </p>
      <div className="mt-6">
        <QuestionnaireWizard
          questionnaire={questionnaire}
          initialAnswers={initialAnswers}
          externalAnswers={externalAnswers}
          saveProgress={saveProgress}
          submit={submit}
          finalLabel={kind === 'TRIAGE' ? 'Continue to estate questionnaire' : 'Submit for preparation & review'}
        />
      </div>
    </div>
  )
}
