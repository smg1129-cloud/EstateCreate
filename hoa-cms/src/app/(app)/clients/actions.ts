'use server'

import { z } from 'zod'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { requireActor } from '@/lib/session'
import { canEditClientsAndMatters, ForbiddenError } from '@/lib/rbac'
import { withAudit } from '@/lib/audit'
import { nextClientNumber } from '@/lib/numbering'

const clientSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  clientType: z.enum(['HOA', 'CONDOMINIUM', 'COOPERATIVE']),
  addressLine1: z.string().optional(),
  addressLine2: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postalCode: z.string().optional(),
  county: z.string().optional(),
  federalEin: z.string().optional(),
})

export async function createClient(formData: FormData) {
  const actor = await requireActor()
  if (!canEditClientsAndMatters(actor)) throw new ForbiddenError()

  const parsed = clientSchema.parse({
    name: formData.get('name'),
    clientType: formData.get('clientType'),
    addressLine1: formData.get('addressLine1') || undefined,
    addressLine2: formData.get('addressLine2') || undefined,
    city: formData.get('city') || undefined,
    state: formData.get('state') || undefined,
    postalCode: formData.get('postalCode') || undefined,
    county: formData.get('county') || undefined,
    federalEin: formData.get('federalEin') || undefined,
  })

  const clientNumber = await nextClientNumber()

  const client = await withAudit(
    { organizationId: actor.organizationId, actorId: actor.id, action: 'CREATE', entityType: 'Client' },
    () =>
      db.client.create({
        data: {
          organizationId: actor.organizationId,
          clientNumber,
          ...parsed,
        },
      })
  )

  redirect(`/clients/${client.id}`)
}

const clientUpdateSchema = clientSchema.extend({
  status: z.enum(['ACTIVE', 'INACTIVE', 'FORMER']),
})

export async function updateClient(clientId: string, formData: FormData) {
  const actor = await requireActor()
  if (!canEditClientsAndMatters(actor)) throw new ForbiddenError()

  const parsed = clientUpdateSchema.parse({
    name: formData.get('name'),
    clientType: formData.get('clientType'),
    status: formData.get('status'),
    addressLine1: formData.get('addressLine1') || undefined,
    addressLine2: formData.get('addressLine2') || undefined,
    city: formData.get('city') || undefined,
    state: formData.get('state') || undefined,
    postalCode: formData.get('postalCode') || undefined,
    county: formData.get('county') || undefined,
    federalEin: formData.get('federalEin') || undefined,
  })

  await withAudit(
    { organizationId: actor.organizationId, actorId: actor.id, action: 'UPDATE', entityType: 'Client', entityId: clientId },
    () =>
      db.client.update({
        where: { id: clientId, organizationId: actor.organizationId },
        data: parsed,
      })
  )

  redirect(`/clients/${clientId}`)
}
