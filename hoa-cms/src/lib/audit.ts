import { db } from '@/lib/db'
import type { Prisma } from '@prisma/client'

export type AuditAction =
  | 'LOGIN'
  | 'LOGIN_FAILED'
  | 'LOGOUT'
  | 'VIEW'
  | 'CREATE'
  | 'UPDATE'
  | 'STATUS_TRANSITION'
  | 'DOWNLOAD'

interface AuditEntry {
  organizationId: string
  actorId: string
  action: AuditAction
  entityType: string
  entityId?: string
  ipAddress?: string | null
  userAgent?: string | null
  metadata?: Prisma.InputJsonValue
}

/// Every read or write of privileged/financial data (clients, matters,
/// ledgers, documents, notes) MUST go through this — it is the single
/// place access-control-and-audit obligations to clients are satisfied.
/// Never call db.auditLog directly elsewhere.
export async function recordAudit(entry: AuditEntry): Promise<void> {
  await db.auditLog.create({
    data: {
      organizationId: entry.organizationId,
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

/// Wraps an operation so the audit entry is written even if the caller
/// forgets — call the wrapped function, get the result, and the audit row
/// lands atomically-enough (best-effort: if the audit write itself fails,
/// we log loudly rather than hide the gap).
export async function withAudit<T>(entry: AuditEntry, fn: () => Promise<T>): Promise<T> {
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
