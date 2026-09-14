// The rules engine.
//
// Two jobs, both deterministic:
//   1. recommendDocuments() — decide will-based vs trust-based and the exact
//      set of documents this client should receive.
//   2. issue-spotting — attach attorney-facing ReviewFlags drawn from the
//      firm's 36-module attorney checklist (statutory anchors included). These
//      never change the client-facing document text; they tell the reviewing
//      attorney what to scrutinize, which is the point of the human gate.

import type { DocumentType, ReviewFlag } from './blocks'
import { flag } from './blocks'
import type { IntakeContext } from './context'

export interface PlanRecommendation {
  planType: 'WILL_BASED' | 'TRUST_BASED'
  documentTypes: DocumentType[]
  rationale: string[]
  flags: ReviewFlag[]
}

function wantsTrust(ctx: IntakeContext): { trust: boolean; reasons: string[] } {
  const reasons: string[] = []
  const g = ctx.signals.goal
  if (g === 'avoid_probate') reasons.push('Client’s primary goal is avoiding probate.')
  if (g === 'control_timing') reasons.push('Client wants to control the timing of distributions.')
  if (g === 'protect_beneficiary') reasons.push('Client wants to protect a beneficiary.')
  if (ctx.signals.privacyImportant) reasons.push('Client values keeping the estate out of the public probate record.')
  if (ctx.signals.ownsOutOfStateRealEstate)
    reasons.push('Client owns out-of-state real estate (avoids ancillary probate).')
  if (ctx.signals.netWorth === '2m_13m' || ctx.signals.netWorth === 'over_13m')
    reasons.push('Estate size warrants trust-based administration and tax planning.')
  if (ctx.distribution.howReceived === 'staggered' || ctx.distribution.howReceived === 'lifetime_trust')
    reasons.push('Client wants beneficiaries to receive assets in trust over time.')
  if (ctx.specialNeeds) reasons.push('A beneficiary with special needs requires trust protection.')
  return { trust: reasons.length > 0, reasons }
}

export function recommendDocuments(ctx: IntakeContext): PlanRecommendation {
  const { trust, reasons } = wantsTrust(ctx)
  const rationale: string[] = []
  const documentTypes: DocumentType[] = []

  if (trust) {
    documentTypes.push('REVOCABLE_LIVING_TRUST', 'POUR_OVER_WILL')
    rationale.push('Trust-based plan: ' + reasons.join(' '))
  } else {
    documentTypes.push('LAST_WILL')
    rationale.push('Will-based plan: a straightforward will fits the stated goals and estate profile.')
  }

  if (ctx.specialNeeds) {
    documentTypes.push('SPECIAL_NEEDS_TRUST')
    rationale.push('Special needs trust to preserve needs-based benefits for a beneficiary.')
  }

  if (ctx.signals.wantsIncapacityDocs) {
    documentTypes.push('DURABLE_POWER_OF_ATTORNEY', 'HEALTH_CARE_SURROGATE', 'LIVING_WILL', 'HIPAA_AUTHORIZATION')
    rationale.push('Incapacity package: durable POA, health care surrogate, living will, and HIPAA authorization.')
  }

  if (ctx.usePersonalPropertyMemo) {
    documentTypes.push('PERSONAL_PROPERTY_MEMORANDUM')
    rationale.push('Separate writing for tangible personal property (Fla. Stat. 732.515).')
  }

  return {
    planType: trust ? 'TRUST_BASED' : 'WILL_BASED',
    documentTypes,
    rationale,
    flags: spotIssues(ctx),
  }
}

/** Issue-spotting mapped from the attorney intake checklist. Order is roughly
 * by module. Each flag is a prompt for the reviewing attorney, not advice. */
