// Shared dispositive and administrative provisions used by both the will and
// the revocable trust: the residuary waterfall, the contingent/continuing trust
// for young or protected beneficiaries, and the fiduciary powers article.
//
// Keeping these here means the will's testamentary trust and the living trust's
// continuing trusts speak with one voice, and a change to (say) the HEMS
// standard or the spendthrift clause updates every instrument at once.

import { clause, flag, type Block, type ReviewFlag } from '../blocks'
import type { IntakeContext, ResiduaryBeneficiary } from '../context'
import { lapsePhrase, successionSentence } from './shared'

interface ResOptions {
  articlePrefix: string
  trustArticleNumber: string
  context: 'will' | 'trust'
}

/** "estate" for a will, "trust estate" for a trust — keeps wording natural. */
function corpusWord(context: 'will' | 'trust'): string {
  return context === 'will' ? 'residuary estate' : 'remaining trust estate'
}

function beneficiaryShareText(b: ResiduaryBeneficiary): string {
  const share = b.sharePercent % 1 === 0 ? `${b.sharePercent}%` : `${b.sharePercent}%`
  return `${share} to ${b.name}`
}

export function residuaryDispositionBlocks(
  ctx: IntakeContext,
  opts: ResOptions
): { blocks: Block[]; usesContingentTrust: boolean; flags: ReviewFlag[] } {
  const blocks: Block[] = []
  const flags: ReviewFlag[] = []
  const word = corpusWord(opts.context)
  const inTrust = ctx.distribution.howReceived !== 'outright' || ctx.hasMinorChildren
  let n = 1

  const num = () => `${opts.articlePrefix}.${n++}`

  const spouseFirst = Boolean(ctx.spouse && ctx.testator.maritalStatus === 'married' && ctx.spouse.leaveEverythingFirst)

  if (spouseFirst) {
    blocks.push(
      clause(num(), [
        `If my spouse, `,
        { text: ctx.spouse!.fullName || '[SPOUSE NAME]', bold: true },
        `, survives me, I give my entire ${word} to my spouse, outright and free of trust.`,
      ])
    )
    blocks.push(
      clause(num(), [
        `If my spouse does not survive me, I give my ${word} as provided in the following section.`,
      ])
    )
  }

  // The primary (non-spouse) distribution.
  const heading = spouseFirst
    ? `If my spouse does not survive me, my ${word} shall be distributed as follows:`
    : `I give my ${word} as follows:`

  if (ctx.distribution.residuary.length > 0) {
    blocks.push(clause(num(), heading))
    const shareLines = ctx.distribution.residuary.map((b) => {
      const lapse =
        b.ifPredeceased === 'per_stirpes'
          ? ` If ${b.name} does not survive me, that share shall pass ${lapsePhrase('per_stirpes')}.`
          : ` If ${b.name} does not survive me, that share shall pass ${lapsePhrase('others')}.`
      return [`${beneficiaryShareText(b)}${b.isCharity ? ', a charitable organization' : ''}.`, { text: lapse, italic: false }] as (
        | string
        | { text: string; italic?: boolean }
      )[]
    })
    blocks.push({ kind: 'list', ordered: false, items: shareLines })
  } else if (ctx.hasDescendants) {
    blocks.push(
      clause(num(), [
        `${heading} to my then-living descendants, per stirpes.`,
      ])
    )
  } else {
    blocks.push(
      clause(num(), [
        `${heading} to my heirs at law, determined under the laws of the State of Florida then in effect.`,
      ])
    )
    flags.push(
      flag(
        'RESIDUE_TO_HEIRS',
        'caution',
        'No residuary beneficiaries and no descendants were provided, so the residue defaults to heirs at law. Confirm this is intended.'
      )
    )
  }

  // Held-in-trust instruction.
  if (inTrust) {
    blocks.push(
      clause(num(), [
        `Notwithstanding the foregoing, the share of any beneficiary who is then under the age of ${trustEndAge(
          ctx
        )} years${
          ctx.distribution.howReceived === 'lifetime_trust' ? ', or any share directed to be held for life,' : ''
        } shall not be distributed outright but shall instead be held, administered, and distributed in trust as provided in Article ${
          opts.trustArticleNumber
        }.`,
      ])
    )
  }

  // Ultimate backstop.
  if (ctx.distribution.ultimateBackstop) {
    blocks.push(
      clause(num(), [
        `If at any time there is no beneficiary otherwise entitled to receive my ${word} under this instrument, I give the same to `,
        { text: ctx.distribution.ultimateBackstop, bold: true },
        `.`,
      ])
    )
  }

  return { blocks, usesContingentTrust: inTrust, flags }
}

