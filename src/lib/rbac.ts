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

/// Route/server-action guard. Throws if the actor's role isn't in the
/// allowed set. This is the primary enforcement point — UI-level hiding of
/// links/buttons is a UX nicety, never the actual access control.
export function requireRole(actor: ActorUser | null, allowed: Role[]): ActorUser {
  if (!actor) throw new ForbiddenError('Not authenticated')
  if (!allowed.includes(actor.role)) throw new ForbiddenError(`Role ${actor.role} not permitted`)
  return actor
}

/// "Minimum necessary" scoping for clinical (ERM) data: a CLINICIAN may
/// access a patient's chart only if they have (or have had) an appointment
/// with that patient. A PATIENT may only access their own chart. STAFF
/// cannot access clinical content at all — CRM access is separate (see
/// canAccessCrm). ADMIN can manage users/licenses/audit logs but is
/// intentionally NOT granted blanket clinical-record access.
export async function canAccessPatientChart(
  actor: ActorUser,
  patientId: string
): Promise<boolean> {
  if (actor.role === 'PATIENT') {
    const patient = await db.patient.findUnique({ where: { id: patientId }, select: { userId: true } })
    return patient?.userId === actor.id
  }

  if (actor.role === 'CLINICIAN') {
    const provider = await db.provider.findUnique({ where: { userId: actor.id }, select: { id: true } })
    if (!provider) return false
    const hasRelationship = await db.appointment.findFirst({
      where: { providerId: provider.id, patientId },
      select: { id: true },
    })
    return Boolean(hasRelationship)
  }

  return false
}

export async function assertCanAccessPatientChart(actor: ActorUser, patientId: string): Promise<void> {
  const allowed = await canAccessPatientChart(actor, patientId)
  if (!allowed) throw new ForbiddenError('Not authorized to view this patient chart')
}

/// CRM access (leads, communications, non-clinical patient directory
/// fields): STAFF and ADMIN within the same organization. Clinicians use
/// the ERM, not the CRM, for patient-facing work.
export function canAccessCrm(actor: ActorUser): boolean {
  return actor.role === 'STAFF' || actor.role === 'ADMIN'
}

export function canAccessAdmin(actor: ActorUser): boolean {
  return actor.role === 'ADMIN'
}

/// Roles that must complete MFA enrollment before reaching any
/// role-specific screen (see src/lib/auth.ts and /mfa/setup).
export function requiresMfa(role: Role): boolean {
  return role === 'STAFF' || role === 'CLINICIAN' || role === 'ADMIN'
}

/// Idle-session timeout in minutes for a given role. Clinical/admin roles
/// get a much shorter window than patients — a shared/shared-adjacent
/// workstation is a realistic threat model for clinic staff.
export function idleTimeoutMinutesFor(role: Role): number {
  const configured = Number(process.env.SESSION_IDLE_TIMEOUT_MINUTES ?? 15)
  return role === 'PATIENT' ? Math.max(configured, 30) : configured
}
