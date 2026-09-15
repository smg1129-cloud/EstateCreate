// IntakeContext — the normalized, typed view of a client's answers that every
// generator consumes. buildContext() maps the raw questionnaire answers (triage
// + estate intake, merged) into this structure. Generators never read raw
// answers directly, so the mapping lives in exactly one place.

import type { Answers } from '@/lib/questionnaire/types'
import { bool, num, rows, str, yesNo, explain } from '@/lib/questionnaire/types'

export type Pronoun = 'he' | 'she' | 'they'

export interface PronounSet {
  subject: string // he / she / they
  object: string // him / her / them
  possessive: string // his / her / their
  reflexive: string // himself / herself / themself
  /** Whether the pronoun takes plural verb agreement ("they are"). */
  plural: boolean
}

export function pronouns(p: Pronoun): PronounSet {
  switch (p) {
    case 'he':
      return { subject: 'he', object: 'him', possessive: 'his', reflexive: 'himself', plural: false }
    case 'she':
      return { subject: 'she', object: 'her', possessive: 'her', reflexive: 'herself', plural: false }
    default:
      return { subject: 'they', object: 'them', possessive: 'their', reflexive: 'themself', plural: true }
  }
}

export interface Fiduciary {
  fullName: string
  relationship?: string
  city?: string
  state?: string
  phone?: string
  isUSCitizen?: boolean
}

export interface Child {
  fullName: string
  dob?: string
  relationship: 'biological' | 'adopted' | 'step'
  isMinor: boolean
  deceased: boolean
  specialNeeds: boolean
}

export interface ResiduaryBeneficiary {
  name: string
  relationship?: string
  sharePercent: number
  ifPredeceased: 'per_stirpes' | 'others'
  isCharity: boolean
}

export interface SpecificGift {
  description: string
  recipient: string
  isCharity: boolean
  ifPredeceased: 'lapse' | 'to_descendants'
}

export interface AssetAccount {
  institution: string
  type: string
  value?: number
  beneficiary?: string
}

export interface RealEstate {
  description: string
  state?: string
  title?: string
  value?: number
}

export interface IntakeContext {
  raw: Answers

  testator: {
    fullName: string
    otherNames?: string
    dob?: string
    addressLine1?: string
    city?: string
    county?: string
    state: string
    postalCode?: string
    pronoun: Pronoun
    p: PronounSet
    isUSCitizen: boolean
    floridaDomicile: boolean
    maritalStatus: 'single' | 'married' | 'partnered' | 'divorced' | 'widowed'
    isMarried: boolean
    receivesGovBenefits: boolean
  }

  spouse?: {
    fullName: string
    isUSCitizen: boolean
    isMarried: boolean
    hasPrenup: boolean
    leaveEverythingFirst: boolean
    hasOwnChildren: boolean
  }

  children: Child[]
  hasMinorChildren: boolean
  hasDescendants: boolean
  treatEqually: boolean
  includeAfterborn: boolean
  disinherits?: string // explanation text if a child is disinherited
  deceasedChildShare: 'per_stirpes' | 'surviving'

  distribution: {
    narrative: string
    residuary: ResiduaryBeneficiary[]
    ultimateBackstop?: string
    howReceived: 'outright' | 'staggered' | 'lifetime_trust'
    stagedAges: number[]
    minorPot: 'pot' | 'separate'
    trusteeStandard: 'broad' | 'hems'
    divorceProtection: boolean
    beneficiaryMayBeTrustee: boolean
    remainderPOA: 'bloodline' | 'limited' | 'broad'
    trustProtector: boolean
    trustProtectorName?: string
  }

  specificGifts: SpecificGift[]
  usePersonalPropertyMemo: boolean

  fiduciaries: {
    personalReps: Fiduciary[]
    trustees: Fiduciary[]
    poaAgents: Fiduciary[]
    surrogates: Fiduciary[]
    guardians: Fiduciary[]
    excluded?: string
    bondWaived: boolean
  }