function trustEndAge(ctx: IntakeContext): number {
  if (ctx.distribution.howReceived === 'staggered' && ctx.distribution.stagedAges.length) {
    return Math.max(...ctx.distribution.stagedAges)
  }
  if (ctx.distribution.howReceived === 'lifetime_trust') return 999
  return 25
}

/** The continuing/contingent trust that holds shares for young or protected
 * beneficiaries. `article` is the roman/label used in headings. */
export function contingentTrustArticle(ctx: IntakeContext, articleLabel: string): Block[] {
  const blocks: Block[] = []
  blocks.push({ kind: 'article', number: articleLabel, title: 'Trust for Beneficiaries', ref: 'art-trust' })

  // Trustee nomination
  blocks.push(clause(undefined, successionSentence('Trustee of any trust created under this instrument', ctx.fiduciaries.trustees.length ? ctx.fiduciaries.trustees : ctx.fiduciaries.personalReps, 'the')))

  const standard =
    ctx.distribution.trusteeStandard === 'broad'
      ? 'The Trustee may distribute to or for the benefit of the beneficiary as much of the net income and principal of the trust as the Trustee, in the Trustee’s sole and absolute discretion, determines to be in the beneficiary’s best interests.'
      : 'The Trustee may distribute to or for the benefit of the beneficiary as much of the net income and principal of the trust as the Trustee determines necessary or advisable for the beneficiary’s health, education, maintenance, and support in the beneficiary’s accustomed manner of living (the "HEMS" standard).'

  // Pot vs separate for minors
  if (ctx.hasMinorChildren && ctx.distribution.minorPot === 'pot') {
    blocks.push(
      clause(undefined, [
        `Common trust. Until the youngest of my then-living children reaches the age of ${Math.min(
          ...(ctx.distribution.stagedAges.length ? ctx.distribution.stagedAges : [23])
        )} years, the Trustee shall hold all shares directed to be held in trust as a single common trust for my children. ${standard} The Trustee need not distribute equally and shall not be required to equalize distributions later. When the youngest child reaches that age, the Trustee shall divide the remaining trust into equal separate shares, one for each then-living child and one for the then-living descendants, collectively, of any deceased child, per stirpes.`,
      ])
    )
  } else {
    blocks.push(clause(undefined, [`Separate shares. The Trustee shall hold each beneficiary’s share as a separate trust. `, standard]))
  }

  // Distribution timing
  if (ctx.distribution.howReceived === 'staggered' && ctx.distribution.stagedAges.length) {
    const ages = ctx.distribution.stagedAges.sort((a, b) => a - b)
    const fractions = fractionSchedule(ages.length)
    const lines = ages.map((age, i) => `Upon reaching age ${age}: ${fractions[i]} of the then-remaining principal.`)
    blocks.push(clause(undefined, `Distribution schedule. The Trustee shall distribute principal to each beneficiary as follows, in addition to any discretionary distributions:`))
    blocks.push({ kind: 'list', ordered: false, items: lines.map((l) => [l]) })
    blocks.push(clause(undefined, `Until fully distributed, the Trustee shall continue to administer the trust and may make discretionary distributions under the standard stated above.`))
  } else if (ctx.distribution.howReceived === 'lifetime_trust') {
    blocks.push(
      clause(undefined, [
        `Lifetime trust. The Trustee shall hold each beneficiary’s share in trust for the beneficiary’s lifetime, making discretionary distributions under the standard stated above.`,
        ctx.distribution.divorceProtection
          ? ' A beneficiary who has reached age thirty-five (35) may serve as sole Trustee of the beneficiary’s own trust, exercising discretionary distributions to the beneficiary only under the HEMS standard.'
          : '',
      ])
    )
  } else {
    blocks.push(
      clause(undefined, `Distribution. The Trustee shall hold each beneficiary’s share until the beneficiary reaches the age of majority or such later age as stated in this instrument, and shall then distribute the remaining principal to the beneficiary, subject to the discretionary standard above.`)
    )
  }

  // Remainder on death of a beneficiary
  blocks.push(
    clause(undefined, [
      `Death of a beneficiary. If a beneficiary dies before full distribution of the beneficiary’s trust, the remaining trust shall be distributed to the beneficiary’s then-living descendants, per stirpes; or if none, ${lapsePhrase(
        ctx.deceasedChildShare
      )}; or if none, to my then-living descendants, per stirpes.`,
    ])
  )

  // Spendthrift + divorce protection
  blocks.push(
    clause(undefined, [
      `Spendthrift. No beneficiary may assign, pledge, or encumber any interest in a trust created under this instrument, and no such interest shall be subject to the claims of any beneficiary’s creditors, to legal process, or to any bankruptcy proceeding, to the fullest extent permitted by Section 736.0502, Florida Statutes.`,
      ctx.distribution.divorceProtection
        ? ' It is my intent that no interest in any trust be treated as marital property or be subject to equitable distribution in any beneficiary’s dissolution of marriage.'
        : '',
    ])
  )

  // Power of appointment over the remainder (from dist.remainderPOA).
  if (ctx.distribution.remainderPOA === 'limited') {
    blocks.push(
      clause(undefined, 'Limited power of appointment. Each beneficiary may, by a will or trust that expressly refers to this power, appoint the balance of the beneficiary’s trust among my descendants and one or more charitable organizations. To the extent the power is not effectively exercised, the balance passes as provided above.')
    )
  } else if (ctx.distribution.remainderPOA === 'broad') {
    blocks.push(
      clause(undefined, 'General power of appointment. Each beneficiary may, by a will or trust that expressly refers to this power, appoint the balance of the beneficiary’s trust to any person or entity, including the beneficiary’s own estate. To the extent the power is not effectively exercised, the balance passes as provided above.')
    )
  }

  // Trust protector (from dist.trustProtector).
  if (ctx.distribution.trustProtector) {
    const protectorName = ctx.distribution.trustProtectorName
    blocks.push(
      clause(undefined, [
        `Trust protector. I appoint `,
        protectorName ? { text: protectorName, bold: true } : { text: '[trust protector — attorney to confirm]', italic: true },
        ` to serve as trust protector. The trust protector, acting in a fiduciary capacity and by signed writing, may: (a) remove and replace any Trustee and appoint successor Trustees; (b) amend the administrative (but not the dispositive) provisions of any trust to correct drafting errors or to conform to changes in the law; and (c) change the trust’s situs and governing law. The trust protector is not required to account and may resign by written notice.`,
      ])
    )
  }

  // Small trust / trustee-as-beneficiary limits
  blocks.push(
    clause(undefined, `If at any time a trust becomes uneconomical to administer, the Trustee may terminate it and distribute the remaining assets to the beneficiary for whom it is held. Any Trustee who is also a beneficiary may not participate in decisions to distribute to that Trustee except under an ascertainable (HEMS) standard.${
      ctx.distribution.beneficiaryMayBeTrustee
        ? ' Upon reaching the age of thirty-five (35) years, a beneficiary may serve as a Trustee of the beneficiary’s own trust, subject to the foregoing limitation.'
        : ''
    }`)
  )

  return blocks
}

