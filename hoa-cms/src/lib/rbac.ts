import type { CollectionsStatus, Role } from '@prisma/client'

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
/// links/buttons is a UX nicety, never the actual access control. Every
/// server action in this app re-checks here; nothing trusts the caller.
export function requireRole(actor: ActorUser | null, allowed: Role[]): ActorUser {
  if (!actor) throw new ForbiddenError('Not authenticated')
  if (!allowed.includes(actor.role)) throw new ForbiddenError(`Role ${actor.role} not permitted`)
  return actor
}

/// Every tenant-scoped query must be filtered by organizationId — this
/// throws early if a caller forgot to check the actor is authenticated
/// before building a query with their organizationId.
export function requireOrg(actor: ActorUser | null): string {
  if (!actor) throw new ForbiddenError('Not authenticated')
  return actor.organizationId
}

const EDIT_ROLES: Role[] = ['ADMIN', 'ATTORNEY', 'PARALEGAL']
const VIEW_ONLY_ROLES: Role[] = ['BILLING', 'READONLY']

// Client / Matter core fields — CRUD for Admin/Attorney/Paralegal, view only
// for Billing/Readonly.
export function canEditClientsAndMatters(actor: ActorUser): boolean {
  return EDIT_ROLES.includes(actor.role)
}
export function canViewClientsAndMatters(actor: ActorUser): boolean {
  return EDIT_ROLES.includes(actor.role) || VIEW_ONLY_ROLES.includes(actor.role)
}

// Owner ledger (what the delinquent owner owes the Association) — Billing
// gets full CRUD here despite being view-only on Client/Matter core fields,
// since ledger work IS their job. Readonly has no access at all.
export function canEditOwnerLedger(actor: ActorUser): boolean {
  return actor.role === 'ADMIN' || actor.role === 'ATTORNEY' || actor.role === 'PARALEGAL' || actor.role === 'BILLING'
}
export function canViewOwnerLedger(actor: ActorUser): boolean {
  return canEditOwnerLedger(actor)
}

// Firm ledger (what the firm bills the Client) — Billing can CRUD, Paralegal
// can view but not edit (billing/collection decisions aren't theirs to make).
export function canEditFirmLedger(actor: ActorUser): boolean {
  return actor.role === 'ADMIN' || actor.role === 'ATTORNEY' || actor.role === 'BILLING'
}
export function canViewFirmLedger(actor: ActorUser): boolean {
  return canEditFirmLedger(actor) || actor.role === 'PARALEGAL'
}

// Notes — privileged/strategy content. Billing has zero access (not just
// read-only) since notes may contain case strategy irrelevant to billing
// and outside their need-to-know. Readonly can view but not write.
export function canEditNotes(actor: ActorUser): boolean {
  return EDIT_ROLES.includes(actor.role)
}
export function canViewNotes(actor: ActorUser): boolean {
  return EDIT_ROLES.includes(actor.role) || actor.role === 'READONLY'
}

// Documents — same shape as Notes, except Readonly may see metadata but
// must never be able to download file contents.
export function canEditDocuments(actor: ActorUser): boolean {
  return EDIT_ROLES.includes(actor.role)
}
export function canViewDocumentMetadata(actor: ActorUser): boolean {
  return EDIT_ROLES.includes(actor.role) || actor.role === 'READONLY'
}
export function canDownloadDocuments(actor: ActorUser): boolean {
  return EDIT_ROLES.includes(actor.role)
}

// Deadlines — Billing has no access (not their workflow); everyone else can
// at least view, Admin/Attorney/Paralegal can edit.
export function canEditDeadlines(actor: ActorUser): boolean {
  return EDIT_ROLES.includes(actor.role)
}
export function canViewDeadlines(actor: ActorUser): boolean {
  return EDIT_ROLES.includes(actor.role) || actor.role === 'READONLY'
}

// Contacts — Billing can view (needs to know who to bill/contact) but not
// edit; Readonly view only.
export function canEditContacts(actor: ActorUser): boolean {
  return EDIT_ROLES.includes(actor.role)
}
export function canViewContacts(actor: ActorUser): boolean {
  return EDIT_ROLES.includes(actor.role) || VIEW_ONLY_ROLES.includes(actor.role)
}

// Certified mail records — same shape as Documents.
export function canEditCertifiedMail(actor: ActorUser): boolean {
  return EDIT_ROLES.includes(actor.role)
}
export function canViewCertifiedMail(actor: ActorUser): boolean {
  return EDIT_ROLES.includes(actor.role) || actor.role === 'READONLY'
}

export function canManageUsers(actor: ActorUser): boolean {
  return actor.role === 'ADMIN'
}
export function canViewAuditLog(actor: ActorUser): boolean {
  return actor.role === 'ADMIN'
}

/// Collections/Foreclosure pipeline transition gate. Paralegal+ can perform
/// every transition EXCEPT one that lands on CLOSED — final closure of a
/// collections matter is an Attorney/Admin call. See
/// src/lib/collections/stateMachine.ts for the transition graph itself.
export function canTransitionCollectionsStatus(actor: ActorUser, to: CollectionsStatus): boolean {
  if (to === 'CLOSED') return actor.role === 'ADMIN' || actor.role === 'ATTORNEY'
  return actor.role === 'ADMIN' || actor.role === 'ATTORNEY' || actor.role === 'PARALEGAL'
}
