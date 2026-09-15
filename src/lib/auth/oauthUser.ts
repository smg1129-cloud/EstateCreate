import { db } from '@/lib/db'
import { recordAudit } from '@/lib/audit'
import { isStaff } from '@/lib/rbac'
import { createMatterForClient } from '@/lib/matters/service'

export type OAuthLinkResult =
  | { status: 'ok'; userId: string }
  | { status: 'staff_blocked' }
  | { status: 'inactive' }
  | { status: 'no_org' }

interface OAuthProfile {
  email: string
  name?: string | null
  image?: string | null
  provider: string
}

/**
 * Resolve a social sign-in to one of our users, creating a CLIENT account (and
 * its matter + signup consents) on first use and linking the provider to an
 * existing account on subsequent use. Matching is by verified email — the
 * signIn callback (src/lib/auth.ts) only calls this once it has confirmed the
 * provider asserts a verified email address.
 *
 * Guardrails:
 *  - Social login is CLIENTS only. If the email belongs to a staff account
 *    (attorney/paralegal/admin), refuse — staff must use password + TOTP.
 *  - A suspended/deactivated account is refused.
 *  - New accounts attach to the (single) firm org, mirroring registration.
 */
export async function linkOrCreateOAuthUser(profile: OAuthProfile): Promise<OAuthLinkResult> {
  const email = profile.email.toLowerCase().trim()
  const existing = await db.user.findUnique({ where: { email } })

  if (existing) {
    // Never let a social provider stand in for staff MFA.
    if (isStaff({ id: existing.id, role: existing.role, organizationId: existing.organizationId })) {
      await recordAudit({
        actorId: existing.id,
        action: 'LOGIN_FAILED',
        entityType: 'User',
        entityId: existing.id,
        metadata: { reason: 'oauth_staff_blocked', provider: profile.provider },
      })
      return { status: 'staff_blocked' }
    }
    if (existing.status !== 'ACTIVE') return { status: 'inactive' }

    // Link the provider (dedupe) and backfill an avatar if we don't have one.
    const alreadyLinked = existing.authProviders.includes(profile.provider)
    if (!alreadyLinked || (!existing.image && profile.image)) {
      await db.user.update({
        where: { id: existing.id },
        data: {
          authProviders: alreadyLinked
            ? existing.authProviders
            : { set: [...existing.authProviders, profile.provider] },
          image: existing.image ?? profile.image ?? null,
          lastLoginAt: new Date(),
        },
      })
      if (!alreadyLinked) {
        await recordAudit({
          actorId: existing.id,
          action: 'UPDATE',
          entityType: 'User',
          entityId: existing.id,
          metadata: { linkedProvider: profile.provider },
        })
      }
    } else {
      await db.user.update({ where: { id: existing.id }, data: { lastLoginAt: new Date() } })
    }

    await recordAudit({
      actorId: existing.id,
      action: 'LOGIN',
      entityType: 'User',
      entityId: existing.id,
      metadata: { provider: profile.provider },
    })
    return { status: 'ok', userId: existing.id }
  }

  // First-time social sign-in → provision a client, mirroring /register.
  const org = await db.organization.findFirst({ orderBy: { createdAt: 'asc' } })
  if (!org) return { status: 'no_org' }

  const { firstName, lastName } = splitName(profile.name, email)

  const user = await db.user.create({
    data: {
      organizationId: org.id,
      email,
      passwordHash: null,
      role: 'CLIENT',
      firstName,
      lastName,
      image: profile.image ?? null,
      authProviders: { set: [profile.provider] },
    },
  })

  // Capture signup-time consents, matching the credentials registration flow.
  // Clicking the social button on the login/register page carries the same
  // clickwrap acknowledgment shown there.
  const version = '2026-09-v1'
  await db.consentRecord.createMany({
    data: [
      { userId: user.id, type: 'TERMS_OF_SERVICE', version },
      { userId: user.id, type: 'PRIVACY_NOTICE', version },
      { userId: user.id, type: 'ELECTRONIC_RECORDS_CONSENT', version },
    ],
  })

  await createMatterForClient({ id: user.id, organizationId: org.id })
  await recordAudit({
    actorId: user.id,
    action: 'CREATE',
    entityType: 'User',
    entityId: user.id,
    metadata: { role: 'CLIENT', via: 'oauth', provider: profile.provider },
  })
  await recordAudit({
    actorId: user.id,
    action: 'LOGIN',
    entityType: 'User',
    entityId: user.id,
    metadata: { provider: profile.provider },
  })

  return { status: 'ok', userId: user.id }
}

function splitName(name: string | null | undefined, email: string): { firstName: string; lastName: string } {
  const trimmed = (name ?? '').trim()
  if (trimmed) {
    const parts = trimmed.split(/\s+/)
    if (parts.length === 1) return { firstName: parts[0]!, lastName: '' }
    return { firstName: parts.slice(0, -1).join(' '), lastName: parts[parts.length - 1]! }
  }
  // Fall back to the email local part so the account isn't nameless.
  const local = email.split('@')[0] ?? 'Client'
  return { firstName: local, lastName: '' }
}