  assets: {
    ownsHome: boolean
    homeAddress?: string
    homeTitle?: string
    homestead: boolean
    realEstate: RealEstate[]
    accounts: AssetAccount[]
    lifeInsurance: { company: string; deathBenefit?: number; beneficiary?: string; owner?: string }[]
    ownsBusiness: boolean
    hasBuySell: boolean
    hasDigitalAssets: boolean
    ownsFirearms: boolean
    firearmsCount?: number
    hasNFAItems: boolean
    nfaDetail?: string
    firearmsRecipient?: string
  }

  minors: {
    guardianManagesMoney: boolean
    educationOffTop: boolean
    wishes?: string
  }

  specialNeeds?: {
    beneficiaryName: string
    receivesBenefits: boolean
    trusteeName?: string
    advocate?: string
    hasExistingAbleOrTrust: boolean
    hasLetterOfIntent: boolean
    remainderOnDeath?: string
  }

  pets: { name: string; type?: string; caregiver?: string; medical?: string }[]
  petTrustAmount?: number
  petCare: {
    enforcer?: string
    remainder?: string
    instructions?: string
  }

  finalArrangements: {
    disposition?: 'burial' | 'cremation' | 'donation' | 'undecided'
    location?: string
    agent?: string
    instructions?: string
  }

  debts: {
    forgiveFamilyLoans: boolean
    forgiveFamilyLoansDetail?: string
    paidFromResidue: boolean
  }

  poaPowers: {
    gifting: boolean
    realEstate: boolean
    beneficiaryChanges: boolean
    trustPowers: boolean
    medicaidPlanning: boolean
    digital: boolean
  }

  health: {
    surrogateNow: boolean
    lifeProlonging: 'withhold' | 'continue' | 'surrogate_decides'
    withholdNutrition: boolean
    comfortCare: boolean
    organDonation: 'yes_any' | 'yes_transplant' | 'no'
    hipaaRelease?: string
    specificTreatments?: string
    dementiaWishes?: string
    wishes?: string
  }

  digital: {
    executorFullAccess: boolean
    notes?: string
  }

  /** Signals that drive the rules engine's document selection. */
  signals: {
    goal: string
    netWorth: string
    ownsOutOfStateRealEstate: boolean
    privacyImportant: boolean
    wantsIncapacityDocs: boolean
    specialNeedsBeneficiary: boolean
  }
}

function personName(row: Record<string, unknown>): string {
  return typeof row.fullName === 'string' ? row.fullName.trim() : ''
}

function toFiduciaries(source: ReturnType<typeof rows>): Fiduciary[] {
  return source
    .map((r) => ({
      fullName: personName(r),
      relationship: typeof r.relationship === 'string' ? r.relationship : undefined,
      city: typeof r.city === 'string' ? r.city : undefined,
      state: typeof r.state === 'string' ? r.state : undefined,
      phone: typeof r.phone === 'string' ? r.phone : undefined,
      isUSCitizen: r.isUSCitizen === true || r.isUSCitizen === 'true' ? true : r.isUSCitizen === false || r.isUSCitizen === 'false' ? false : undefined,
    }))
    .filter((f) => f.fullName)
}

function toNumber(v: unknown): number | undefined {
  if (typeof v === 'number') return v
  if (typeof v === 'string' && v.trim() && !Number.isNaN(Number(v.replace(/[,$]/g, '')))) {
    return Number(v.replace(/[,$]/g, ''))
  }
  return undefined
}

