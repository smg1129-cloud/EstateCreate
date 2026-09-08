import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import type { ActorUser } from '@/lib/rbac'
import { ForbiddenError } from '@/lib/rbac'

/// Server Component / server-action helper: resolves the current session
/// into the shape lib/rbac.ts expects. Returns null if unauthenticated —
/// middleware.ts already blocks unauthenticated requests to protected
/// routes, but server actions (invoked directly, not through page
/// rendering) must check independently.
export async function getCurrentActor(): Promise<ActorUser | null> {
  const session = await getServerSession(authOptions)
  if (!session?.user) return null
  return {
    id: session.user.id,
    role: session.user.role,
    organizationId: session.user.organizationId,
  }
}

export async function requireActor(): Promise<ActorUser> {
  const actor = await getCurrentActor()
  if (!actor) throw new ForbiddenError('Not authenticated')
  return actor
}

export async function getCurrentUser() {
  const session = await getServerSession(authOptions)
  return session?.user ?? null
}
