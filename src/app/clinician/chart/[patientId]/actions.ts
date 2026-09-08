'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { assertCanAccessPatientChart } from '@/lib/rbac'
import { recordAudit } from '@/lib/audit'

async function requireClinicianForPatient(patientId: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.role !== 'CLINICIAN') throw new Error('Unauthorized')
  await assertCanAccessPatientChart(
    { id: session.user.id, role: session.user.role, organizationId: session.user.organizationId },
    patientId
  )
  const provider = await db.provider.findUniqueOrThrow({ where: { userId: session.user.id } })
  return { session, provider }
}

const noteSchema = z.object({
  patientId: z.string().min(1),
  appointmentId: z.string().optional(),
  subjective: z.string().max(4000).optional(),
  objective: z.string().max(4000).optional(),
  assessment: z.string().max(4000).optional(),
  plan: z.string().max(4000).optional(),
})

export async function addClinicalNote(formData: FormData) {
  const patientId = String(formData.get('patientId'))
  const { session, provider } = await requireClinicianForPatient(patientId)

  const parsed = noteSchema.parse({
    patientId,
    appointmentId: formData.get('appointmentId') || undefined,
    subjective: formData.get('subjective') || undefined,
    objective: formData.get('objective') || undefined,
    assessment: formData.get('assessment') || undefined,
    plan: formData.get('plan') || undefined,
  })

  // Signed immediately on creation for this prototype. A production EHR
  // would support a draft state and a distinct "sign" action, with
  // amendments appended (never edited) after signing — see
  // ClinicalNote.amendmentOf in prisma/schema.prisma.
  const note = await db.clinicalNote.create({
    data: {
      patientId: parsed.patientId,
      providerId: provider.id,
      appointmentId: parsed.appointmentId,
      subjective: parsed.subjective,
      objective: parsed.objective,
      assessment: parsed.assessment,
      plan: parsed.plan,
      signedAt: new Date(),
    },
  })

  await recordAudit({
    actorId: session.user.id,
    action: 'SIGN',
    entityType: 'ClinicalNote',
    entityId: note.id,
    metadata: { patientId },
  })

  revalidatePath(`/clinician/chart/${patientId}`)
}

const medicationSchema = z.object({
  patientId: z.string().min(1),
  name: z.string().min(1).max(200),
  dosage: z.string().max(100).optional(),
  frequency: z.string().max(100).optional(),
})

export async function addMedication(formData: FormData) {
  const patientId = String(formData.get('patientId'))
  const { session } = await requireClinicianForPatient(patientId)
  const parsed = medicationSchema.parse({
    patientId,
    name: formData.get('name'),
    dosage: formData.get('dosage') || undefined,
    frequency: formData.get('frequency') || undefined,
  })

  const med = await db.medication.create({ data: parsed })
  await recordAudit({ actorId: session.user.id, action: 'CREATE', entityType: 'Medication', entityId: med.id })
  revalidatePath(`/clinician/chart/${patientId}`)
}

const allergySchema = z.object({
  patientId: z.string().min(1),
  substance: z.string().min(1).max(200),
  reaction: z.string().max(200).optional(),
  severity: z.string().max(50).optional(),
})

export async function addAllergy(formData: FormData) {
  const patientId = String(formData.get('patientId'))
  const { session } = await requireClinicianForPatient(patientId)
  const parsed = allergySchema.parse({
    patientId,
    substance: formData.get('substance'),
    reaction: formData.get('reaction') || undefined,
    severity: formData.get('severity') || undefined,
  })

  const allergy = await db.allergy.create({ data: parsed })
  await recordAudit({ actorId: session.user.id, action: 'CREATE', entityType: 'Allergy', entityId: allergy.id })
  revalidatePath(`/clinician/chart/${patientId}`)
}

const diagnosisSchema = z.object({
  patientId: z.string().min(1),
  icd10Code: z.string().min(1).max(20),
  description: z.string().min(1).max(300),
})

export async function addDiagnosis(formData: FormData) {
  const patientId = String(formData.get('patientId'))
  const { session } = await requireClinicianForPatient(patientId)
  const parsed = diagnosisSchema.parse({
    patientId,
    icd10Code: formData.get('icd10Code'),
    description: formData.get('description'),
  })

  const diagnosis = await db.diagnosis.create({ data: parsed })
  await recordAudit({ actorId: session.user.id, action: 'CREATE', entityType: 'Diagnosis', entityId: diagnosis.id })
  revalidatePath(`/clinician/chart/${patientId}`)
}
