import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import type { ActorUser } from '@/lib/rbac'

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
