'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { assertCanAccessPatientChart } from '@/lib/rbac'
import { recordAudit } from '@/lib/audit'
import { getPrescribingProvider } from '@/lib/prescribing'

const prescriptionSchema = z.object({
  patientId: z.string().min(1),
  medicationName: z.string().min(1).max(200),
  dosage: z.string().min(1).max(100),
  quantity: z.string().min(1).max(50),
  directions: z.string().min(1).max(500),
  isControlled: z.string().optional(),
})

export async function createPrescription(formData: FormData) {
  const patientId = String(formData.get('patientId'))
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.role !== 'CLINICIAN') throw new Error('Unauthorized')
  await assertCanAccessPatientChart(
    { id: session.user.id, role: session.user.role, organizationId: session.user.organizationId },
    patientId
  )
  const provider = await db.provider.findUniqueOrThrow({ where: { userId: session.user.id } })

  const parsed = prescriptionSchema.parse({
    patientId,
    medicationName: formData.get('medicationName'),
    dosage: formData.get('dosage'),
    quantity: formData.get('quantity'),
    directions: formData.get('directions'),
    isControlled: formData.get('isControlled') || undefined,
  })
  const isControlled = parsed.isControlled === 'on'

  // Draft row first, then attempt to send via the configured (mock, for
  // now) e-prescribing adapter — mirrors how a real integration would work
  // so swapping in a certified vendor later is a one-file change.
  const prescription = await db.prescription.create({
    data: {
      patientId: parsed.patientId,
      providerId: provider.id,
      medicationName: parsed.medicationName,
      dosage: parsed.dosage,
      quantity: parsed.quantity,
      directions: parsed.directions,
      isControlled,
      status: 'DRAFT',
    },
  })

  const adapter = getPrescribingProvider()
  const result = await adapter.send({
    patientId: parsed.patientId,
    providerId: provider.id,
    medicationName: parsed.medicationName,
    dosage: parsed.dosage,
    quantity: parsed.quantity,
    directions: parsed.directions,
    isControlled,
  })

  await db.prescription.update({
    where: { id: prescription.id },
    data: { status: result.status, externalVendorRef: result.externalVendorRef },
  })

  await recordAudit({
    actorId: session.user.id,
    action: 'CREATE',
    entityType: 'Prescription',
    entityId: prescription.id,
    metadata: { isControlled, vendorStatus: result.status },
  })

  revalidatePath(`/clinician/chart/${patientId}`)
}
