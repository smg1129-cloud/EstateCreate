import bcrypt from 'bcryptjs'
import type { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { db } from '@/lib/db'
import { recordAudit } from '@/lib/audit'

export { idleTimeoutMinutes } from '@/lib/sessionConfig'

export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt',
    maxAge: 60 * 60 * 12, // hard cap: 12 hours regardless of activity
  },
  pages: {
    signIn: '/login',
  },
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) return null

        const user = await db.user.findUnique({ where: { email: credentials.email.toLowerCase() } })

        // Generic failure — don't reveal whether the email or password was
        // wrong, and don't leak account-status distinctions to the client.
        if (!user || user.status !== 'ACTIVE') {
          await recordAudit({
            organizationId: user?.organizationId ?? 'unknown',
            actorId: user?.id ?? 'unknown',
            action: 'LOGIN_FAILED',
            entityType: 'User',
            entityId: user?.id,
          }).catch(() => {})
          return null
        }

        const valid = await bcrypt.compare(credentials.password, user.passwordHash)
        if (!valid) {
          await recordAudit({
            organizationId: user.organizationId,
            actorId: user.id,
            action: 'LOGIN_FAILED',
            entityType: 'User',
            entityId: user.id,
          }).catch(() => {})
          return null
        }

        await db.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } })
        await recordAudit({
          organizationId: user.organizationId,
          actorId: user.id,
          action: 'LOGIN',
          entityType: 'User',
          entityId: user.id,
        }).catch(() => {})

        return {
          id: user.id,
          email: user.email,
          role: user.role,
          organizationId: user.organizationId,
          firstName: user.firstName,
          lastName: user.lastName,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
        token.organizationId = user.organizationId
        token.firstName = user.firstName
        token.lastName = user.lastName
        token.lastActiveAt = Date.now()
      }
      return token
    },
    async session({ session, token }) {
      session.user.id = token.id
      session.user.role = token.role
      session.user.organizationId = token.organizationId
      session.user.firstName = token.firstName
      session.user.lastName = token.lastName
      return session
    },
  },
}
