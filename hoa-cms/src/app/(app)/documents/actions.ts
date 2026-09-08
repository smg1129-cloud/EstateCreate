'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { requireActor } from '@/lib/session'
import { canEditDocuments, ForbiddenError } from '@/lib/rbac'
import { withAudit } from '@/lib/audit'
import { getDocumentStorageAdapter } from '@/lib/documentStorage'

const MAX_UPLOAD_BYTES = 25 * 1024 * 1024 // 25MB

const metaSchema = z.object({
  clientId: z.string().optional(),
  matterId: z.string().optional(),
  category: z.enum(['DEMAND_LETTER', 'LIEN', 'PLEADING', 'CORRESPONDENCE', 'LEDGER_EXPORT', 'OTHER']),
  redirectPath: z.string().min(1),
})

export async function uploadDocument(formData: FormData) {
  const actor = await requireActor()
  if (!canEditDocuments(actor)) throw new ForbiddenError()

  const parsed = metaSchema.parse({
    clientId: formData.get('clientId') || undefined,
    matterId: formData.get('matterId') || undefined,
    category: formData.get('category'),
    redirectPath: formData.get('redirectPath'),
  })
  if (!parsed.clientId && !parsed.matterId) throw new Error('A document must attach to a client or a matter')

  const file = formData.get('file')
  if (!(file instanceof File) || file.size === 0) throw new Error('A file is required')
  if (file.size > MAX_UPLOAD_BYTES) throw new Error('File exceeds the 25MB upload limit')

  if (parsed.matterId) {
    const matter = await db.matter.findFirst({ where: { id: parsed.matterId, organizationId: actor.organizationId } })
    if (!matter) throw new Error('Matter not found')
  }
  if (parsed.clientId) {
    const client = await db.client.findFirst({ where: { id: parsed.clientId, organizationId: actor.organizationId } })
    if (!client) throw new Error('Client not found')
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  const adapter = getDocumentStorageAdapter()
  const stored = await adapter.save({ buffer, fileName: file.name, contentType: file.type || 'application/octet-stream' })

  await withAudit(
    { organizationId: actor.organizationId, actorId: actor.id, action: 'CREATE', entityType: 'Document' },
    () =>
      db.document.create({
        data: {
          organizationId: actor.organizationId,
          clientId: parsed.clientId,
          matterId: parsed.matterId,
          category: parsed.category,
          fileName: file.name,
          contentType: file.type || 'application/octet-stream',
          sizeBytes: file.size,
          storageKey: stored.storageKey,
          storageProvider: stored.provider,
          uploadedById: actor.id,
        },
      })
  )

  revalidatePath(parsed.redirectPath)
}
