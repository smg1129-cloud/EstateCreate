import { db } from '@/lib/db'
import type { Role } from '@prisma/client'

export class ForbiddenError extends Error {
  constructor(message = 'Forbidden') {
    super(message)
    this.name = 'ForbiddenError'
  }
}

export interface ActorUser {
  id: string
  role: Role
  organizationId: string
}

/// Route/server-action guard. Throws if the actor's role isn't in the allowed
/// set. This is the primary enforcement point — UI-level hiding of links and
/// buttons is a UX nicety, never the actual access control.
export function requireRole(actor: ActorUser | null, allowed: Role[]): ActorUser {
  if (!actor) throw new ForbiddenError('Not authenticated')
  if (!allowed.includes(actor.role)) throw new ForbiddenError(`Role ${actor.role} not permitted`)
  return actor
}

/// Staff-side roles (everyone except the client).
export function isStaff(actor: ActorUser): boolean {
  return actor.role === 'ATTORNEY' || actor.role === 'PARALEGAL' || actor.role === 'ADMIN'
}

/// A client may only see their own matter; staff in the same organization may
/// see any matter in the org. Attorneys/paralegals work the queue, so we do
/// not require pre-assignment to *view* — but only an ATTORNEY may approve
/// (see canApproveDocuments) and assignment is recorded for accountability.
export async function canAccessMatter(actor: ActorUser, matterId: string): Promise<boolean> {
  const matter = await db.estateMatter.findUnique({
    where: { id: matterId },
    select: { clientId: true, organizationId: true },
  })
  if (!matter) return false

  if (actor.role === 'CLIENT') {
    return matter.clientId === actor.id
  }
  // Staff are scoped to their organization.
  return isStaff(actor) && matter.organizationId === actor.organizationId
}

export async function assertCanAccessMatter(actor: ActorUser, matterId: string): Promise<void> {
  const allowed = await canAccessMatter(actor, matterId)
  if (!allowed) throw new ForbiddenError('Not authorized to access this matter')
}

/// Only a licensed attorney may approve a generated document or send it for
/// signature. Paralegals prepare and can request changes; clients never
/// approve their own documents.
export function canApproveDocuments(actor: ActorUser): boolean {
  return actor.role === 'ATTORNEY'
}

/// Who can work the staff-side review queue at all.
export function canReviewMatters(actor: ActorUser): boolean {
  return actor.role === 'ATTORNEY' || actor.role === 'PARALEGAL' || actor.role === 'ADMIN'
}

export function canAccessAdmin(actor: ActorUser): boolean {
  return actor.role === 'ADMIN'
}

/// Roles that must complete MFA enrollment before reaching any role-specific
/// screen (see src/lib/auth.ts and /mfa/setup). Clients are exempt.
export function requiresMfa(role: Role): boolean {
  return role === 'ATTORNEY' || role === 'PARALEGAL' || role === 'ADMIN'
}

/// Idle-session timeout in minutes for a given role. Staff roles (which can
/// see privileged client information across many matters) get a much shorter
/// window than a client viewing their own file.
export function idleTimeoutMinutesFor(role: Role): number {
  const configured = Number(process.env.SESSION_IDLE_TIMEOUT_MINUTES ?? 15)
  return role === 'CLIENT' ? Math.max(configured, 30) : configured
}

export function roleHomeFor(role: Role): string {
  switch (role) {
    case 'CLIENT':
      return '/portal'
    case 'ATTORNEY':
    case 'PARALEGAL':
      return '/attorney'
    case 'ADMIN':
      return '/admin'
  }
}
