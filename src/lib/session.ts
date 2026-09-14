import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import type { ActorUser } from '@/lib/rbac'
import { db } from '@/lib/db'

/// Server-side helper for route handlers / server components. Returns null
/// if not authenticated — callers must handle that (usually via
/// requireRole from lib/rbac, or middleware already having redirected).
export async function getCurrentUser(): Promise<ActorUser | null> {
  const session = await getServerSession(authOptions)
  if (!session?.user) return null
  return {
    id: session.user.id,
    role: session.user.role,
    organizationId: session.user.organizationId,
  }
}

/// Convenience for UI that needs the actor plus their display name.
export async function getCurrentUserRecord() {
  const actor = await getCurrentUser()
  if (!actor) return null
  const user = await db.user.findUnique({
    where: { id: actor.id },
    select: { id: true, firstName: true, lastName: true, email: true, role: true, organizationId: true },
  })
  return user
}
