// Marital (A/B) trust provisions — a QTIP marital trust under I.R.C. 2056(b)(7)
// paired with a credit-shelter / family (bypass) trust. These are testamentary
// trust provisions meant to be incorporated into the client's will or revocable
// living trust by the reviewing attorney; they are not a standalone funded
// trust. On the first spouse's death the estate divides into (A) a Marital Trust
// that qualifies for the marital deduction and (B) a Credit Shelter Trust funded
// up to the available applicable exclusion, so both exclusions are used and the
// client's own bloodline is protected at the survivor's death.

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
} from '../blocks'
import type { IntakeContext } from '../context'
import { ENGINE_VERSION, bondClause, fullName, residence, successionSentence, trustExecution } from './shared'
import { fiduciaryPowersClauses } from './commonEstate'

function remainderPhrase(ctx: IntakeContext): string {
  return ctx.distribution.ultimateBackstop
    ? `to my then-living descendants, per stirpes; or if I have no then-living descendants, to ${ctx.distribution.ultimateBackstop}`
    : 'to my then-living descendants, per stirpes; or if I have no then-living descendants, to my heirs at law determined under the laws of the State of Florida then in effect'
}

export function generateMaritalTrust(ctx: IntakeContext): DocumentModel {
  const blocks: Block[] = []
  const flags: ReviewFlag[] = []
  const name = fullName(ctx)
  const spouseName = ctx.spouse?.fullName || '[SPOUSE NAME]'
  const hasSpouseName = Boolean(ctx.spouse?.fullName)
  const trustees = ctx.fiduciaries.trustees

  blocks.push(title('Marital and Credit Shelter Trust Provisions', `A/B Trust Provisions for ${name}`))
  blocks.push(spacer(1))
  blocks.push(
    para([
      { text: 'Drafting note. ', bold: true },
      { text: 'These are testamentary trust provisions to be incorporated into the ', italic: true },
      { text: 'will or revocable living trust of ', italic: true },
      { text: name, bold: true },
      {
        text: ' (the "Client"). They are not a standalone, separately funded trust; the reviewing attorney must integrate them into the dispositive instrument, conform article and section numbering, and complete the funding-formula bracket.',
        italic: true,
      },
    ])
  )
  blocks.push(
    para([
      `The Client is a resident of ${residence(ctx)}. The Client's spouse is `,
      { text: spouseName, bold: true },
      ` (the "Surviving Spouse" when the Client dies first).`,
    ])
  )

  if (!hasSpouseName) {
    flags.push(
      flag(
        'NO_SPOUSE_NAME',
        'warning',
        'No spouse name was provided, but a marital/QTIP trust requires a surviving spouse. Confirm the client is married and complete the spouse’s name before use.',
        'I.R.C. 2056(b)(7)'
      )
    )
  }
  if (ctx.spouse && ctx.spouse.isUSCitizen === false) {
    flags.push(
      flag(
        'NONCITIZEN_SPOUSE_QTIP',
        'warning',
        'The spouse is not a U.S. citizen, so an ordinary QTIP marital trust does not qualify for the unlimited marital deduction. Use a Qualified Domestic Trust (QDOT) under I.R.C. 2056A instead of, or in combination with, the Marital Trust below.',
        'I.R.C. 2056(d); 2056A'
      )
    )
  }

  // Article I — Division into the Marital and Credit Shelter Trusts
  blocks.push(article('I', 'Division Upon the Client’s Death'))
  blocks.push(
    clause('1.1', [
      `If the Surviving Spouse survives the Client, the Trustee shall divide the property passing under these provisions into two separate trusts: the `,
      { text: 'Credit Shelter Trust', bold: true },
      ` (also called the Family or Bypass Trust) and the `,
      { text: 'Marital Trust', bold: true },
      `.`,
    ])
  )
  blocks.push(
    clause('1.2', [
      `The Trustee shall allocate to the Credit Shelter Trust the largest amount that can pass free of federal estate tax by reason of the Client's available applicable exclusion amount (after taking into account other dispositions and any prior taxable gifts), and shall allocate the balance of such property to the Marital Trust. `,
      {
        text: '[Attorney to select and insert the funding formula — pecuniary or fractional — and coordinate with any portability (DSUE) election.]',
        italic: true,
      },
    ])
  )
  blocks.push(
    clause('1.3', 'If the Surviving Spouse does not survive the Client, no division is made under these provisions and the property passes as provided in Article IV.')
  )

  // Article II — Marital Trust (QTIP)
  blocks.push(article('II', 'The Marital Trust (QTIP)'))
  blocks.push(
    clause('2.1', 'It is the Client’s intent that the Marital Trust qualify for the federal estate tax marital deduction as qualified terminable interest property. These provisions shall be construed to conform to the requirements of Section 2056(b)(7) of the Internal Revenue Code.')
  )
  blocks.push(
    clause('2.2', 'The Trustee shall pay all of the net income of the Marital Trust to the Surviving Spouse, in convenient installments at least annually, for the Surviving Spouse’s lifetime.')
  )
  blocks.push(
    clause('2.3', 'The Trustee may distribute to the Surviving Spouse as much of the principal of the Marital Trust as the Trustee determines necessary for the Surviving Spouse’s health, education, maintenance, and support in the Surviving Spouse’s accustomed manner of living (the "HEMS" standard).')
  )
  blocks.push(
    clause('2.4', 'During the Surviving Spouse’s lifetime, no person other than the Surviving Spouse shall have any right to receive or use the income or principal of the Marital Trust, and no one shall have the power to appoint any part of the Marital Trust to any person other than the Surviving Spouse.')
  )
  blocks.push(
    clause('2.5', 'The Surviving Spouse may require the Trustee to make any unproductive property of the Marital Trust productive, or to convert it to productive property, within a reasonable time.')
  )
  blocks.push(
    clause('2.6', 'The Client directs the Personal Representative (executor) of the Client’s estate to elect, on the estate tax return, to treat all or a portion of the Marital Trust as qualified terminable interest property under Section 2056(b)(7), to the extent the Personal Representative determines advisable to obtain the marital deduction.')
  )

  // Article III — Credit Shelter Trust
  blocks.push(article('III', 'The Credit Shelter Trust'))
  blocks.push(
    clause('3.1', 'The Credit Shelter Trust is intended to use the Client’s available applicable exclusion amount and to pass free of federal estate tax at both the Client’s death and the Surviving Spouse’s death. It is not intended to qualify for the marital deduction, and no property of the Credit Shelter Trust shall be included in the Surviving Spouse’s gross estate for federal estate tax purposes.')
  )
  const csDescendants = ctx.hasDescendants
  blocks.push(
    clause('3.2', [
      `The Trustee may distribute to or for the benefit of the Surviving Spouse`,
      csDescendants ? `, and to or for the benefit of the Client’s then-living descendants,` : '',
      ` as much of the net income and principal of the Credit Shelter Trust as the Trustee determines necessary for the beneficiary’s health, education, maintenance, and support in the beneficiary’s accustomed manner of living (the "HEMS" standard). The Trustee need not distribute income or principal equally among eligible beneficiaries.`,
    ])
  )
  blocks.push(
    clause('3.3', 'Any net income of the Credit Shelter Trust not distributed shall be added to principal. A Trustee who is also a beneficiary may participate in discretionary distribution decisions only to the extent limited by an ascertainable (HEMS) standard.')
  )

  // Article IV — Disposition on the Surviving Spouse's death
  blocks.push(article('IV', 'Disposition on the Surviving Spouse’s Death'))
  blocks.push(
    clause('4.1', [
      `On the death of the Surviving Spouse, the Trustee shall distribute the remaining principal and any accrued or undistributed income of both the Marital Trust and the Credit Shelter Trust `,
      remainderPhrase(ctx),
      `. It is the Client’s intent to provide for the Surviving Spouse for life while preserving the remainder for the Client’s own descendants.`,
    ])
  )
  blocks.push(
    clause('4.2', 'Before that distribution, the Trustee shall pay from the Marital Trust any federal or state estate tax attributable to the inclusion of the Marital Trust in the Surviving Spouse’s estate, to the extent the Trustee is entitled to recover such tax under Section 2207A of the Internal Revenue Code.')
  )
  blocks.push(
    clause('4.3', 'If a share otherwise passing under this Article would be distributed to a beneficiary who has not reached the age or condition for outright distribution stated in the governing instrument, that share shall instead be held and administered under the continuing-trust provisions of the governing instrument.')
  )

  // Article V — Trustees
  blocks.push(article('V', 'Trustees'))
  blocks.push(
    clause('5.1', successionSentence('Trustee of the Marital Trust and the Credit Shelter Trust', trustees.length ? trustees : ctx.fiduciaries.personalReps, 'the'))
  )
  blocks.push(clause('5.2', bondClause(ctx)))
  if (trustees.length === 0 && ctx.fiduciaries.personalReps.length === 0) {
    flags.push(
      flag('NO_TRUSTEE', 'warning', 'No trustee (or personal representative to fall back on) was named for the marital/credit-shelter trusts. A nominee is required.', 'Fla. Stat. 736.0704')
    )
  }

  // Article VI — Fiduciary powers
  blocks.push(article('VI', 'Trustee Powers'))
  blocks.push(...fiduciaryPowersClauses(ctx, { includeTrustPowers: true }))

  // Article VII — General provisions
  blocks.push(article('VII', 'General Provisions'))
  blocks.push(clause(undefined, 'Governing law. These provisions shall be governed by and construed under the laws of the State of Florida.'))
  blocks.push(
    clause(undefined, 'Tax savings. Any provision that would prevent the Marital Trust from qualifying for the federal estate tax marital deduction, or that would cause the Credit Shelter Trust to be included in the Surviving Spouse’s gross estate, shall be disregarded to the extent necessary to carry out the Client’s intent stated above.')
  )
  blocks.push(
    clause(undefined, 'Spendthrift. To the fullest extent permitted by Section 736.0502, Florida Statutes, no beneficiary may assign or encumber any interest in these trusts, and no such interest shall be subject to the claims of creditors or to legal process.')
  )
  blocks.push(
    clause(undefined, 'Perpetuities. Every trust created under these provisions shall terminate no later than the period allowed under Section 689.225, Florida Statutes.')
  )

  // Execution note
  blocks.push(spacer(1))
  blocks.push(
    para([
      { text: 'Execution. ', bold: true },
      'These provisions take effect as part of the Client’s will or revocable living trust and are executed with that instrument; they are not separately signed.',
    ])
  )

  // Flags
  flags.push(
    flag(
      'INTEGRATE_INTO_INSTRUMENT',
      'info',
      'These marital/credit-shelter provisions are drafted to be incorporated into the client’s will or revocable living trust. The reviewing attorney must integrate them, conform numbering, and confirm they are executed as part of that instrument.',
      'Fla. Stat. 736.0403 (testamentary aspects)'
    )
  )
  flags.push(
    flag(
      'FORMULA_AND_PORTABILITY',
      'caution',
      'Confirm the funding formula (pecuniary vs. fractional) and weigh a credit-shelter trust against relying on portability (DSUE). With the federal applicable exclusion at $15,000,000 per person in 2026, many married clients no longer need an A/B split for federal tax, though a credit-shelter trust still offers creditor protection, remarriage/bloodline protection, and shelter of future appreciation. Confirm this structure fits the client’s net worth and goals.',
      'I.R.C. 2010(c) (portability/DSUE); 2056(b)(7)'
    )
  )

  return {
    type: 'MARITAL_TRUST',
    title: `Marital and Credit Shelter Trust Provisions for ${name}`,
    meta: { jurisdiction: 'FL', engineVersion: ENGINE_VERSION, generator: 'maritalTrust' },
    blocks,
    flags,
    execution: trustExecution(),
  }
}
