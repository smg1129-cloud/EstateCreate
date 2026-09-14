// Irrevocable Life Insurance Trust (ILIT). Unlike the marital/QDOT provisions,
// this IS a standalone, separately executed irrevocable trust. Its purpose is to
// own life insurance so that the death proceeds are not included in the
// insured's taxable estate under I.R.C. 2042. The grantor makes gifts to the
// trust to pay premiums; beneficiaries hold Crummey withdrawal rights over those
// gifts so the contributions qualify for the annual gift-tax exclusion. The
// grantor must retain no incidents of ownership and must not serve as trustee.

import {
  article,
  clause,
  flag,
  para,
  spacer,
  title,
  type Block,
  type DocumentModel,
  type ReviewFlag,
  type Run,
} from '../blocks'
import type { IntakeContext } from '../context'
import { ENGINE_VERSION, bondClause, fullName, joinAnd, residence, successionSentence, irrevocableTrustExecution } from './shared'
import { fiduciaryPowersClauses } from './commonEstate'

function trustName(ctx: IntakeContext): string {
  return `The ${ctx.testator.fullName || '[CLIENT NAME]'} Irrevocable Life Insurance Trust`
}

/** Describes who ultimately takes, from the intake distribution. */
function beneficiaryDescription(ctx: IntakeContext): string {
  const named = ctx.distribution.residuary.map((b) => b.name).filter(Boolean)
  if (named.length) return joinAnd(named)
  if (ctx.hasDescendants) return 'the Grantor’s then-living descendants, per stirpes'
  return '[BENEFICIARIES — attorney to confirm]'
}

function remainderPhrase(ctx: IntakeContext): string {
  return ctx.distribution.ultimateBackstop
    ? `to the Grantor’s then-living descendants, per stirpes; or if none, to ${ctx.distribution.ultimateBackstop}`
    : 'to the Grantor’s then-living descendants, per stirpes; or if none, to the Grantor’s heirs at law determined under the laws of the State of Florida then in effect'
}

function scheduleARows(ctx: IntakeContext): Block[] {
  const items: Run[][] = ctx.assets.lifeInsurance.map((pol) => [
    `Policy issued by ${pol.company || '[insurer]'}`,
    pol.deathBenefit ? `, face amount approximately $${pol.deathBenefit.toLocaleString()}` : ', face amount $__________',
    pol.beneficiary ? ` (current beneficiary of record: ${pol.beneficiary})` : '',
    ', policy no. __________________ — to be owned by or assigned to the Trustee, or applied for by the Trustee.',
  ])
  if (items.length === 0) {
    items.push(['[No policies listed yet. List each policy the Trustee will own or apply for: insurer, insured, face amount, and policy number.]'])
  }
  return [{ kind: 'list', ordered: true, items }]
}

