import type { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { authenticator } from 'otplib'
import { db } from '@/lib/db'
import { decryptField } from '@/lib/encryption'
import { recordAudit } from '@/lib/audit'
import { requiresMfa } from '@/lib/rbac'

// Errors thrown from authorize() surface as `?error=` on the NextAuth error
// callback and as `result.error` from client-side signIn() — the login page
// uses these two specific messages to decide whether to reveal the TOTP
// field, rather than treating every failure as "invalid credentials".
export const MFA_REQUIRED = 'MFA_REQUIRED'
export const MFA_INVALID = 'MFA_INVALID'

export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt',
    // Hard cap regardless of activity. The tighter, role-aware *idle*
    // timeout is enforced separately in middleware.ts.
    maxAge: 60 * 60 * 12,
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
        totpCode: { label: 'Authenticator code', type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const user = await db.user.findUnique({
          where: { email: credentials.email.toLowerCase().trim() },
        })

        // Same generic failure path whether the email doesn't exist or the
        // password is wrong — don't leak which one it was.
        if (!user || user.status !== 'ACTIVE') return null

        const validPassword = await bcrypt.compare(credentials.password, user.passwordHash)
        if (!validPassword) {
          await recordAudit({ actorId: user.id, action: 'LOGIN_FAILED', entityType: 'User', entityId: user.id })
          return null
        }

        const mustHaveMfa = requiresMfa(user.role)
        const requiresMfaSetup = mustHaveMfa && !user.mfaEnabled

        if (mustHaveMfa && user.mfaEnabled) {
          if (!credentials.totpCode) {
            throw new Error(MFA_REQUIRED)
          }
          const secret = user.mfaSecretEnc ? decryptField(user.mfaSecretEnc) : null
          const validCode = secret ? authenticator.check(credentials.totpCode, secret) : false
          if (!validCode) {
            await recordAudit({
              actorId: user.id,
              action: 'LOGIN_FAILED',
              entityType: 'User',
              entityId: user.id,
              metadata: { reason: 'invalid_totp' },
            })
            throw new Error(MFA_INVALID)
          }
        }

        await db.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } })
        await recordAudit({ actorId: user.id, action: 'LOGIN', entityType: 'User', entityId: user.id })

        return {
          id: user.id,
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          role: user.role,
          organizationId: user.organizationId,
          requiresMfaSetup,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.userId = user.id
        token.role = user.role
        token.organizationId = user.organizationId
        token.requiresMfaSetup = user.requiresMfaSetup
        token.lastActivity = Date.now()
      }
      // Set from /mfa/setup once enrollment completes, via unstable_update.
      if (trigger === 'update') {
        token.requiresMfaSetup = false
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.userId
        session.user.role = token.role
        session.user.organizationId = token.organizationId
        session.user.requiresMfaSetup = token.requiresMfaSetup
      }
      return session
    },
  },
}
