import type { Role } from '@prisma/client'
import type { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  interface User {
    id: string
    role: Role
    organizationId: string
    requiresMfaSetup: boolean
  }

  interface Session {
    user: DefaultSession['user'] & {
      id: string
      role: Role
      organizationId: string
      requiresMfaSetup: boolean
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    userId: string
    role: Role
    organizationId: string
    requiresMfaSetup: boolean
    lastActivity: number
    // Standard JWT claims — present at runtime on every decoded token but
    // not declared by next-auth's base JWT type. Read in middleware.ts to
    // preserve the absolute session expiry when refreshing lastActivity.
    exp?: number
    iat?: number
  }
}
