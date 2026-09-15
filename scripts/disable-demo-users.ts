/*
 * Deactivate the seed/demo accounts (…@estatecreate.test) shipped by the seed.
 * They share a publicly-known password and must never remain enabled on a live
 * site. This sets their status to DEACTIVATED (login is refused for any
 * non-ACTIVE user) without deleting them, so audit history and any linked
 * matters stay intact.
 *
 * Run once after you have created a real ADMIN (scripts/create-admin.ts):
 *   npx tsx scripts/disable-demo-users.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const DEMO_EMAILS = [
  'admin@estatecreate.test',
  'attorney@estatecreate.test',
  'paralegal@estatecreate.test',
  'client@estatecreate.test',
]

async function main() {
  const activeAdmins = await prisma.user.count({
    where: { role: 'ADMIN', status: 'ACTIVE', email: { notIn: DEMO_EMAILS } },
  })
  if (activeAdmins === 0) {
    console.error(
      '\n✖ Refusing to run: no ACTIVE non-demo ADMIN exists yet.\n' +
        '  Create your real admin first (scripts/create-admin.ts), or you will lock yourself out.\n',
    )
    process.exit(1)
  }

  const result = await prisma.user.updateMany({
    where: { email: { in: DEMO_EMAILS }, status: { not: 'DEACTIVATED' } },
    data: { status: 'DEACTIVATED' },
  })
  console.log(`\n✔ Deactivated ${result.count} demo account(s). Their known-password logins are now refused.\n`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
