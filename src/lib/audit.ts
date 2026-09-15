import { db } from '@/lib/db'
import type { Prisma } from '@prisma/client'

export type AuditAction =
  | 'LOGIN'
  | 'LOGIN_FAILED'
  | 'LOGOUT'
  | 'MFA_ENROLLED'
  | 'VIEW'
  | 'CREATE'
  | 'UPDATE'
  | 'CONSENT'
  | 'SUBMIT_INTAKE'
  | 'GENERATE'
  | 'SUBMIT_REVIEW'
  | 'APPROVE'
  | 'REQUEST_CHANGES'
  | 'REJECT'
  | 'SEND_FOR_SIGNATURE'
  | 'SIGN'
  | 'DOWNLOAD'
  | 'QUOTE'
  | 'PAYMENT'
  | 'REFUND'

interface AuditEntry {
  actorId: string
  action: AuditAction
  entityType: string
  entityId?: string
  ipAddress?: string | null
  userAgent?: string | null
  metadata?: Prisma.InputJsonValue
}

/// Every view or mutation of privileged client information (matters,
/// questionnaire answers, generated documents, reviews, signature events)
/// MUST go through this — it is the single place the append-only audit trail
/// is written, which is both an ethics/records-retention safeguard and the
/// file's best malpractice defense. Never call db.auditLog directly
/// elsewhere, and never let a caught error here silently swallow the
/// underlying action's failure.
export async function recordAudit(entry: AuditEntry): Promise<void> {
  await db.auditLog.create({
    data: {
      actorId: entry.actorId,
      action: entry.action,
      entityType: entry.entityType,
      entityId: entry.entityId,
      ipAddress: entry.ipAddress ?? undefined,
      userAgent: entry.userAgent ?? undefined,
      metadata: entry.metadata,
    },
  })
}

/// Wraps a privileged operation so the audit entry is written even if the
/// caller forgets — call the wrapped function, get the result, and the
/// audit row lands atomically-enough (best-effort: if the audit write
/// itself fails, we log loudly rather than hide the gap).
export async function withAudit<T>(
  entry: AuditEntry,
  fn: () => Promise<T>
): Promise<T> {
  const result = await fn()
  try {
    await recordAudit(entry)
  } catch (err) {
    // An audit-write failure must never look like silence in production —
    // surface it loudly. Swap for a proper alerting hook in prod.
    console.error('AUDIT WRITE FAILED', entry, err)
  }
  return result
}
