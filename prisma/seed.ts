import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import type { Answers } from '@/lib/questionnaire/types'
import { generateMatterDocuments } from '@/lib/matters/service'
import { computeProgress } from '@/lib/questionnaire'
import { getQuestionnaire } from '@/lib/questionnaire'

const prisma = new PrismaClient()

// Seed passwords are for local development only. Every staff role must still
// complete MFA enrollment on first login (see src/lib/auth.ts) — these
// credentials alone are not sufficient to reach staff/admin screens.
const SEED_PASSWORD = 'DevPassword!123'

// A realistic, complete intake for a married client with minor children who
// owns out-of-state property and wants privacy — which the rules engine turns
// into a trust-based plan (RLT + pour-over) plus the full incapacity package.
const TRIAGE_ANSWERS: Answers = {
  'triage.reason': 'life_event',
  'triage.primaryGoal': 'avoid_probate',
  'triage.maritalStatus': 'married',
  'triage.hasMinorChildren': true,
  'triage.ownsRealEstate': true,
  'triage.ownsOutOfStateRealEstate': true,
  'triage.ownsBusiness': false,
  'triage.netWorth': '500k_2m',
  'triage.specialNeedsBeneficiary': false,
  'triage.wantsIncapacityDocs': true,
  'triage.privacyImportant': true,
}

const INTAKE_ANSWERS: Answers = {
  'personal.fullName': 'Sarah Michelle Carter',
  'personal.otherNames': 'Sarah Ellis (maiden)',
  'personal.dob': '1986-04-12',
  'personal.addressLine1': '1420 Riverside Avenue',
  'personal.city': 'Jacksonville',
  'personal.county': 'Duval',
  'personal.state': 'FL',
  'personal.postalCode': '32204',
  'personal.gender': 'she',
  'personal.isUSCitizen': true,
  'personal.floridaDomicile': true,
  'personal.govBenefits': { value: 'no' },

  'spouse.fullName': 'John Alan Carter',
  'spouse.dob': '1984-09-30',
  'spouse.isUSCitizen': true,
  'spouse.isMarried': true,
  'spouse.prenup': { value: 'no' },
  'spouse.hasOwnChildren': { value: 'no' },
  'spouse.leaveEverythingToSpouse': true,

  'prior.hadPriorMarriage': { value: 'no' },

  'family.children': [
    { fullName: 'Emma Grace Carter', dob: '2016-06-01', relationship: 'biological', isMinor: true, deceased: false, specialNeeds: false },
    { fullName: 'Liam John Carter', dob: '2020-02-14', relationship: 'biological', isMinor: true, deceased: false, specialNeeds: false },
  ],
  'family.treatEqually': { value: 'yes' },
  'family.afterbornIntent': true,
  'family.disinherit': { value: 'no' },
  'family.deceasedChildShare': 'per_stirpes',

  'assets.homeOwn': true,
  'assets.homeAddress': '1420 Riverside Avenue, Jacksonville, FL 32204',
  'assets.homeTitle': 'joint_spouse',
  'assets.homestead': true,
  'assets.realEstate': [{ description: 'Mountain cabin', state: 'NC', title: 'Joint with spouse', value: '260000' }],
  'assets.accounts': [
    { institution: 'First Coast Bank', type: 'checking', value: '85000', beneficiary: '' },
    { institution: 'Vanguard', type: 'brokerage', value: '340000', beneficiary: '' },
    { institution: 'Fidelity', type: 'retirement', value: '210000', beneficiary: 'Spouse (primary)' },
  ],
  'assets.lifeInsurance': [{ company: 'Northwestern Mutual', deathBenefit: '500000', beneficiary: 'John Alan Carter' }],
  'assets.ownsBusiness': { value: 'no' },
  'assets.digitalAssets': { value: 'no' },
  'assets.firearms': { value: 'no' },

  'gifts.specific': [
    { description: '$10,000', recipient: 'First Baptist Church of Jacksonville', recipientType: 'charity', ifPredeceased: 'lapse' },
  ],
  'gifts.personalPropertyMemo': true,

  'dist.narrative':
    'Everything to my husband if he survives me. If he does not, everything in trust for our children until they are older.',
  'dist.residuary': [{ name: 'John Alan Carter', relationship: 'spouse', sharePercent: '100', ifPredeceased: 'per_stirpes' }],
  'dist.ultimateBackstop': 'My then-living descendants, and if none, the American Red Cross.',
  'dist.howReceived': 'staggered',
  'dist.stagedAges': '25, 30, 35',
  'dist.minorPotTrust': 'pot',
  'dist.trusteeStandard': 'hems',
  'dist.divorceProtection': true,
  'dist.remainderPOA': 'bloodline',
  'dist.trustProtector': true,

  'fid.personalRep': [
    { fullName: 'John Alan Carter', relationship: 'spouse', city: 'Jacksonville', state: 'FL' },
    { fullName: 'Margaret Ellis', relationship: 'sister', city: 'Tampa', state: 'FL' },
  ],
  'fid.trustee': [
    { fullName: 'John Alan Carter', relationship: 'spouse', city: 'Jacksonville', state: 'FL', isUSCitizen: true },
    { fullName: 'Margaret Ellis', relationship: 'sister', city: 'Tampa', state: 'FL', isUSCitizen: true },
  ],
  'fid.trustProtectorName': 'Margaret Ellis; then First Coast Trust Company',
  'fid.poaAgent': [{ fullName: 'John Alan Carter', relationship: 'spouse', city: 'Jacksonville', state: 'FL' }],
  'fid.surrogate': [{ fullName: 'John Alan Carter', relationship: 'spouse', phone: '904-555-0101' }],
  'fid.guardian': [{ fullName: 'Margaret Ellis', relationship: 'sister', city: 'Tampa', state: 'FL' }],
  'fid.excluded': { value: 'no' },
  'fid.bondWaived': true,

  'minors.guardianMoneySamePerson': 'different',
  'minors.educationOffTop': 'off_top',
  'minors.wishes': 'Raise them near their cousins and support their education through college.',

  'poa.gifting': true,
  'poa.realEstate': true,
  'poa.beneficiaryChanges': false,
  'poa.trustPowers': true,
  'poa.medicaidPlanning': true,
  'poa.digital': true,

  'health.surrogateNow': 'only_incapacity',
  'health.lifeProlonging': 'withhold',
  'health.artificialNutrition': true,
  'health.comfortCare': true,
  'health.organDonation': 'yes_any',
  'health.hipaaRelease': 'John Alan Carter (husband)\nMargaret Ellis (sister)',
  'health.wishes': 'I would like to be at home if possible.',

  'health.specificTreatments': 'I would accept short-term intubation if recovery is likely, but not indefinite mechanical ventilation.',
  'health.dementiaWishes': 'If I no longer recognize my family, focus on comfort rather than aggressive treatment.',

  'digital.executorAccess': 'full',

  'final.disposition': 'cremation',
  'final.location': 'Ashes to be scattered at Amelia Island.',
  'final.agent': 'John Alan Carter',
  'final.instructions': 'A simple memorial service; no viewing.',

  'protect.tbe': { value: 'yes' },
  'tax.priorGiftReturns': { value: 'no' },
  'debts.familyLoans': { value: 'no' },

  'existing.hasWill': { value: 'no' },
  'existing.hasTrust': { value: 'no' },
  'existing.reasonNow': 'We just had our second child and bought the cabin.',
}