export function generateIlit(ctx: IntakeContext): DocumentModel {
  const blocks: Block[] = []
  const flags: ReviewFlag[] = []
  const grantor = fullName(ctx)
  const tName = trustName(ctx)
  const trustees = ctx.fiduciaries.trustees
  const onlyNomineeIsGrantor =
    trustees.length > 0 && trustees.every((t) => t.fullName.trim() && t.fullName.trim() === grantor.trim())

  blocks.push(title('Irrevocable Life Insurance Trust Agreement', tName))
  blocks.push(spacer(1))
  blocks.push(
    para([
      { text: 'Note. ', bold: true },
      {
        text: 'This is a standalone irrevocable trust. Unlike marital or credit-shelter provisions, it is separately executed and funded — it is not incorporated into the will or revocable living trust.',
        italic: true,
      },
    ])
  )
  blocks.push(
    para([
      `This Irrevocable Life Insurance Trust Agreement is made by `,
      { text: grantor, bold: true },
      `, of ${residence(ctx)}, as grantor (the "Grantor"), and the Trustee named below. This trust may be referred to as `,
      { text: `${tName} dated ______________, 20___`, bold: true },
      `. The Grantor is also the insured under the policies held by this trust (the "Insured").`,
    ])
  )

  // Article I — Irrevocability and purpose
  blocks.push(article('I', 'Creation; Irrevocability; Purpose'))
  blocks.push(
    clause('1.1', 'The Grantor transfers to the Trustee the property listed on Schedule A, together with any policies of insurance later added and any cash contributed to pay premiums, to be held, administered, and distributed as provided in this Agreement.')
  )
  blocks.push(
    clause('1.2', [
      { text: 'This trust is irrevocable. ', bold: true },
      'The Grantor may not alter, amend, revoke, or terminate this trust in whole or in part, and the Grantor retains no right, title, or interest in the trust property or its income.',
    ])
  )
  blocks.push(
    clause('1.3', 'The primary purpose of this trust is to own life insurance on the Insured’s life and to hold and administer the proceeds so that they are not included in the Insured’s gross estate for federal estate tax purposes. It is the Grantor’s intent that the Grantor possess no incidents of ownership in any policy held by this trust within the meaning of Section 2042 of the Internal Revenue Code.')
  )

  // Article II — Insurance policies
  blocks.push(article('II', 'Insurance Policies'))
  blocks.push(
    clause('2.1', 'The Trustee shall hold, and may apply for and acquire, the policies of insurance described on Schedule A and any other policies transferred or made payable to the Trustee. The Trustee shall be the owner and, unless the Trustee directs otherwise, the beneficiary of each such policy.')
  )
  blocks.push(
    clause('2.2', 'The Grantor shall have no power to exercise, and shall not exercise, any incident of ownership over any policy — including no power to change beneficiaries, to assign, to pledge, to borrow against, or to surrender any policy. All such powers belong exclusively to the Trustee.')
  )
  blocks.push(
    clause('2.3', 'The Trustee is not required to pay premiums from trust principal or income and has no duty to the beneficiaries to keep any policy in force except from funds actually contributed to the trust for that purpose. The Trustee may, but need not, notify the beneficiaries if contributions are insufficient to pay a premium.')
  )

  // Article III — Contributions and Crummey withdrawal rights
  blocks.push(article('III', 'Contributions; Withdrawal (Crummey) Rights'))
  blocks.push(
    clause('3.1', 'The Grantor and others may from time to time contribute cash to the trust, which the Trustee may use to pay premiums on the policies. Each such contribution is subject to the withdrawal rights described in this Article.')
  )
  blocks.push(
    clause('3.2', 'Upon each contribution, each beneficiary then holding a withdrawal right may withdraw from the trust an amount of that contribution equal to the annual federal gift-tax exclusion available to the contributor for that beneficiary (or such lesser amount as the contribution and the number of beneficiaries allow). This right lapses if not exercised within thirty (30) days after the beneficiary (or the beneficiary’s guardian) receives notice of the contribution.')
  )
  blocks.push(
    clause('3.3', 'The Trustee shall give prompt written notice of each contribution and of the withdrawal right to each beneficiary entitled to it (or to the natural or legal guardian of a minor or incapacitated beneficiary), and shall keep a record of each notice. The Trustee shall retain sufficient liquid assets to satisfy any withdrawal right during the withdrawal period.')
  )
  blocks.push(
    clause('3.4', 'The lapse of a withdrawal right in any calendar year shall be limited so that it is not a release of a general power of appointment beyond the greater of $5,000 or five percent (5%) of the trust assets to which the right applies (the "5-and-5" limitation). To the extent a withdrawal right would otherwise lapse by more than that amount, the excess shall not lapse but shall continue as a "hanging" withdrawal right, carried forward and lapsing in later years only within the 5-and-5 limitation.')
  )

  // Article IV — Administration during the Insured's life
  blocks.push(article('IV', 'Administration During the Insured’s Life'))
  blocks.push(
    clause('4.1', 'During the Insured’s lifetime, the Trustee shall hold the trust property and, in the Trustee’s discretion, may distribute to or for the benefit of the beneficiaries as much of the net income as the Trustee determines advisable, adding any undistributed income to principal. The Trustee is not required to make distributions that would defeat the purpose of paying premiums.')
  )

  // Article V — Administration on the Insured's death
  blocks.push(article('V', 'Collection and Disposition of Proceeds'))
  blocks.push(
    clause('5.1', 'On the Insured’s death, the Trustee shall collect the proceeds of all policies payable to the trust and shall hold and administer them, together with the other trust property, for the benefit of the beneficiaries.')
  )
  blocks.push(
    clause('5.2', [
      `The Trustee may, but is not required to, and only in the Trustee’s discretion, `,
      { text: 'purchase assets from', bold: false },
      ` the Insured’s probate estate or revocable trust at fair market value, and may make loans to the Insured’s estate or revocable trust on commercially reasonable terms, in order to provide liquidity to pay debts, expenses, and taxes. The Trustee shall not be required to make any such purchase or loan, and nothing in this Agreement obligates the Trustee to make trust proceeds available to pay the Insured’s estate obligations.`,
    ])
  )
  blocks.push(
    clause('5.3', [
      `After the Insured’s death, the Trustee shall hold and distribute the remaining trust estate for the benefit of `,
      { text: beneficiaryDescription(ctx), bold: true },
      `.`,
    ])
  )
  if (ctx.distribution.residuary.length > 0) {
    const shareLines: Run[][] = ctx.distribution.residuary.map((b) => [
      `${b.sharePercent}% to ${b.name}${b.isCharity ? ', a charitable organization' : ''}.`,
      {
        text:
          b.ifPredeceased === 'per_stirpes'
            ? ` If ${b.name} does not survive the Insured, that share passes to that beneficiary’s then-living descendants, per stirpes.`
            : ` If ${b.name} does not survive the Insured, that share passes to the other beneficiaries named in this provision, in proportion to their respective shares.`,
        italic: true,
      },
    ])
    blocks.push(clause('5.4', 'The Trustee shall divide and distribute the trust estate as follows:'))
    blocks.push({ kind: 'list', ordered: false, items: shareLines })
  }
  blocks.push(
    clause(ctx.distribution.residuary.length > 0 ? '5.5' : '5.4', [
      `A share directed to a beneficiary who has not reached the age or condition for outright distribution shall be held in a separate trust for that beneficiary under the discretionary (HEMS) standard, and on that beneficiary’s death before full distribution shall pass `,
      remainderPhrase(ctx),
      `.`,
    ])
  )

  // Article VI — Trustees
  blocks.push(article('VI', 'Trustees'))
  blocks.push(
    clause('6.1', [
      { text: 'No Trustee shall be the Grantor. ', bold: true },
      'The Grantor shall not serve as Trustee and shall hold no power over the trust, so that the Grantor retains no incident of ownership in any policy.',
    ])
  )
  blocks.push(clause('6.2', successionSentence('Trustee of this trust', trustees, 'the')))
  blocks.push(clause('6.3', bondClause(ctx)))
  blocks.push(
    clause('6.4', 'A Trustee who is also a beneficiary may not participate in decisions regarding discretionary distributions to that Trustee except under an ascertainable (HEMS) standard, and may not exercise or participate in the exercise of that Trustee’s own withdrawal right in a fiduciary capacity.')
  )
  if (trustees.length === 0) {
    flags.push(
      flag('NO_TRUSTEE', 'warning', 'No trustee was named for the ILIT, and the grantor may not serve. A non-grantor trustee is required.', 'Fla. Stat. 736.0704; I.R.C. 2042')
    )
  }

  // Article VII — Fiduciary powers
  blocks.push(article('VII', 'Trustee Powers'))
  blocks.push(...fiduciaryPowersClauses(ctx, { includeTrustPowers: true }))

  // Article VIII — General provisions
  blocks.push(article('VIII', 'General Provisions'))
  blocks.push(clause(undefined, 'Governing law. This Agreement shall be governed by and construed under the laws of the State of Florida, and this is a Florida trust for all purposes.'))
  blocks.push(
    clause(undefined, 'Spendthrift. To the fullest extent permitted by Section 736.0502, Florida Statutes, no beneficiary (other than as to a current withdrawal right) may assign or encumber any interest in this trust, and no such interest shall be subject to the claims of creditors or to legal process.')
  )
  blocks.push(
    clause(undefined, 'No estate obligations. Except as the Trustee elects under Article V, the Grantor directs that no proceeds of this trust be used to pay the debts, expenses, or taxes of the Grantor’s estate, and no such proceeds shall be so applied by direction of the Grantor.')
  )
  blocks.push(
    clause(undefined, 'Perpetuities. Every trust created under this Agreement shall terminate no later than the period allowed under Section 689.225, Florida Statutes.')
  )
  blocks.push(clause(undefined, 'Severability. The invalidity of any provision shall not affect the remaining provisions of this Agreement.'))

  // Execution
  blocks.push(spacer(1))
  blocks.push(para([{ text: 'IN WITNESS WHEREOF, ', bold: true }, 'the Grantor and the Trustee have executed this Agreement on the date written below.']))
  blocks.push({
    kind: 'signatureBlock',
    lines: [
      { role: 'Grantor', name: grantor, withDate: true, caption: `${grantor}, Grantor` },
      { role: 'Trustee', withDate: true, caption: 'Trustee (must not be the Grantor)' },
    ],
  })
  blocks.push(
    para('Signed by the Grantor in our presence, and by us in the presence of the Grantor and of each other, as witnesses.')
  )
  blocks.push({
    kind: 'signatureBlock',
    lines: [
      { role: 'Witness', caption: 'Signature / Printed name' },
      { role: 'Witness', caption: 'Signature / Printed name' },
    ],
  })
  blocks.push({
    kind: 'notaryBlock',
    text: [
      [{ text: 'STATE OF FLORIDA', bold: true }, '  COUNTY OF ' + (ctx.testator.county?.toUpperCase() || '____________')],
      [
        `Sworn to and subscribed before me by means of ☐ physical presence or ☐ online notarization by `,
        { text: grantor, bold: true },
        `, as Grantor, and by the Trustee and the witnesses, on ______________, 20___, who are personally known to me or produced ____________________ as identification.`,
      ],
    ],
  })
  blocks.push({ kind: 'signatureBlock', lines: [{ role: 'Notary Public, State of Florida', caption: 'My commission expires: __________' }] })

  // Schedule A
  blocks.push({ kind: 'pageBreak' })
  blocks.push({ kind: 'heading', level: 1, text: 'Schedule A — Insurance Policies and Initial Property' })
  blocks.push(para('The Trustee shall own or apply for the following policies. Complete the policy numbers and confirm ownership is transferred to or originated in the Trustee.'))
  blocks.push(...scheduleARows(ctx))
  blocks.push({ kind: 'fillIn', label: 'Policy numbers and insurers', note: 'Enter each policy number and confirm the Trustee is the owner and beneficiary of record.' })

  // Flags
  flags.push(
    flag(
      'THREE_YEAR_RULE',
      'caution',
      'If an existing policy is transferred (gifted) to this trust rather than the trust applying for a new policy, the proceeds are pulled back into the insured’s gross estate if the insured dies within three years of the transfer. Consider having the trust apply for a new policy, or advise the client of the three-year look-back.',
      'I.R.C. 2035(a)'
    )
  )
  flags.push(
    flag(
      'CRUMMEY_NOTICE',
      'caution',
      'The annual-exclusion treatment of contributions depends on giving proper Crummey withdrawal notices and honoring the withdrawal period. Confirm the trustee will send written notices for each contribution and keep records; failure to do so can cause gift-tax and inclusion problems.',
      'Crummey v. Commissioner, 397 F.2d 82 (9th Cir. 1968); I.R.C. 2503(b)'
    )
  )
  if (onlyNomineeIsGrantor) {
    flags.push(
      flag(
        'TRUSTEE_IS_GRANTOR',
        'warning',
        'The only trustee nominated is the grantor. The grantor must NOT serve as trustee of an ILIT — doing so is an incident of ownership that pulls the proceeds into the grantor’s taxable estate. Name an independent, non-grantor trustee.',
        'I.R.C. 2042(2); Treas. Reg. 20.2042-1(c)'
      )
    )
  }

  return {
    type: 'IRREVOCABLE_LIFE_INSURANCE_TRUST',
    title: `${tName} Agreement`,
    meta: { jurisdiction: 'FL', engineVersion: ENGINE_VERSION, generator: 'ilit' },
    blocks,
    flags,
    execution: irrevocableTrustExecution(),
  }
}