export function buildContext(answers: Answers): IntakeContext {
  const pronoun = (str(answers, 'personal.gender') as Pronoun) || 'they'

  const children: Child[] = rows(answers, 'family.children')
    .map((r) => ({
      fullName: personName(r),
      dob: typeof r.dob === 'string' ? r.dob : undefined,
      relationship: (r.relationship as Child['relationship']) || 'biological',
      isMinor: r.isMinor === true || r.isMinor === 'true',
      deceased: r.deceased === true || r.deceased === 'true',
      specialNeeds: r.specialNeeds === true || r.specialNeeds === 'true',
    }))
    .filter((c) => c.fullName)

  const livingChildren = children.filter((c) => !c.deceased)
  const hasMinorChildren =
    bool(answers, 'triage.hasMinorChildren') || livingChildren.some((c) => c.isMinor)

  const residuary: ResiduaryBeneficiary[] = rows(answers, 'dist.residuary')
    .map((r) => ({
      name: typeof r.name === 'string' ? r.name.trim() : '',
      relationship: typeof r.relationship === 'string' ? r.relationship : undefined,
      sharePercent: toNumber(r.sharePercent) ?? 0,
      ifPredeceased: (r.ifPredeceased as ResiduaryBeneficiary['ifPredeceased']) || 'per_stirpes',
      isCharity: r.relationship === 'charity',
    }))
    .filter((r) => r.name)

  const specificGifts: SpecificGift[] = rows(answers, 'gifts.specific')
    .map((r) => ({
      description: typeof r.description === 'string' ? r.description.trim() : '',
      recipient: typeof r.recipient === 'string' ? r.recipient.trim() : '',
      isCharity: r.recipientType === 'charity',
      ifPredeceased: (r.ifPredeceased as SpecificGift['ifPredeceased']) || 'lapse',
    }))
    .filter((g) => g.description && g.recipient)

  const stagedAges = str(answers, 'dist.stagedAges')
    .split(',')
    .map((s) => Number(s.trim()))
    .filter((n) => Number.isFinite(n) && n > 0)

  const maritalStatus = (str(answers, 'triage.maritalStatus') || 'single') as IntakeContext['testator']['maritalStatus']
  const isMarried = maritalStatus === 'married' && bool(answers, 'spouse.isMarried')

  const spouse = maritalStatus === 'married' || maritalStatus === 'partnered'
    ? {
        fullName: str(answers, 'spouse.fullName'),
        isUSCitizen: answers['spouse.isUSCitizen'] === undefined ? true : bool(answers, 'spouse.isUSCitizen'),
        isMarried: bool(answers, 'spouse.isMarried'),
        hasPrenup: yesNo(answers, 'spouse.prenup') === 'yes',
        leaveEverythingFirst: bool(answers, 'spouse.leaveEverythingToSpouse'),
        hasOwnChildren: yesNo(answers, 'spouse.hasOwnChildren') === 'yes',
      }
    : undefined

  const specialNeedsName = str(answers, 'sn.beneficiaryName')
  const specialNeeds =
    bool(answers, 'triage.specialNeedsBeneficiary') && (specialNeedsName || bool(answers, 'sn.receivesBenefits'))
      ? {
          beneficiaryName: specialNeedsName,
          receivesBenefits: bool(answers, 'sn.receivesBenefits'),
          trusteeName: str(answers, 'sn.trusteeName') || undefined,
          advocate: str(answers, 'sn.advocate') || undefined,
          hasExistingAbleOrTrust: yesNo(answers, 'sn.ableAccount') === 'yes',
          hasLetterOfIntent: bool(answers, 'sn.letterOfIntent'),
          remainderOnDeath: str(answers, 'sn.remainderOnDeath') || undefined,
        }
      : undefined

  return {
    raw: answers,
    testator: {
      fullName: str(answers, 'personal.fullName'),
      otherNames: str(answers, 'personal.otherNames') || undefined,
      dob: str(answers, 'personal.dob') || undefined,
      addressLine1: str(answers, 'personal.addressLine1') || undefined,
      city: str(answers, 'personal.city') || undefined,
      county: str(answers, 'personal.county') || undefined,
      state: str(answers, 'personal.state') || 'FL',
      postalCode: str(answers, 'personal.postalCode') || undefined,
      pronoun,
      p: pronouns(pronoun),
      isUSCitizen: answers['personal.isUSCitizen'] === undefined ? true : bool(answers, 'personal.isUSCitizen'),
      floridaDomicile: bool(answers, 'personal.floridaDomicile'),
      maritalStatus,
      isMarried,
      receivesGovBenefits: yesNo(answers, 'personal.govBenefits') === 'yes',
    },
    spouse,
    children,
    hasMinorChildren,
    hasDescendants: livingChildren.length > 0,
    treatEqually: yesNo(answers, 'family.treatEqually') !== 'no',
    includeAfterborn: answers['family.afterbornIntent'] === undefined ? true : bool(answers, 'family.afterbornIntent'),
    disinherits: yesNo(answers, 'family.disinherit') === 'yes' ? explain(answers, 'family.disinherit') ?? 'yes' : undefined,
    deceasedChildShare: (str(answers, 'family.deceasedChildShare') as 'per_stirpes' | 'surviving') || 'per_stirpes',

    distribution: {
      narrative: str(answers, 'dist.narrative'),
      residuary,
      ultimateBackstop: str(answers, 'dist.ultimateBackstop') || undefined,
      howReceived: (str(answers, 'dist.howReceived') as IntakeContext['distribution']['howReceived']) || 'outright',
      stagedAges: stagedAges.length ? stagedAges : [25, 30, 35],
      minorPot: (str(answers, 'dist.minorPotTrust') as 'pot' | 'separate') || 'pot',
      trusteeStandard: (str(answers, 'dist.trusteeStandard') as 'broad' | 'hems') || 'hems',
      divorceProtection: bool(answers, 'dist.divorceProtection'),
      beneficiaryMayBeTrustee: bool(answers, 'dist.beneficiaryAsTrustee'),
      remainderPOA: (str(answers, 'dist.remainderPOA') as 'bloodline' | 'limited' | 'broad') || 'bloodline',
      trustProtector: bool(answers, 'dist.trustProtector'),
      trustProtectorName: str(answers, 'fid.trustProtectorName') || undefined,
    },

    specificGifts,
    usePersonalPropertyMemo: bool(answers, 'gifts.personalPropertyMemo'),

    fiduciaries: {
      personalReps: toFiduciaries(rows(answers, 'fid.personalRep')),
      trustees: toFiduciaries(rows(answers, 'fid.trustee')),
      poaAgents: toFiduciaries(rows(answers, 'fid.poaAgent')),
      surrogates: toFiduciaries(rows(answers, 'fid.surrogate')),
      guardians: toFiduciaries(rows(answers, 'fid.guardian')),
      excluded: yesNo(answers, 'fid.excluded') === 'yes' ? explain(answers, 'fid.excluded') ?? 'yes' : undefined,
      bondWaived: answers['fid.bondWaived'] === undefined ? true : bool(answers, 'fid.bondWaived'),
    },

    assets: {
      ownsHome: bool(answers, 'assets.homeOwn'),
      homeAddress: str(answers, 'assets.homeAddress') || undefined,
      homeTitle: str(answers, 'assets.homeTitle') || undefined,
      homestead: bool(answers, 'assets.homestead'),
      realEstate: rows(answers, 'assets.realEstate')
        .map((r) => ({
          description: typeof r.description === 'string' ? r.description : '',
          state: typeof r.state === 'string' ? r.state : undefined,
          title: typeof r.title === 'string' ? r.title : undefined,
          value: toNumber(r.value),
        }))
        .filter((r) => r.description),
      accounts: rows(answers, 'assets.accounts')
        .map((r) => ({
          institution: typeof r.institution === 'string' ? r.institution : '',
          type: typeof r.type === 'string' ? r.type : 'other',
          value: toNumber(r.value),
          beneficiary: typeof r.beneficiary === 'string' ? r.beneficiary : undefined,
        }))
        .filter((r) => r.institution),
      lifeInsurance: rows(answers, 'assets.lifeInsurance')
        .map((r) => ({
          company: typeof r.company === 'string' ? r.company : '',
          deathBenefit: toNumber(r.deathBenefit),
          beneficiary: typeof r.beneficiary === 'string' ? r.beneficiary : undefined,
          owner: typeof r.owner === 'string' ? r.owner : undefined,
        }))
        .filter((r) => r.company),
      ownsBusiness: yesNo(answers, 'assets.ownsBusiness') === 'yes' || bool(answers, 'triage.ownsBusiness'),
      hasBuySell: yesNo(answers, 'business.buySell') === 'yes' || yesNo(answers, 'assets.businessBuySell') === 'yes',
      hasDigitalAssets: yesNo(answers, 'assets.digitalAssets') === 'yes' || yesNo(answers, 'assets.crypto') === 'yes',
      ownsFirearms: yesNo(answers, 'assets.firearms') === 'yes',
      firearmsCount: num(answers, 'assets.firearmsCount'),
      hasNFAItems: yesNo(answers, 'assets.firearmsNFA') === 'yes',
      nfaDetail: explain(answers, 'assets.firearmsNFA'),
      firearmsRecipient: str(answers, 'assets.firearmsRecipient') || undefined,
    },

    minors: {
      guardianManagesMoney: str(answers, 'minors.guardianMoneySamePerson') !== 'different',
      educationOffTop: str(answers, 'minors.educationOffTop') !== 'own_share',
      wishes: str(answers, 'minors.wishes') || undefined,
    },

    specialNeeds,

    pets: rows(answers, 'pets.animals')
      .map((r) => ({
        name: typeof r.name === 'string' ? r.name : '',
        type: typeof r.type === 'string' ? r.type : undefined,
        caregiver: typeof r.caregiver === 'string' ? r.caregiver : undefined,
        medical: typeof r.medical === 'string' ? r.medical : undefined,
      }))
      .filter((p) => p.name),
    petTrustAmount: toNumber(answers['pets.trustAmount']),
    petCare: {
      enforcer: str(answers, 'pets.enforcer') || undefined,
      remainder: str(answers, 'pets.remainder') || undefined,
      instructions: str(answers, 'pets.instructions') || undefined,
    },

    finalArrangements: {
      disposition: (str(answers, 'final.disposition') as IntakeContext['finalArrangements']['disposition']) || undefined,
      location: str(answers, 'final.location') || undefined,
      agent: str(answers, 'final.agent') || undefined,
      instructions: str(answers, 'final.instructions') || undefined,
    },

    debts: {
      forgiveFamilyLoans: yesNo(answers, 'debts.familyLoans') === 'yes',
      forgiveFamilyLoansDetail: explain(answers, 'debts.familyLoans'),
      paidFromResidue: str(answers, 'debts.howPaid') !== 'with_asset',
    },

    poaPowers: {
      gifting: bool(answers, 'poa.gifting'),
      realEstate: answers['poa.realEstate'] === undefined ? true : bool(answers, 'poa.realEstate'),
      beneficiaryChanges: bool(answers, 'poa.beneficiaryChanges'),
      trustPowers: bool(answers, 'poa.trustPowers'),
      medicaidPlanning: bool(answers, 'poa.medicaidPlanning'),
      digital: answers['poa.digital'] === undefined ? true : bool(answers, 'poa.digital'),
    },

    health: {
      surrogateNow: str(answers, 'health.surrogateNow') === 'now_too',
      lifeProlonging: (str(answers, 'health.lifeProlonging') as IntakeContext['health']['lifeProlonging']) || 'surrogate_decides',
      withholdNutrition: bool(answers, 'health.artificialNutrition'),
      comfortCare: answers['health.comfortCare'] === undefined ? true : bool(answers, 'health.comfortCare'),
      organDonation: (str(answers, 'health.organDonation') as IntakeContext['health']['organDonation']) || 'no',
      hipaaRelease: str(answers, 'health.hipaaRelease') || undefined,
      specificTreatments: str(answers, 'health.specificTreatments') || undefined,
      dementiaWishes: str(answers, 'health.dementiaWishes') || undefined,
      wishes: str(answers, 'health.wishes') || undefined,
    },

    digital: {
      executorFullAccess: str(answers, 'digital.executorAccess') !== 'close_only',
      notes: str(answers, 'digital.notes') || undefined,
    },

    signals: {
      goal: str(answers, 'triage.primaryGoal'),
      netWorth: str(answers, 'triage.netWorth'),
      ownsOutOfStateRealEstate: bool(answers, 'triage.ownsOutOfStateRealEstate'),
      privacyImportant: bool(answers, 'triage.privacyImportant'),
      wantsIncapacityDocs: answers['triage.wantsIncapacityDocs'] === undefined ? true : bool(answers, 'triage.wantsIncapacityDocs'),
      specialNeedsBeneficiary: bool(answers, 'triage.specialNeedsBeneficiary'),
    },
  }
}