async function main() {
  const passwordHash = await bcrypt.hash(SEED_PASSWORD, 12)

  const org = await prisma.organization.create({
    data: { name: 'Sunshine Estate Law, PLLC', stateCode: 'FL', barName: 'The Florida Bar' },
  })

  const admin = await prisma.user.create({
    data: { organizationId: org.id, email: 'admin@estatecreate.test', passwordHash, role: 'ADMIN', firstName: 'Alex', lastName: 'Rivera' },
  })
  const attorney = await prisma.user.create({
    data: { organizationId: org.id, email: 'attorney@estatecreate.test', passwordHash, role: 'ATTORNEY', firstName: 'Dana', lastName: 'Whitfield', barNumber: '0123456' },
  })
  await prisma.user.create({
    data: { organizationId: org.id, email: 'paralegal@estatecreate.test', passwordHash, role: 'PARALEGAL', firstName: 'Priya', lastName: 'Nair' },
  })
  const client = await prisma.user.create({
    data: { organizationId: org.id, email: 'client@estatecreate.test', passwordHash, role: 'CLIENT', firstName: 'Sarah', lastName: 'Carter', phone: '904-555-0100' },
  })

  // Signup-time consents for the client.
  await prisma.consentRecord.createMany({
    data: [
      { userId: client.id, type: 'TERMS_OF_SERVICE', version: '2026-09-v1' },
      { userId: client.id, type: 'PRIVACY_NOTICE', version: '2026-09-v1' },
      { userId: client.id, type: 'ELECTRONIC_RECORDS_CONSENT', version: '2026-09-v1' },
    ],
  })

  const matter = await prisma.estateMatter.create({
    data: {
      organizationId: org.id,
      clientId: client.id,
      attorneyId: attorney.id,
      reference: 'EC-2026-000042',
      status: 'INTAKE',
    },
  })

  await prisma.questionnaireResponse.create({
    data: {
      matterId: matter.id,
      kind: 'TRIAGE',
      version: 1,
      answers: TRIAGE_ANSWERS as object,
      progress: computeProgress(getQuestionnaire('TRIAGE'), TRIAGE_ANSWERS) as object,
      completedAt: new Date(),
    },
  })
  await prisma.questionnaireResponse.create({
    data: {
      matterId: matter.id,
      kind: 'ESTATE_INTAKE',
      version: 1,
      answers: INTAKE_ANSWERS as object,
      progress: computeProgress(getQuestionnaire('ESTATE_INTAKE'), INTAKE_ANSWERS) as object,
      completedAt: new Date(),
    },
  })

  // Run the deterministic engine to populate the attorney review queue.
  const result = await generateMatterDocuments(matter.id, client.id)

  console.log('Seed complete.')
  console.log(`  Organization: ${org.name}`)
  console.log(`  Admin:     admin@estatecreate.test / ${SEED_PASSWORD}`)
  console.log(`  Attorney:  attorney@estatecreate.test / ${SEED_PASSWORD}`)
  console.log(`  Paralegal: paralegal@estatecreate.test / ${SEED_PASSWORD}`)
  console.log(`  Client:    client@estatecreate.test / ${SEED_PASSWORD}`)
  console.log(`  Matter ${matter.reference}: generated ${result.count} documents (${result.plan.recommendation.planType}).`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