export function spotIssues(ctx: IntakeContext): ReviewFlag[] {
  const flags: ReviewFlag[] = []
  const t = ctx.testator

  // Module 3 — Identity, Domicile, Residency
  if (!t.isUSCitizen) {
    flags.push(
      flag(
        'NONCITIZEN_CLIENT',
        'warning',
        'Client is not a U.S. citizen. If a non-resident alien, an entirely different estate-tax regime applies (a $60,000 exemption). Confirm status and residency.',
        'Module 3.3'
      )
    )
  }
  if (!t.floridaDomicile) {
    flags.push(
      flag(
        'DOMICILE',
        'caution',
        'Client did not confirm Florida domicile. Run a domicile analysis (Declaration of Domicile, voter/driver registration, homestead, physical presence) before relying on Florida law.',
        'Module 3.4'
      )
    )
  }

  // Module 4 — Marital status and spousal rights
  if (ctx.spouse) {
    if (!ctx.spouse.isUSCitizen) {
      flags.push(
        flag(
          'NONCITIZEN_SPOUSE',
          'warning',
          'Spouse is not a U.S. citizen: the unlimited marital deduction is unavailable and a QDOT may be required for estate-tax deferral.',
          'Module 3.3 / 4'
        )
      )
    }
    if (!ctx.spouse.isMarried && t.maritalStatus === 'partnered') {
      flags.push(
        flag(
          'UNMARRIED_PARTNER',
          'caution',
          'Unmarried partner has no automatic rights under Florida law. Rely on titling, beneficiary designations, and express provisions — not spousal defaults.',
          'Module 4.11'
        )
      )
    }
    if (ctx.spouse.hasPrenup) {
      flags.push(
        flag(
          'PRENUP',
          'caution',
          'A prenuptial/postnuptial agreement exists. Confirm scope of the spousal-rights waiver (elective share, homestead, exempt property, family allowance) before drafting.',
          'Module 4.3–4.4; Fla. Stat. 732.702'
        )
      )
    }
    // Elective share always worth confirming when there is a spouse.
    flags.push(
      flag(
        'ELECTIVE_SHARE',
        'info',
        'Surviving spouse has a 30% elective-share right reaching well beyond the probate estate (revocable trust, POD/TOD, joint property, retirement, life insurance). Confirm the plan does not inadvertently trigger it.',
        'Fla. Stat. 732.201–.2155'
      )
    )
    if (ctx.spouse.hasOwnChildren || ctx.children.some((c) => c.relationship === 'step')) {
      flags.push(
        flag(
          'BLENDED_FAMILY',
          'caution',
          'Blended family. Confirm whether assets left outright to the spouse are intended to ultimately reach the client’s own children; consider a QTIP/marital trust.',
          'Second-marriage planning'
        )
      )
    }
  }

  // Module 5 — Prior marriages and contractual obligations
  const priorMarriage = ctx.raw['prior.hadPriorMarriage']
  if (priorMarriage && (priorMarriage as { value?: string }).value === 'yes') {
    const obligations = ctx.raw['prior.continuingObligations'] as { value?: string } | undefined
    if (obligations?.value === 'yes') {
      flags.push(
        flag(
          'PRIOR_OBLIGATIONS',
          'warning',
          'Continuing obligations from a prior marriage (alimony, support, required life insurance, QDRO) can trump the will. Read the marital settlement agreement before drafting.',
          'Module 5.2'
        )
      )
    }
    const formerBenef = ctx.raw['prior.formerSpouseBeneficiary'] as { value?: string } | undefined
    if (formerBenef?.value === 'yes') {
      flags.push(
        flag(
          'FORMER_SPOUSE_DESIGNATION',
          'warning',
          'A former spouse is still named on an account/policy/document. Dissolution does not reliably remove them (and ERISA preempts Fla. Stat. 732.703) — re-execute the designations.',
          'Module 5.4–5.5'
        )
      )
    }
  }

  // Module 6 — Descendants and class definition
  if (ctx.disinherits) {
    flags.push(
      flag(
        'DISINHERITANCE',
        'caution',
        'Client intends to disinherit a child. This must be an express negative provision naming the child, not silence.',
        'Module 6.10'
      )
    )
  }
  if (ctx.children.some((c) => c.relationship === 'step')) {
    flags.push(
      flag(
        'STEPCHILDREN',
        'info',
        'Stepchildren identified. They inherit nothing in Florida unless expressly included — confirm intent to include or exclude.',
        'Module 6.6'
      )
    )
  }

  // Florida homestead — devise restrictions
  if (ctx.assets.ownsHome && ctx.assets.homestead && (ctx.spouse || ctx.hasMinorChildren)) {
    flags.push(
      flag(
        'HOMESTEAD_DEVISE',
        'warning',
        'Homestead with a surviving spouse and/or minor child: Florida sharply restricts to whom the homestead may be devised (Art. X, §4, Fla. Const.; Fla. Stat. 732.4015–.4017). Confirm the disposition of the residence is valid.',
        'Fla. Stat. 732.401 et seq.'
      )
    )
  }

  // Out-of-state real estate — ancillary probate
  if (ctx.signals.ownsOutOfStateRealEstate || ctx.assets.realEstate.some((r) => r.state && r.state !== 'FL')) {
    flags.push(
      flag(
        'ANCILLARY_PROBATE',
        'caution',
        'Out-of-state real estate held in the client’s name will require ancillary probate in that state. A revocable trust (with the property retitled into it) avoids this.',
        'Module 3 / 7'
      )
    )
  }

  // Business interests
  if (ctx.assets.ownsBusiness) {
    if (ctx.assets.hasBuySell) {
      flags.push(
        flag(
          'BUY_SELL',
          'info',
          'A buy-sell/shareholder agreement usually controls the business interest at death and can override the will. Obtain and read it.',
          'Module — business interests'
        )
      )
    } else {
      flags.push(
        flag(
          'BUSINESS_NO_BUYSELL',
          'caution',
          'Client owns a business interest with no buy-sell agreement noted. Discuss succession and who runs the business the morning after death.',
          'Client questionnaire §K'
        )
      )
    }
  }

  // Estate tax exposure
  if (ctx.signals.netWorth === 'over_13m') {
    flags.push(
      flag(
        'ESTATE_TAX',
        'warning',
        'Estate may exceed the federal basic exclusion (2026: $15,000,000 per individual). Consider credit-shelter/marital trust planning, portability, and lifetime gifting.',
        'Module — taxes'
      )
    )
  }

  // Needs-based benefits
  if (ctx.testator.receivesGovBenefits) {
    flags.push(
      flag(
        'CLIENT_BENEFITS',
        'caution',
        'Client receives needs-based government benefits; incoming inheritances or transfers may affect eligibility.',
        'Client questionnaire §A-22'
      )
    )
  }
  if (ctx.specialNeeds && ctx.specialNeeds.receivesBenefits) {
    flags.push(
      flag(
        'SNT_REQUIRED',
        'warning',
        'A beneficiary on needs-based benefits must not receive an outright inheritance. Route all gifts to them through the special needs trust.',
        'Module — special needs; 42 U.S.C. 1396p(d)(4)'
      )
    )
  }

  // Firearms
  if (ctx.assets.ownsFirearms) {
    flags.push(
      flag(
        'FIREARMS',
        'info',
        'Client owns firearms. Transfer to a prohibited person (even by inheritance) is a federal crime; consider a gun trust, especially for any NFA items.',
        'Client questionnaire §L-5'
      )
    )
  }

  // Fiduciary sanity checks
  if (ctx.fiduciaries.personalReps.length === 0) {
    flags.push(flag('NO_PR', 'warning', 'No personal representative named. A nominee is required.', 'Fla. Stat. 733.301'))
  }
  const nonRelativeOutOfState = ctx.fiduciaries.personalReps.find(
    (f) => f.state && f.state !== 'FL' && !f.relationship
  )
  if (nonRelativeOutOfState) {
    flags.push(
      flag(
        'PR_QUALIFICATION',
        'caution',
        `Personal representative "${nonRelativeOutOfState.fullName}" appears to live out of state. A non-relative who is not a Florida resident cannot qualify to serve.`,
        'Fla. Stat. 733.302–.304'
      )
    )
  }
  if (ctx.fiduciaries.excluded) {
    flags.push(
      flag('EXCLUDED_PERSONS', 'info', 'Client expressly named person(s) they do not want serving or appointed. Confirm these are excluded in each instrument.')
    )
  }

  // Distribution sanity
  const totalShares = ctx.distribution.residuary.reduce((sum, r) => sum + (r.sharePercent || 0), 0)
  if (ctx.distribution.residuary.length > 0 && Math.abs(totalShares - 100) > 0.5) {
    flags.push(
      flag(
        'SHARES_NOT_100',
        'warning',
        `Residuary shares total ${totalShares}%, not 100%. Confirm the intended division before finalizing.`
      )
    )
  }
  if (!ctx.distribution.ultimateBackstop) {
    flags.push(
      flag(
        'NO_BACKSTOP',
        'caution',
        'No ultimate/backstop beneficiary named if everyone predeceases the client. Without one, intestacy controls the remainder.'
      )
    )
  }

  return flags
}
