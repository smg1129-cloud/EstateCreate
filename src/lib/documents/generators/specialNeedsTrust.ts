// Third-Party Supplemental (Special) Needs Trust (Florida). Established and
// funded by the client (the Grantor) for the benefit of a person with a
// disability, so that the trust assets SUPPLEMENT — never supplant — the
// beneficiary's needs-based public benefits (SSI, Medicaid). Because the trust
// holds the Grantor's property and never the beneficiary's own assets, it is a
// third-party trust: distributions are purely discretionary, the beneficiary
// can never compel a distribution, and there is NO Medicaid payback on the
// beneficiary's death. (A trust funded with the beneficiary's own assets would
// instead have to be a self-settled (d)(4)(A) payback trust.)

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
import {
  ENGINE_VERSION,
  bondClause,
  fullName,
  residence,
  successionSentence,
  trustExecution,
} from './shared'
import { fiduciaryPowersClauses } from './commonEstate'

export function generateSpecialNeedsTrust(ctx: IntakeContext): DocumentModel {
  const blocks: Block[] = []
  const flags: ReviewFlag[] = []
  const grantor = fullName(ctx)
  const sn = ctx.specialNeeds
  const beneficiary = sn?.beneficiaryName?.trim() || '[BENEFICIARY NAME]'
  const trustLabel = `The ${beneficiary} Supplemental Needs Trust`

  blocks.push(title('Third-Party Supplemental Needs Trust', `for the benefit of ${beneficiary}`))
  blocks.push(spacer(1))
  blocks.push(
    para([
      `This Supplemental Needs Trust Agreement is made by `,
      { text: grantor, bold: true },
      `, of ${residence(ctx)}, as grantor (the "Grantor"), for the benefit of `,
      { text: beneficiary, bold: true },
      ` (the "Beneficiary"). This trust may be referred to as `,
      { text: `${trustLabel} dated ______________, 20___`, bold: true },
      `.`,
    ])
  )

  // Article I — Creation of the trust
  blocks.push(article('I', 'Creation of Trust', 'art-creation'))
  blocks.push(
    clause(
      '1.1',
      'The Grantor transfers to the Trustee the property listed on Schedule A, together with any other property later added to this trust by the Grantor or by any other person, to be held, administered, and distributed as provided in this Agreement. This trust is irrevocable.'
    )
  )
  blocks.push(
    clause('1.2', [
      'This is a ',
      { text: 'third-party', bold: true },
      ' trust. Only property that belongs to the Grantor or to a person other than the Beneficiary may be contributed to this trust. No property that belongs, or ever belonged, to the Beneficiary — and no assets to which the Beneficiary is or was legally entitled — may be added to this trust.',
    ])
  )

  // Article II — Statement of Intent (the heart of an SNT)
  blocks.push(article('II', 'Statement of Intent', 'art-intent'))
  blocks.push(
    clause('2.1', [
      'It is the Grantor’s primary intent that this trust ',
      { text: 'supplement, and not supplant, replace, impair, or diminish', bold: true },
      ', any benefits or assistance of any federal, state, county, municipal, or other governmental entity or program for which the Beneficiary may otherwise be eligible, including without limitation Supplemental Security Income (SSI), Medicaid, and any successor or similar needs-based program.',
    ])
  )
  blocks.push(
    clause(
      '2.2',
      'This trust is intended to provide only for those supplemental and extra care, comfort, and quality-of-life needs of the Beneficiary that are not otherwise provided by public benefits or other resources available to the Beneficiary. It is not intended to be a basic-support trust, and it shall not be construed as a trust the Trustee may be compelled to use for the Beneficiary’s food, shelter, or basic care to the extent doing so would reduce or eliminate the Beneficiary’s public benefits.'
    )
  )
  blocks.push(
    clause(
      '2.3',
      'No part of the income or principal of this trust shall be considered available to the Beneficiary. The Beneficiary shall have no right to compel any distribution of income or principal, no right to direct or control the Trustee, and no vested or enforceable interest in the trust estate. Any provision of this Agreement that would defeat the Grantor’s intent stated in this Article shall be void, and the Trustee is authorized to construe and administer this trust so as to carry out that intent.'
    )
  )
  blocks.push(
    clause(
      '2.4',
      'If any provision of this trust would, if enforced, cause the Beneficiary to be treated as the owner of, or as having available to the Beneficiary, any income or principal of the trust for purposes of eligibility for public benefits, the Trustee shall not be required to comply with that provision, and the Trustee may amend the administrative (but not the dispositive) terms of this trust as necessary to preserve the Beneficiary’s eligibility.'
    )
  )

  // Article III — Discretionary distributions
  blocks.push(article('III', 'Discretionary Distributions During the Beneficiary’s Lifetime', 'art-distributions'))
  blocks.push(
    clause('3.1', [
      'The Trustee ',
      { text: 'may, in the Trustee’s sole and absolute discretion', bold: true },
      ', distribute to or for the benefit of the Beneficiary as much of the net income and principal of the trust as the Trustee determines to be appropriate for the Beneficiary’s supplemental needs. All distributions are wholly discretionary; the Trustee has no duty to make any distribution, and the Beneficiary cannot require the Trustee to do so.',
    ])
  )
  blocks.push(
    clause('3.2', 'Before making any distribution, the Trustee shall consider the public benefits then available or potentially available to the Beneficiary, the effect any distribution may have on those benefits, and any other resources known to the Trustee to be available to the Beneficiary. The Trustee shall not make any distribution that would render the Beneficiary ineligible for, or would reduce, any needs-based public benefit, unless the Trustee determines that the benefit to the Beneficiary of the distribution outweighs the loss of, or reduction in, such benefits.')
  )
  blocks.push(
    clause('3.3', 'By way of illustration and not limitation, supplemental distributions the Trustee may make include payments for:')
  )
  blocks.push({
    kind: 'list',
    ordered: false,
    items: [
      ['education, tutoring, training, and vocational or rehabilitative programs;'],
      ['recreation, hobbies, entertainment, cultural experiences, and companionship;'],
      ['travel and vacations, including the reasonable expenses of a companion or caregiver;'],
      ['medical, dental, vision, and mental-health care, therapies, and equipment not covered by public benefits or insurance;'],
      ['personal care attendants, care management, and supported-living services beyond those provided by public programs;'],
      ['transportation, including the purchase, maintenance, and insurance of an accessible vehicle;'],
      ['electronics, computers, internet and telephone service, and assistive technology;'],
      ['furniture, furnishings, clothing, and personal effects;'],
      ['professional advocacy, guardianship or trust administration fees, and attorney’s fees incurred on the Beneficiary’s behalf.'],
    ],
  })
  blocks.push(
    clause('3.4', 'The Trustee may make distributions directly to vendors and service providers, to a caregiver or agent for the Beneficiary, or by purchasing goods or services for the Beneficiary, rather than paying cash to the Beneficiary, whenever doing so better preserves the Beneficiary’s public benefits.')
  )

  // Article IV — Spendthrift
  blocks.push(article('IV', 'Spendthrift Provision', 'art-spendthrift'))
  blocks.push(
    clause(
      undefined,
      'To the fullest extent permitted by Section 736.0502, Florida Statutes, no interest of the Beneficiary in the income or principal of this trust may be voluntarily or involuntarily assigned, transferred, pledged, or encumbered, and no such interest shall be subject to the claims of the Beneficiary’s creditors, to legal or equitable process, to any bankruptcy proceeding, or to any claim for the Beneficiary’s support.'
    )
  )

  // Article V — Trustee
  blocks.push(article('V', 'Trustee', 'art-trustee'))
  if (sn?.trusteeName) {
    blocks.push(
      clause(undefined, [
        `The Grantor appoints `,
        { text: sn.trusteeName, bold: true },
        ` to serve as Trustee of this trust. If that person or entity is unable or unwilling to serve, the successor Trustee shall be as provided below or as the Grantor otherwise directs.`,
      ])
    )
  } else {
    blocks.push(
      clause(
        undefined,
        successionSentence(
          'Trustee of this trust',
          ctx.fiduciaries.trustees.length ? ctx.fiduciaries.trustees : ctx.fiduciaries.personalReps,
          'the'
        )
      )
    )
  }
  blocks.push(
    clause(undefined, 'The Beneficiary shall not serve as Trustee, and no Trustee shall be a person whom the Beneficiary is legally obligated to support. A Trustee may resign by written notice to the successor Trustee and to the Beneficiary or the Beneficiary’s legal representative.')
  )
  blocks.push(clause(undefined, bondClause(ctx)))

  // Article VI — Remainder on the Beneficiary's death (no Medicaid payback)
  blocks.push(article('VI', 'Distribution on the Beneficiary’s Death', 'art-remainder'))
  blocks.push(
    clause(
      '6.1',
      'Because this is a third-party trust funded solely with property that never belonged to the Beneficiary, no part of the remaining trust estate shall be payable to any state Medicaid agency, and this trust is not subject to any Medicaid reimbursement or "payback" requirement.'
    )
  )
  if (sn?.remainderOnDeath) {
    blocks.push(
      clause('6.2', [
        'Upon the death of the Beneficiary, the Trustee shall distribute the remaining trust estate, after payment of the expenses of administration and the Beneficiary’s funeral and burial expenses to the extent not payable from other sources, as follows: ',
        { text: sn.remainderOnDeath, bold: true },
        '.',
      ])
    )
  } else {
    blocks.push(
      clause(
        '6.2',
        'Upon the death of the Beneficiary, the Trustee shall distribute the remaining trust estate, after payment of the expenses of administration and the Beneficiary’s funeral and burial expenses to the extent not payable from other sources, to the Grantor’s then-living descendants, per stirpes; or if none, to the Grantor’s heirs at law determined under the laws of the State of Florida then in effect.'
      )
    )
  }

  // Article VII — Trustee powers
  blocks.push(article('VII', 'Trustee Powers', 'art-powers'))
  blocks.push(...fiduciaryPowersClauses(ctx, { includeTrustPowers: true }))

  // Article VIII — General provisions
  blocks.push(article('VIII', 'General Provisions', 'art-general'))
  blocks.push(clause(undefined, 'Governing law. This Agreement shall be governed by and construed under the laws of the State of Florida, and this is a Florida trust for all purposes.'))
  blocks.push(
    clause(undefined, 'Perpetuities. Notwithstanding any other provision, every trust created under this Agreement shall terminate no later than the period allowed under Section 689.225, Florida Statutes, and any property then held shall be distributed to the persons then entitled to the income.')
  )
  blocks.push(clause(undefined, 'Severability. If any provision of this Agreement is held invalid, that determination shall not affect the remaining provisions, which shall continue in full effect, construed so as to carry out the Grantor’s intent stated in Article II.'))

  // Execution
  blocks.push(spacer(1))
  blocks.push(
    para([
      { text: 'IN WITNESS WHEREOF, ', bold: true },
      `the Grantor has executed this Supplemental Needs Trust Agreement on the date written below.`,
    ])
  )
  blocks.push({
    kind: 'signatureBlock',
    lines: [{ role: 'Grantor', name: grantor, withDate: true, caption: `${grantor}, Grantor` }],
  })
  blocks.push(
    para([
      'Signed by the Grantor in our presence, and by us in the presence of the Grantor and of each other, as witnesses. Because this trust disposes of property at death, it is executed with the formalities of a will.',
    ])
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
        `, as Grantor, and by the witnesses, on ______________, 20___, who are personally known to me or produced ____________________ as identification.`,
      ],
    ],
  })
  blocks.push({ kind: 'signatureBlock', lines: [{ role: 'Notary Public, State of Florida', caption: 'My commission expires: __________' }] })

  // Schedule A — funding
  blocks.push({ kind: 'pageBreak' })
  blocks.push({ kind: 'heading', level: 1, text: 'Schedule A — Initial Trust Property' })
  blocks.push(
    para('The following property, none of which is or was the Beneficiary’s own property, is transferred to the trust upon execution. Additional third-party property may be added at any time.')
  )
  blocks.push({ kind: 'fillIn', label: 'Initial trust property', note: 'Describe assets contributed by the Grantor or other third parties' })

  // --- Attorney review flags ---
  if (!sn?.beneficiaryName?.trim()) {
    flags.push(
      flag(
        'SNT_NO_BENEFICIARY',
        'warning',
        'No special-needs beneficiary name was provided. The document uses "[BENEFICIARY NAME]" as a placeholder — confirm and insert the intended beneficiary.'
      )
    )
  }
  flags.push(
    flag(
      'SNT_THIRD_PARTY_ASSUMED',
      'warning',
      'This instrument is drafted as a THIRD-PARTY supplemental needs trust (no Medicaid payback). Confirm the trust will be funded solely with the Grantor’s or other third parties’ assets. If any of the beneficiary’s own assets (including an inheritance, settlement, or benefits owed to the beneficiary) will fund it, a self-settled (d)(4)(A) payback trust — with a Medicaid reimbursement provision and the sole-benefit and age-under-65 rules — is required instead.',
      '42 U.S.C. 1396p(d)(4)'
    )
  )
  flags.push(
    flag(
      'SNT_SUPPLEMENTAL_INTENT',
      'info',
      'Confirm the discretionary, supplement-not-supplant, and no-compelled-distribution provisions match the beneficiary’s current benefits (SSI vs. Medicaid-only), and consider whether direct cash distributions or in-kind support and maintenance would reduce SSI.',
      'Fla. Stat. 736.0508'
    )
  )
  if (!sn?.trusteeName && ctx.fiduciaries.trustees.length === 0 && ctx.fiduciaries.personalReps.length === 0) {
    flags.push(
      flag(
        'SNT_NO_TRUSTEE',
        'warning',
        'No trustee was named for the supplemental needs trust. A trustee (often a professional or corporate trustee for benefits administration) must be confirmed.',
        'Fla. Stat. 736.0704'
      )
    )
  }

  return {
    type: 'SPECIAL_NEEDS_TRUST',
    title: `${trustLabel}`,
    meta: { jurisdiction: 'FL', engineVersion: ENGINE_VERSION, generator: 'specialNeedsTrust' },
    blocks,
    flags,
    execution: trustExecution(),
  }
}