function fractionSchedule(n: number): string[] {
  // Distribute in escalating fractions of the then-remaining principal so the
  // final tranche is the entire balance (classic "1/3, 1/2, all").
  if (n <= 0) return []
  const out: string[] = []
  for (let i = 0; i < n; i++) {
    const remaining = n - i
    out.push(remaining === 1 ? 'the balance' : `one-${ordinalDen(remaining)}`)
  }
  return out
}

function ordinalDen(d: number): string {
  const map: Record<number, string> = { 2: 'half', 3: 'third', 4: 'fourth', 5: 'fifth' }
  return map[d] ?? `${d}th`
}

interface PowerOptions {
  includeTrustPowers: boolean
}

export function fiduciaryPowersClauses(ctx: IntakeContext, opts: PowerOptions): Block[] {
  const blocks: Block[] = []
  blocks.push(
    clause(
      undefined,
      'In addition to all powers granted by law, and subject to fiduciary duty, my Personal Representative and any Trustee shall have the following powers, exercisable without court authorization:'
    )
  )
  const powers: string[] = [
    'To retain any asset I owned at death without liability for loss or lack of diversification, and to invest and reinvest in any kind of property under the Florida Prudent Investor Rule.',
    'To sell, exchange, lease, mortgage, or otherwise dispose of any estate or trust property, at public or private sale, on such terms as the fiduciary deems advisable.',
    'To borrow money and pledge assets as security; to continue, operate, or wind up any business interest.',
    'To pay, compromise, contest, or settle claims for or against the estate or trust.',
    'To make distributions in cash or in kind, or partly in each, and to allocate different assets or undivided interests among beneficiaries without requiring pro rata distribution.',
    'To employ attorneys, accountants, investment advisors, and other agents, and to pay their reasonable compensation from the estate or trust.',
    'To hold property in the name of a nominee, and to divide or consolidate trusts.',
  ]
  if (opts.includeTrustPowers) {
    powers.push(
      'To make discretionary distributions to or for the benefit of a beneficiary directly, to a guardian or custodian, or by direct payment of the beneficiary’s expenses.',
      'To create and administer separate shares and to make elections and allocations under the Internal Revenue Code, including the generation-skipping transfer tax exemption, as the Trustee deems advisable.'
    )
  }
  if (ctx.assets.ownsBusiness) {
    powers.push('To vote, sell, or retain any closely held business interest, and to enter into or perform any buy-sell or shareholder agreement affecting it.')
  }
  blocks.push({ kind: 'list', ordered: true, items: powers.map((p) => [p]) })
  return blocks
}

