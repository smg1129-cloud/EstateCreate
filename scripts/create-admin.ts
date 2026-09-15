/*
 * Create (or update) a firm ADMIN login — safely, without a password ever
 * appearing in chat, git, or shell history.
 *
 * The password is read from the ADMIN_PASSWORD environment variable; supply it
 * via a hidden shell prompt so it is never echoed or stored:
 *
 *   read -rsp "New admin password: " ADMIN_PASSWORD; echo
 *   ADMIN_EMAIL="you@yourfirm.com" ADMIN_PASSWORD="$ADMIN_PASSWORD" \
 *     ADMIN_FIRST="First" ADMIN_LAST="Last" npx tsx scripts/create-admin.ts
 *
 * The ADMIN_PASSWORD="$ADMIN_PASSWORD" form puts only the variable name in
 * history, not the value. The script bcrypt-hashes the password (the plaintext
 * is never stored) and creates/updates an ACTIVE ADMIN in the firm's org.
 *
 * ADMIN is a staff role, so on first login the app requires the admin to
 * enroll TOTP MFA at /mfa/setup before reaching any admin screen. This script
 * intentionally does NOT set up MFA — that must be done from the admin's own
 * authenticator, interactively, on first login.
 *
 * Optional env:
 *   ADMIN_ORG   — exact organization name to attach to (default: the first /
 *                 only org). Use when more than one org exists.
 */

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const MIN_PASSWORD_LENGTH = 12

function fail(message: string): never {
  console.error(`\n✖ ${message}\n`)
  process.exit(1)
}

async function main() {
  const email = (process.env.ADMIN_EMAIL ?? '').toLowerCase().trim()
  const password = process.env.ADMIN_PASSWORD ?? ''
  const firstName = (process.env.ADMIN_FIRST ?? '').trim() || 'Admin'
  const lastName = (process.env.ADMIN_LAST ?? '').trim() || 'User'
  const orgName = (process.env.ADMIN_ORG ?? '').trim()

  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    fail('Set ADMIN_EMAIL to a valid email address.')
  }
  if (!password) {
    fail('Set ADMIN_PASSWORD (see the header of this file for the safe prompt).')
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    fail(`ADMIN_PASSWORD must be at least ${MIN_PASSWORD_LENGTH} characters.`)
  }

  // Resolve the organization to attach the admin to.
  const org = orgName
    ? await prisma.organization.findFirst({ where: { name: orgName } })
    : await prisma.organization.findFirst({ orderBy: { createdAt: 'asc' } })
  if (!org) {
    fail(
      orgName
        ? `No organization named "${orgName}" was found.`
        : 'No organization exists yet. Run the seed (or create an organization) first.',
    )
  }

  const passwordHash = await bcrypt.hash(password, 12)
  const existing = await prisma.user.findUnique({ where: { email } })

  if (existing) {
    if (existing.role !== 'ADMIN') {
      fail(`A user with ${email} already exists with role ${existing.role}; refusing to change their role. Use a different email.`)
    }
    await prisma.user.update({
      where: { id: existing.id },
      data: { passwordHash, status: 'ACTIVE', firstName, lastName, organizationId: org.id },
    })
    console.log(`\n✔ Updated existing ADMIN password for ${email}.`)
  } else {
    await prisma.user.create({
      data: {
        organizationId: org.id,
        email,
        passwordHash,
        role: 'ADMIN',
        status: 'ACTIVE',
        firstName,
        lastName,
      },
    })
    console.log(`\n✔ Created ADMIN ${email} in "${org.name}".`)
  }

  console.log('  Next: sign in at /login, then enroll your authenticator at /mfa/setup.')
  console.log('  (MFA is required for staff before any admin screen loads.)\n')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
