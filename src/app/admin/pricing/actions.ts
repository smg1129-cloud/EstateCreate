'use server'

import { revalidatePath } from 'next/cache'
import { getCurrentUser } from '@/lib/session'
import { requireRole } from '@/lib/rbac'
import { setDocumentPrice } from '@/lib/billing/service'
import { DOCUMENT_LABELS } from '@/lib/documents/generators'
import type { DocumentType } from '@prisma/client'

export type SavePricesResult = { ok: true; count: number } | { ok: false; error: string }

/** Admin: save the firm's flat fee for every document type. */
export async function savePrices(formData: FormData): Promise<SavePricesResult> {
  const actor = await getCurrentUser()
  if (!actor) return { ok: false, error: 'Not authenticated' }
  requireRole(actor, ['ADMIN'])

  const types = Object.keys(DOCUMENT_LABELS) as DocumentType[]
  let count = 0
  for (const type of types) {
    const raw = formData.get(`price_${type}`)
    const dollars = typeof raw === 'string' ? Number.parseFloat(raw) : NaN
    if (Number.isNaN(dollars) || dollars < 0) continue
    const amountCents = Math.round(dollars * 100)
    const active = formData.get(`active_${type}`) === 'on'
    await setDocumentPrice({
      organizationId: actor.organizationId,
      type,
      amountCents,
      active,
      actorId: actor.id,
    })
    count++
  }

  revalidatePath('/admin/pricing')
  return { ok: true, count }
}
