import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const db = new PrismaClient()

const DEV_PASSWORD = 'DevPassword!123'

async function main() {
  const org = await db.organization.upsert({
    where: { id: 'seed-org' },
    update: {},
    create: { id: 'seed-org', name: 'Sample Community Association Law Firm' },
  })

  const mainOffice = await db.office.upsert({
    where: { id: 'seed-office-main' },
    update: {},
    create: {
      id: 'seed-office-main',
      organizationId: org.id,
      name: 'Tampa Office',
      addressLine1: '100 Bayshore Blvd',
      city: 'Tampa',
      state: 'FL',
      postalCode: '33602',
    },
  })

  await db.office.upsert({
    where: { id: 'seed-office-orlando' },
    update: {},
    create: {
      id: 'seed-office-orlando',
      organizationId: org.id,
      name: 'Orlando Office',
      addressLine1: '400 Orange Ave',
      city: 'Orlando',
      state: 'FL',
      postalCode: '32801',
    },
  })

  const passwordHash = await bcrypt.hash(DEV_PASSWORD, 12)

  const users = [
    { email: 'admin@firm.test', role: 'ADMIN' as const, firstName: 'Ana', lastName: 'Admin' },
    { email: 'attorney@firm.test', role: 'ATTORNEY' as const, firstName: 'Alex', lastName: 'Attorney', barNumber: '123456' },
    { email: 'paralegal@firm.test', role: 'PARALEGAL' as const, firstName: 'Pat', lastName: 'Paralegal' },
    { email: 'billing@firm.test', role: 'BILLING' as const, firstName: 'Bailey', lastName: 'Billing' },
    { email: 'readonly@firm.test', role: 'READONLY' as const, firstName: 'Ray', lastName: 'Readonly' },
  ]

  for (const u of users) {
    await db.user.upsert({
      where: { email: u.email },
      update: {},
      create: {
        organizationId: org.id,
        officeId: mainOffice.id,
        email: u.email,
        passwordHash,
        role: u.role,
        firstName: u.firstName,
        lastName: u.lastName,
        barNumber: 'barNumber' in u ? u.barNumber : undefined,
      },
    })
  }

  const attorney = await db.user.findUniqueOrThrow({ where: { email: 'attorney@firm.test' } })
  const paralegal = await db.user.findUniqueOrThrow({ where: { email: 'paralegal@firm.test' } })

  // A handful of demo Clients with Collections matters spread across the
  // pipeline, so the app isn't empty on first run. Matter numbers use a
  // SEED- prefix to stay clear of the app's own {year}-{code}-{seq}
  // sequence (see src/lib/numbering.ts).
  const demoClients = [
    { id: 'seed-client-sunset', clientNumber: 'C-00001', name: 'Sunset Palms Condominium Association, Inc.', clientType: 'CONDOMINIUM' as const, city: 'Tampa', county: 'Hillsborough' },
    { id: 'seed-client-lakeview', clientNumber: 'C-00002', name: 'Lakeview Terrace Homeowners Association, Inc.', clientType: 'HOA' as const, city: 'Orlando', county: 'Orange' },
    { id: 'seed-client-harbor', clientNumber: 'C-00003', name: 'Harbor Pointe Cooperative, Inc.', clientType: 'COOPERATIVE' as const, city: 'Tampa', county: 'Hillsborough' },
  ]

  for (const c of demoClients) {
    await db.client.upsert({
      where: { id: c.id },
      update: {},
      create: {
        id: c.id,
        organizationId: org.id,
        clientNumber: c.clientNumber,
        name: c.name,
        clientType: c.clientType,
        officeId: mainOffice.id,
        relationshipAttorneyId: attorney.id,
        addressLine1: '1 Association Way',
        city: c.city,
        state: 'FL',
        postalCode: '33601',
        county: c.county,
      },
    })
  }

  const demoMatters: Array<{
    id: string
    matterNumber: string
    clientId: string
    title: string
    status: 'NEW_REFERRAL' | 'DEMAND_LETTER_SENT' | 'SUIT_FILED' | 'CLOSED'
    unitAddress: string
    ownerFirst: string
    ownerLast: string
    balanceCents: number
    closedReason?: 'PAID_IN_FULL'
  }> = [
    { id: 'seed-matter-1', matterNumber: 'SEED-COLL-0001', clientId: 'seed-client-sunset', title: 'Assessment Collection — Unit 12B', status: 'NEW_REFERRAL', unitAddress: '12B Sunset Palms Dr', ownerFirst: 'Maria', ownerLast: 'Santos', balanceCents: 210000 },
    { id: 'seed-matter-2', matterNumber: 'SEED-COLL-0002', clientId: 'seed-client-lakeview', title: 'Assessment Collection — Lot 45', status: 'DEMAND_LETTER_SENT', unitAddress: '45 Lakeview Terrace', ownerFirst: 'Robert', ownerLast: 'Chen', balanceCents: 345000 },
    { id: 'seed-matter-3', matterNumber: 'SEED-COLL-0003', clientId: 'seed-client-harbor', title: 'Assessment Collection — Unit 7', status: 'SUIT_FILED', unitAddress: '7 Harbor Pointe Cir', ownerFirst: 'Denise', ownerLast: 'Okafor', balanceCents: 890000 },
    { id: 'seed-matter-4', matterNumber: 'SEED-COLL-0004', clientId: 'seed-client-sunset', title: 'Assessment Collection — Unit 3A (paid)', status: 'CLOSED', unitAddress: '3A Sunset Palms Dr', ownerFirst: 'Frank', ownerLast: 'Delgado', balanceCents: 0, closedReason: 'PAID_IN_FULL' },
  ]

  for (const m of demoMatters) {
    const matter = await db.matter.upsert({
      where: { id: m.id },
      update: {},
      create: {
        id: m.id,
        organizationId: org.id,
        matterNumber: m.matterNumber,
        clientId: m.clientId,
        practiceArea: 'COLLECTIONS',
        title: m.title,
        status: m.status === 'CLOSED' ? 'CLOSED' : 'OPEN',
        responsibleAttorneyId: attorney.id,
        assignedParalegalId: paralegal.id,
      },
    })

    await db.collectionsMatterDetail.upsert({
      where: { matterId: matter.id },
      update: {},
      create: {
        matterId: matter.id,
        unitAddressLine1: m.unitAddress,
        unitCity: 'Tampa',
        unitPostalCode: '33601',
        status: m.status,
        currentBalanceCents: m.balanceCents,
        paidInFull: m.closedReason === 'PAID_IN_FULL',
        closedReason: m.closedReason,
        closedAt: m.status === 'CLOSED' ? new Date() : undefined,
        caseNumber: m.status === 'SUIT_FILED' ? '2026-CC-004521' : undefined,
        court: m.status === 'SUIT_FILED' ? 'Hillsborough County Court' : undefined,
        suitFiledDate: m.status === 'SUIT_FILED' ? new Date() : undefined,
      },
    })

    if (m.balanceCents > 0) {
      const detail = await db.collectionsMatterDetail.findUniqueOrThrow({ where: { matterId: matter.id } })
      const existing = await db.ownerLedgerEntry.findFirst({ where: { collectionsMatterDetailId: detail.id } })
      if (!existing) {
        await db.ownerLedgerEntry.create({
          data: {
            collectionsMatterDetailId: detail.id,
            entryType: 'ASSESSMENT',
            amountCents: m.balanceCents,
            description: 'Delinquent assessments',
            createdById: paralegal.id,
          },
        })
      }
    }

    const owner = await db.contact.upsert({
      where: { id: `${m.id}-owner` },
      update: {},
      create: {
        id: `${m.id}-owner`,
        organizationId: org.id,
        contactType: 'UNIT_OWNER',
        firstName: m.ownerFirst,
        lastName: m.ownerLast,
        mailingAddressLine1: m.unitAddress,
        city: 'Tampa',
        state: 'FL',
        postalCode: '33601',
      },
    })
    const existingLink = await db.matterContact.findFirst({ where: { matterId: matter.id, contactId: owner.id } })
    if (!existingLink) {
      await db.matterContact.create({ data: { matterId: matter.id, contactId: owner.id, role: 'Primary Owner' } })
    }
  }

  console.log('Seeded organization, offices, accounts, and demo clients/matters.')
  console.log('Password for all seeded accounts: %s', DEV_PASSWORD)
  for (const u of users) console.log(`  ${u.email} — ${u.role}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
