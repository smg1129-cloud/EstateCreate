'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { requireActor } from '@/lib/session'
import { canEditNotes, ForbiddenError } from '@/lib/rbac'
import { withAudit } from '@/lib/audit'

const noteSchema = z.object({
  clientId: z.string().optional(),
  matterId: z.string().optional(),
  category: z.enum(['GENERAL', 'CALL', 'EMAIL', 'COURT_APPEARANCE', 'INTERNAL']),
  body: z.string().min(1),
  redirectPath: z.string().min(1),
})

/// Notes attach to a Client and/or a Matter — at least one is required.
/// Prisma has no native multi-column CHECK, so this is enforced here at
/// the server-action boundary rather than the database.
export async function createNote(formData: FormData) {
  const actor = await requireActor()
  if (!canEditNotes(actor)) throw new ForbiddenError()

  const parsed = noteSchema.parse({
    clientId: formData.get('clientId') || undefined,
    matterId: formData.get('matterId') || undefined,
    category: formData.get('category'),
    body: formData.get('body'),
    redirectPath: formData.get('redirectPath'),
  })

  if (!parsed.clientId && !parsed.matterId) throw new Error('A note must attach to a client or a matter')

  if (parsed.matterId) {
    const matter = await db.matter.findFirst({ where: { id: parsed.matterId, organizationId: actor.organizationId } })
    if (!matter) throw new Error('Matter not found')
  }
  if (parsed.clientId) {
    const client = await db.client.findFirst({ where: { id: parsed.clientId, organizationId: actor.organizationId } })
    if (!client) throw new Error('Client not found')
  }

  await withAudit(
    { organizationId: actor.organizationId, actorId: actor.id, action: 'CREATE', entityType: 'Note' },
    () =>
      db.note.create({
        data: {
          clientId: parsed.clientId,
          matterId: parsed.matterId,
          category: parsed.category,
          body: parsed.body,
          authorId: actor.id,
        },
      })
  )

  revalidatePath(parsed.redirectPath)
}
