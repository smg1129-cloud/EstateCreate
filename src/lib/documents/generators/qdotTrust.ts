// Qualified Domestic Trust (QDOT) provisions under I.R.C. 2056A. When the
// surviving spouse is not a U.S. citizen, the unlimited marital deduction is
// denied unless the marital property passes to a QDOT. These are testamentary
// trust provisions to be incorporated into the client's will or revocable living
// trust by the reviewing attorney; they are not a standalone funded trust. The
// defining feature is the "U.S. Trustee" (a U.S. citizen or domestic
// corporation) with the power to withhold the deferred estate tax on
// distributions of principal.

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

export function generateQdotTrust(ctx: IntakeContext): DocumentModel {
  const blocks: Block[] = []
  const flags: ReviewFlag[] = []
  const name = fullName(ctx)
  const spouseName = ctx.spouse?.fullName || '[SPOUSE NAME]'
  const hasSpouseName = Boolean(ctx.spouse?.fullName)
  const trustees = ctx.fiduciaries.trustees

  blocks.push(title('Qualified Domestic Trust (QDOT) Provisions', `QDOT Provisions for ${name}`))
  blocks.push(spacer(1))
  blocks.push(
    para([
      { text: 'Drafting note. ', bold: true },
      { text: 'These are testamentary trust provisions to be incorporated into the will or revocable living trust of ', italic: true },
      { text: name, bold: true },
      {
        text: ' (the "Client"). They are not a standalone, separately funded trust. The reviewing attorney must integrate them into the dispositive instrument, conform numbering, and coordinate the QDOT with the marital deduction and any Marital/Credit Shelter division.',
        italic: true,
      },
    ])
  )
  blocks.push(
    para([
      `The Client is a resident of ${residence(ctx)}. The Client's spouse is `,
      { text: spouseName, bold: true },
      ` (the "Surviving Spouse"), who is not a citizen of the United States. Property passing to or for the Surviving Spouse under these provisions is held in a Qualified Domestic Trust ("QDOT") intended to qualify for the federal estate tax marital deduction under Section 2056A of the Internal Revenue Code.`,
    ])
  )

  if (!hasSpouseName) {
    flags.push(
      flag(
        'NO_SPOUSE_NAME',
        'warning',
        'No spouse name was provided. A QDOT presupposes a surviving non-citizen spouse; confirm the client is married to a non-citizen spouse and complete the spouse’s name.',
        'I.R.C. 2056A'
      )
    )
  }
  if (ctx.spouse && ctx.spouse.isUSCitizen === true) {
    flags.push(
      flag(
        'SPOUSE_IS_CITIZEN',
        'caution',
        'The intake indicates the spouse is a U.S. citizen. A QDOT is unnecessary for a citizen spouse; confirm citizenship status before using these provisions (or use an ordinary marital/QTIP trust instead).',
        'I.R.C. 2056(d)'
      )
    )
  }

  // Article I — Purpose and QDOT qualification
  blocks.push(article('I', 'Purpose; QDOT Qualification'))
  blocks.push(
    clause('1.1', 'It is the Client’s intent that this trust qualify at all times as a Qualified Domestic Trust under Section 2056A of the Internal Revenue Code and the Treasury Regulations thereunder. These provisions shall be construed, and the Trustee shall administer the trust, to satisfy those requirements. Any provision inconsistent with QDOT qualification shall be disregarded to the extent necessary.')
  )
  blocks.push(
    clause('1.2', 'The Client directs the Personal Representative (executor) of the Client’s estate to make the election under Section 2056A(d) to treat this trust as a Qualified Domestic Trust on the federal estate tax return, and to take all steps necessary to perfect and maintain that election.')
  )

  // Article II — The U.S. Trustee requirement
  blocks.push(article('II', 'United States Trustee'))
  blocks.push(
    clause('2.1', 'At all times at least one Trustee of this trust shall be an individual who is a citizen of the United States or a domestic corporation authorized to act as a fiduciary (the "U.S. Trustee"). No act of the trust that would cause it to fail the QDOT requirements shall be valid.')
  )
  blocks.push(
    clause('2.2', 'No distribution of principal from this trust (other than a distribution described in Section 2056A(b)(3) on account of hardship, or as otherwise permitted by the Treasury Regulations) may be made unless the U.S. Trustee has the right to withhold from the distribution the additional estate tax imposed under Section 2056A(b) on that distribution, and the U.S. Trustee shall withhold and remit that tax as required.')
  )
  const usTrustee = trustees.find((t) => t.isUSCitizen === true)
  if (usTrustee) {
    blocks.push(
      clause('2.3', [
        `The U.S. Trustee shall be `,
        { text: usTrustee.fullName, bold: true },
        `, who the Grantor represents is a citizen of the United States. If that individual ceases to serve, at least one successor Trustee who is a U.S. citizen or a domestic corporation authorized to act as a fiduciary must at all times be serving.`,
      ])
    )
  } else {
    blocks.push(
      clause('2.3', [
        `The U.S. Trustee shall be `,
        { text: '[NAME OF U.S.-CITIZEN INDIVIDUAL OR DOMESTIC CORPORATE TRUSTEE — attorney to confirm]', italic: true },
        `. None of the trustees named below was confirmed to be a U.S. citizen, so the attorney must designate a qualifying U.S. Trustee before execution.`,
      ])
    )
    blocks.push({
      kind: 'fillIn',
      label: 'U.S. Trustee (U.S. citizen or domestic corporation)',
      note: 'Required by I.R.C. 2056A(a)(1). No nominated trustee was marked as a U.S. citizen in the intake.',
    })
  }

  // Article III — Income and principal
  blocks.push(article('III', 'Distributions'))
  blocks.push(
    clause('3.1', 'The Trustee shall pay all of the net income of the trust to the Surviving Spouse, in convenient installments at least annually, for the Surviving Spouse’s lifetime. The Surviving Spouse shall have the right to compel the Trustee to make unproductive property productive within a reasonable time.')
  )
  blocks.push(
    clause('3.2', 'The Trustee may distribute principal to the Surviving Spouse subject to the withholding requirement of Article II. The Trustee may consider hardship distributions as permitted by Section 2056A(b)(3) and the Treasury Regulations.')
  )
  blocks.push(
    clause('3.3', 'During the Surviving Spouse’s lifetime, no person other than the Surviving Spouse shall have any right to receive income or principal of this trust.')
  )

  // Article IV — Security and administration
  blocks.push(article('IV', 'Security; Administration'))
  blocks.push(
    clause('4.1', [
      `If the fair market value of the trust assets exceeds the threshold in the Treasury Regulations (generally $2,000,000, determined as provided in the Regulations), the Trustee shall satisfy the security arrangements required under Treasury Regulation Section 20.2056A-2 — for example, requiring a U.S. bank as trustee, a bond, or a letter of credit — to secure the deferred estate tax. `,
      { text: '[Attorney to confirm current threshold and select the security arrangement.]', italic: true },
    ])
  )
  blocks.push(
    clause('4.2', 'The Trustee shall file all returns and information reports required of a QDOT and shall furnish the Surviving Spouse and the Internal Revenue Service with any statements required by the Treasury Regulations.')
  )

  // Article V — Termination and disposition
  blocks.push(article('V', 'Termination; Disposition of Remainder'))
  blocks.push(
    clause('5.1', 'If the Surviving Spouse becomes a citizen of the United States, and the conditions of Section 2056A(b)(12) are satisfied (including that the Surviving Spouse was a U.S. resident at all times after the Client’s death or that no taxable distributions were made, as applicable), the QDOT restrictions of Article II shall cease to apply and the trust shall thereafter be administered free of those restrictions.')
  )
  blocks.push(
    clause('5.2', [
      `On the death of the Surviving Spouse, the Trustee shall first pay the additional estate tax then due under Section 2056A(b), and shall distribute the remaining principal and any accrued or undistributed income `,
      remainderPhrase(ctx),
      `.`,
    ])
  )
  blocks.push(
    clause('5.3', 'If a share otherwise passing under this Article would go to a beneficiary who has not reached the age or condition for outright distribution stated in the governing instrument, that share shall instead be held and administered under the continuing-trust provisions of the governing instrument.')
  )

  // Article VI — Trustees
  blocks.push(article('VI', 'Trustees'))
  blocks.push(
    clause('6.1', successionSentence('Trustee of this Qualified Domestic Trust (subject to the U.S. Trustee requirement of Article II)', trustees.length ? trustees : ctx.fiduciaries.personalReps, 'the'))
  )
  blocks.push(clause('6.2', bondClause(ctx)))
  if (trustees.length === 0 && ctx.fiduciaries.personalReps.length === 0) {
    flags.push(
      flag('NO_TRUSTEE', 'warning', 'No trustee (or personal representative to fall back on) was named for the QDOT. A qualifying trustee is required.', 'Fla. Stat. 736.0704')
    )
  }

  // Article VII — Fiduciary powers
  blocks.push(article('VII', 'Trustee Powers'))
  blocks.push(...fiduciaryPowersClauses(ctx, { includeTrustPowers: true }))

  // Article VIII — General provisions
  blocks.push(article('VIII', 'General Provisions'))
  blocks.push(clause(undefined, 'Governing law. These provisions shall be governed by and construed under the laws of the State of Florida.'))
  blocks.push(
    clause(undefined, 'Spendthrift. To the fullest extent permitted by Section 736.0502, Florida Statutes, no beneficiary may assign or encumber any interest in this trust, and no such interest shall be subject to the claims of creditors or to legal process, except as required to satisfy the estate tax under Section 2056A.')
  )
  blocks.push(
    clause(undefined, 'Perpetuities. This trust shall terminate no later than the period allowed under Section 689.225, Florida Statutes.')
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
    usTrustee
      ? flag(
          'US_TRUSTEE_CONFIRM',
          'caution',
          `Trustee "${usTrustee.fullName}" was marked a U.S. citizen and is designated the U.S. Trustee. Confirm citizenship and that this trustee holds the power to withhold the deferred estate tax on principal distributions.`,
          'I.R.C. 2056A(a)(1); Treas. Reg. 20.2056A-2'
        )
      : flag(
          'US_TRUSTEE_REQUIRED',
          'warning',
          'A QDOT MUST have at least one trustee that is a U.S. citizen or a domestic corporation authorized to act as a fiduciary, with the power to withhold the deferred estate tax on principal distributions. No nominated trustee was marked as a U.S. citizen — designate a qualifying U.S. Trustee before execution.',
          'I.R.C. 2056A(a)(1); Treas. Reg. 20.2056A-2'
        )
  )
  flags.push(
    flag(
      'INTEGRATE_INTO_INSTRUMENT',
      'info',
      'These QDOT provisions are drafted to be incorporated into the client’s will or revocable living trust and must be coordinated with the marital deduction and any Marital/Credit Shelter division. The reviewing attorney must integrate them, conform numbering, and confirm the executor makes the QDOT election.',
      'I.R.C. 2056A; 2056(d)'
    )
  )

  return {
    type: 'QDOT_TRUST',
    title: `Qualified Domestic Trust Provisions for ${name}`,
    meta: { jurisdiction: 'FL', engineVersion: ENGINE_VERSION, generator: 'qdotTrust' },
    blocks,
    flags,
    execution: trustExecution(),
  }
}
