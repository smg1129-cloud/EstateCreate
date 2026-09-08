'use server'

import { z } from 'zod'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { requireActor } from '@/lib/session'
import { canEditDeadlines, ForbiddenError } from '@/lib/rbac'
import { withAudit } from '@/lib/audit'
import { parseLocalDate } from '@/lib/dates'

const createSchema = z.object({
  matterId: z.string().min(1),
  title: z.string().min(1),
  type: z.enum(['STATUTE_OF_LIMITATIONS', 'HEARING', 'FILING', 'FOLLOW_UP', 'OTHER']),
  dueDate: z.string().min(1),
  assignedToId: z.string().min(1),
  notes: z.string().optional(),
})

export async function createDeadline(formData: FormData) {
  const actor = await requireActor()
  if (!canEditDeadlines(actor)) throw new ForbiddenError()

  const parsed = createSchema.parse({
    matterId: formData.get('matterId'),
    title: formData.get('title'),
    type: formData.get('type'),
    dueDate: formData.get('dueDate'),
    assignedToId: formData.get('assignedToId'),
    notes: formData.get('notes') || undefined,
  })

  const matter = await db.matter.findFirst({ where: { id: parsed.matterId, organizationId: actor.organizationId } })
  if (!matter) throw new Error('Matter not found')

  await withAudit(
    { organizationId: actor.organizationId, actorId: actor.id, action: 'CREATE', entityType: 'Deadline' },
    () =>
      db.deadline.create({
        data: {
          matterId: parsed.matterId,
          title: parsed.title,
          type: parsed.type,
          dueDate: parseLocalDate(parsed.dueDate),
          assignedToId: parsed.assignedToId,
          notes: parsed.notes,
        },
      })
  )

  redirect(`/matters/collections/${parsed.matterId}?tab=deadlines`)
}

export async function completeDeadline(matterId: string, deadlineId: string) {
  const actor = await requireActor()
  if (!canEditDeadlines(actor)) throw new ForbiddenError()

  const deadline = await db.deadline.findFirst({
    where: { id: deadlineId, matter: { organizationId: actor.organizationId } },
  })
  if (!deadline) throw new Error('Deadline not found')

  await withAudit(
    { organizationId: actor.organizationId, actorId: actor.id, action: 'UPDATE', entityType: 'Deadline', entityId: deadlineId },
    () =>
      db.deadline.update({
        where: { id: deadlineId },
        data: { status: 'COMPLETED', completedAt: new Date() },
      })
  )

  redirect(matterId ? `/matters/collections/${matterId}?tab=deadlines` : '/deadlines')
}
