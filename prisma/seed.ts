import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

// Seed passwords are for local development only. Every non-patient role
// must still complete MFA enrollment on first login (see src/lib/auth.ts) —
// these credentials alone are not sufficient to reach staff/clinician/admin
// screens.
const SEED_PASSWORD = 'DevPassword!123'

async function main() {
  const passwordHash = await bcrypt.hash(SEED_PASSWORD, 12)

  const org = await prisma.organization.create({
    data: { name: 'Meridian Health Telehealth Clinic' },
  })

  const admin = await prisma.user.create({
    data: {
      organizationId: org.id,
      email: 'admin@meridianhealth.test',
      passwordHash,
      role: 'ADMIN',
      firstName: 'Ana',
      lastName: 'Ramirez',
    },
  })

  const staff = await prisma.user.create({
    data: {
      organizationId: org.id,
      email: 'staff@meridianhealth.test',
      passwordHash,
      role: 'STAFF',
      firstName: 'Sam',
      lastName: 'Okafor',
    },
  })

  const clinicianUser = await prisma.user.create({
    data: {
      organizationId: org.id,
      email: 'clinician@meridianhealth.test',
      passwordHash,
      role: 'CLINICIAN',
      firstName: 'Dr. Priya',
      lastName: 'Nair',
    },
  })

  const provider = await prisma.provider.create({
    data: {
      userId: clinicianUser.id,
      npi: '1234567890',
      specialties: ['Family Medicine', 'Telehealth Primary Care'],
      bio: 'Board-certified family medicine physician with 10 years of virtual care experience.',
    },
  })

  await prisma.providerLicense.createMany({
    data: [
      {
        providerId: provider.id,
        state: 'CA',
        licenseNumber: 'CA-A123456',
        issuedAt: new Date('2019-01-01'),
        expiresAt: new Date('2027-01-01'),
      },
      {
        providerId: provider.id,
        state: 'TX',
        licenseNumber: 'TX-B654321',
        issuedAt: new Date('2020-06-01'),
        expiresAt: new Date('2026-12-01'),
      },
    ],
  })

  const patientUser = await prisma.user.create({
    data: {
      organizationId: org.id,
      email: 'patient@meridianhealth.test',
      passwordHash,
      role: 'PATIENT',
      firstName: 'Jordan',
      lastName: 'Lee',
      phone: '555-010-1234',
    },
  })

  const patient = await prisma.patient.create({
    data: {
      userId: patientUser.id,
      dateOfBirth: new Date('1990-04-12'),
      addressLine1: '123 Main St',
      city: 'Austin',
      state: 'TX',
      postalCode: '78701',
      emergencyContactName: 'Casey Lee',
      emergencyContactPhone: '555-010-5678',
    },
  })

  await prisma.consentRecord.createMany({
    data: [
      { patientId: patient.id, type: 'PRIVACY_NOTICE', version: '2026-01-v1', ipAddress: '127.0.0.1' },
      { patientId: patient.id, type: 'TELEHEALTH_CONSENT', version: '2026-01-v1', ipAddress: '127.0.0.1' },
      { patientId: patient.id, type: 'TERMS_OF_SERVICE', version: '2026-01-v1', ipAddress: '127.0.0.1' },
    ],
  })

  const appointment = await prisma.appointment.create({
    data: {
      patientId: patient.id,
      providerId: provider.id,
      scheduledAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
      visitType: 'VIDEO',
      status: 'SCHEDULED',
      reasonForVisit: 'Annual wellness check-in',
      stateAtTimeOfVisit: patient.state,
    },
  })

  await prisma.invoice.create({
    data: {
      patientId: patient.id,
      appointmentId: appointment.id,
      amountCents: 12500,
      status: 'OPEN',
    },
  })

  await prisma.lead.create({
    data: {
      organizationId: org.id,
      firstName: 'Taylor',
      lastName: 'Morgan',
      email: 'taylor.morgan@example.test',
      phone: '555-010-9999',
      source: 'website-form',
      status: 'NEW',
      assignedToId: staff.id,
    },
  })

  console.log('Seed complete.')
  console.log('Sign in with any of these (password: %s):', SEED_PASSWORD)
  console.log(' - admin@meridianhealth.test (ADMIN)')
  console.log(' - staff@meridianhealth.test (STAFF)')
  console.log(' - clinician@meridianhealth.test (CLINICIAN)')
  console.log(' - patient@meridianhealth.test (PATIENT)')
  console.log('Staff/clinician/admin accounts must complete MFA enrollment on first login.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
