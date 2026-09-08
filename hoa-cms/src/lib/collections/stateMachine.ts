import { db } from '@/lib/db'
import type { CollectionsStatus } from '@prisma/client'

/// Single source of truth for the Collections/Foreclosure pipeline. Every
/// status-changing server action calls assertTransitionAllowed before
/// writing — mirrors src/lib/rbac.ts's "one checked place, never the UI
/// alone" pattern. Role gating (who may perform a given transition) lives
/// in lib/rbac.ts's canTransitionCollectionsStatus; this file only encodes
/// which state-to-state moves are legal at all.
const TRANSITIONS: Record<CollectionsStatus, CollectionsStatus[]> = {
  NEW_REFERRAL: ['DEMAND_LETTER_SENT', 'CLOSED'],
  DEMAND_LETTER_SENT: ['LIEN_RECORDED', 'CLOSED'],
  LIEN_RECORDED: ['REFERRED_TO_SUIT', 'CLOSED'],
  REFERRED_TO_SUIT: ['SUIT_FILED', 'CLOSED'],
  SUIT_FILED: ['ANSWER_PERIOD', 'CLOSED'],
  ANSWER_PERIOD: ['JUDGMENT', 'CLOSED'],
  JUDGMENT: ['SALE_SCHEDULED', 'CLOSED'],
  SALE_SCHEDULED: ['SALE_HELD', 'JUDGMENT', 'CLOSED'],
  SALE_HELD: ['CLOSED'],
  CLOSED: [],
}

export class InvalidTransitionError extends Error {
  constructor(from: CollectionsStatus, to: CollectionsStatus) {
    super(`Cannot transition Collections matter from ${from} to ${to}`)
    this.name = 'InvalidTransitionError'
  }
}

export function assertTransitionAllowed(from: CollectionsStatus, to: CollectionsStatus): void {
  if (!TRANSITIONS[from].includes(to)) throw new InvalidTransitionError(from, to)
}

export function allowedNextStatuses(from: CollectionsStatus): CollectionsStatus[] {
  return TRANSITIONS[from]
}

/// Keeps the generic Matter.status in sync after every Collections status
/// change or bankruptcy-stay update, so the firm-wide matter list can
/// filter across practice areas without knowing Collections-specific
/// states. CLOSED wins over ON_HOLD if both are somehow true at once.
export async function syncMatterStatus(matterId: string): Promise<void> {
  const matter = await db.matter.findUniqueOrThrow({
    where: { id: matterId },
    include: { collectionsDetail: true },
  })
  const detail = matter.collectionsDetail
  if (!detail) return

  const status = detail.status === 'CLOSED' ? 'CLOSED' : detail.bankruptcyStayActive ? 'ON_HOLD' : 'OPEN'

  await db.matter.update({
    where: { id: matterId },
    data: { status, closedDate: status === 'CLOSED' ? new Date() : null },
  })
}