/** Non-binding disposition-of-remains / funeral wishes clause built from the
 * client's final-arrangements answers. Returns null when nothing was provided.
 * In Florida these wishes guide, but do not bind, the person with authority
 * over the remains (Fla. Stat. 497.005). */
export function dispositionOfRemainsClause(ctx: IntakeContext): Block | null {
  const fa = ctx.finalArrangements
  const hasAny = (fa.disposition && fa.disposition !== 'undecided') || fa.location || fa.agent || fa.instructions
  if (!hasAny) return null

  const dispositionWord: Record<string, string> = {
    burial: 'that my remains be buried',
    cremation: 'that my remains be cremated',
    donation: 'that my body be donated to medical science or an accredited institution',
    undecided: '',
  }
  const parts: string[] = ['Disposition of remains. It is my wish, though not a binding direction, ']
  const pieces: string[] = []
  if (fa.disposition && dispositionWord[fa.disposition]) pieces.push(dispositionWord[fa.disposition]!)
  if (fa.location) pieces.push(`at or in ${fa.location}`)
  const sentence = pieces.length ? parts[0]! + pieces.join(', ') + '.' : parts[0]! + 'that my remains be handled as my family and personal representative determine.'
  const runs = [sentence]
  if (fa.agent) runs.push(` I request that ${fa.agent} have the authority to direct the disposition of my remains and my funeral arrangements.`)
  if (fa.instructions) runs.push(` Additional wishes: ${fa.instructions}`)
  return clause(undefined, runs)
}
