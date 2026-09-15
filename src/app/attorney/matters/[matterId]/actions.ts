'use server'

import { revalidatePath } from 'next/cache'
import { getCurrentUser } from '@/lib/session'
import { assertCanAccessMatter, requireRole } from '@/lib/rbac'
import { refundMatterPayment } from '@/lib/billing/service'

export type RefundResult = { ok: true; amountCents: number } | { ok: false; error: string }

/** Attorney/admin: refund a matter's captured payment (e.g. the firm cannot
 * serve the client, or the plan was rejected). */
export async function refundPayment(matterId: string, reason: string): Promise<RefundResult> {
  const actor = await getCurrentUser()
  if (!actor) return { ok: false, error: 'Not authenticated' }
  requireRole(actor, ['ATTORNEY', 'ADMIN'])
  await assertCanAccessMatter(actor, matterId)

  try {
    const { amountCents } = await refundMatterPayment({
      matterId,
      actorId: actor.id,
      reason: reason.trim() || 'Refund issued by firm.',
    })
    revalidatePath(`/attorney/matters/${matterId}`)
    return { ok: true, amountCents }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Refund failed' }
  }
}
