import type { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { authenticator } from 'otplib'
import { db } from '@/lib/db'
import { decryptField } from '@/lib/encryption'
import { recordAudit } from '@/lib/audit'
import { requiresMfa } from '@/lib/rbac'
import { buildOAuthProviders } from '@/lib/oauth/providers'
import { linkOrCreateOAuthUser } from '@/lib/auth/oauthUser'

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
    // Provider/callback errors (e.g. a blocked staff social login) land back
    // on the login page with ?error=<code>, which the page maps to a message.
    error: '/login',
  },
  providers: [
    // Social providers first (only the ones with configured credentials are
    // included). Clients only — the signIn callback refuses staff accounts.
    ...buildOAuthProviders(),
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

        // A social-only client account has no password to compare against.
        // Fail closed rather than throwing on a null hash.
        if (!user.passwordHash) return null

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
    // Gate every sign-in. Credentials are already fully validated in
    // authorize(); here we only vet the OAuth path: require a verified email,
    // then provision/link a CLIENT account. Returning a string redirects to
    // /login?error=<code> (pages.error), which the login page maps to a message.
    async signIn({ account, profile, user }) {
      if (!account || account.provider === 'credentials') return true

      // Google explicitly asserts verification; the others (Apple, Microsoft
      // Entra, Facebook) only return an email once the account owns it.
      const rawProfile = profile as Record<string, unknown> | null
      const email =
        (typeof rawProfile?.email === 'string' && rawProfile.email) ||
        (typeof user?.email === 'string' && user.email) ||
        ''
      if (!email) return '/login?error=oauth_no_email'
      if (account.provider === 'google' && rawProfile?.email_verified === false) {
        return '/login?error=oauth_unverified'
      }

      const result = await linkOrCreateOAuthUser({
        email,
        name: (typeof rawProfile?.name === 'string' ? rawProfile.name : user?.name) ?? null,
        image: user?.image ?? null,
        provider: account.provider,
      })

      switch (result.status) {
        case 'ok':
          return true
        case 'staff_blocked':
          return '/login?error=staff_oauth'
        case 'inactive':
          return '/login?error=account_inactive'
        case 'no_org':
          return '/login?error=oauth_unavailable'
      }
    },
    async jwt({ token, user, account, trigger }) {
      // OAuth sign-in: `user` here is the provider profile, not our DB record,
      // so resolve our user by the (verified) email and hydrate the token from
      // it. Clients only, so requiresMfaSetup is always false.
      if (account && account.provider !== 'credentials' && user?.email) {
        const dbUser = await db.user.findUnique({
          where: { email: user.email.toLowerCase().trim() },
        })
        if (dbUser) {
          token.userId = dbUser.id
          token.role = dbUser.role
          token.organizationId = dbUser.organizationId
          token.requiresMfaSetup = false
          token.lastActivity = Date.now()
        }
        return token
      }
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
