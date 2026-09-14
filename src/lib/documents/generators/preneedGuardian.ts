// Declaration of Preneed Guardian (Florida). A written declaration by which a
// competent adult names, in advance, the guardian who is to serve if the
// declarant is later determined to be incapacitated (Fla. Stat. 744.3045) and,
// when the client has minor children, the guardian who is to serve for those
// children on the death or incapacity of the last surviving parent
// (Fla. Stat. 744.3046). The declaration is filed with the clerk of the circuit
// court, and the named guardian is entitled to serve unless disqualified.

import {
  article,
  clause,
  flag,
  para,
  spacer,
  title,
  type Block,
  type DocumentModel,
  type ExecutionRequirement,
  type ReviewFlag,
} from '../blocks'
import type { IntakeContext } from '../context'
import { ENGINE_VERSION, fullName, residence, successionSentence } from './shared'

const preneedExecution: ExecutionRequirement = {
  witnesses: 2,
  notaryRequired: true,
  authority: 'Fla. Stat. 744.3045',
  steps: [
    'The declarant signs this written declaration in the presence of at least two attesting witnesses, both present at the same time.',
    'Each witness signs in the presence of the declarant and of the other witness.',
    'Although the statute requires only two witnesses, a notary acknowledgment is added and recommended so the declaration can be relied upon and, if desired, executed by remote online notarization.',
    'File the executed declaration with the clerk of the circuit court. On a petition alleging the declarant’s incapacity — or, for the declaration for minor children, on the death or incapacity of the last surviving parent — the clerk produces it to the court.',
  ],
}

export function generatePreneedGuardian(ctx: IntakeContext): DocumentModel {
  const blocks: Block[] = []
  const flags: ReviewFlag[] = []
  const name = fullName(ctx)

  // For the client's own preneed guardian, the POA agents (already vetted to
  // manage the client's affairs) are the best nominee source, falling back to
  // the personal representatives.
  const ownGuardians = ctx.fiduciaries.poaAgents.length
    ? ctx.fiduciaries.poaAgents
    : ctx.fiduciaries.personalReps

  blocks.push(title('Declaration of Preneed Guardian', `of ${name}`))
  blocks.push(spacer(1))
  blocks.push(
    para([
      `I, `,
      { text: name, bold: true },
      `, a competent adult resident of ${residence(ctx)}, make this Declaration of Preneed Guardian under Chapter 744, Florida Statutes, to name in advance the person or persons I wish to serve as guardian, so that my choice is known and honored.`,
    ])
  )

  // Article I — Preneed guardian for the declarant (744.3045)
  blocks.push(article('I', 'Preneed Guardian for Myself', 'art-self'))
  blocks.push(
    clause('1.1', [
      'In the event a court determines that I am incapacitated and that a guardian of my person or property must be appointed, I declare and designate the following person or persons to serve as my guardian, in the order named. ',
      ...successionSentence('guardian of my person and property', ownGuardians, 'my'),
    ])
  )
  blocks.push(
    clause(
      '1.2',
      'This declaration is made under Section 744.3045, Florida Statutes. Upon the filing of a petition alleging my incapacity, the person designated above becomes my guardian, subject to confirmation by the court, and is entitled to serve as my guardian unless the court determines that the designated person is disqualified or that appointing the designated person is contrary to my best interests.'
    )
  )
  blocks.push(
    clause(
      '1.3',
      'I direct that this declaration be filed with the clerk of the circuit court and produced to the court in any proceeding concerning my capacity or the appointment of a guardian for me.'
    )
  )
  if (ownGuardians.length === 0) {
    flags.push(
      flag(
        'PRENEED_NO_SELF_GUARDIAN',
        'warning',
        'No nominee is available for the client’s own preneed guardian (no POA agents or personal representatives were provided). Confirm whom the client wishes to name.',
        'Fla. Stat. 744.3045'
      )
    )
  }

  // Article II — Preneed guardian for minor children (744.3046)
  if (ctx.hasMinorChildren) {
    blocks.push(article('II', 'Preneed Guardian for My Minor Children', 'art-minors'))
    blocks.push(
      clause('2.1', [
        'For my minor child or children, upon my death or adjudication of my incapacity as the last surviving parent (or last surviving natural or adoptive parent entitled to serve), I declare and designate the following person or persons to serve as guardian of the person and property of my minor children, in the order named. ',
        ...successionSentence('guardian of the person and property of my minor children', ctx.fiduciaries.guardians),
      ])
    )
    blocks.push(
      clause(
        '2.2',
        'This declaration is made under Section 744.3046, Florida Statutes. The designated guardian becomes the guardian of my minor children upon the death or adjudication of incapacity of the last surviving parent, assumes the duties of guardian immediately, and is entitled to serve unless the court determines that the designated person is disqualified or that the appointment is contrary to the best interests of the children. The designation is subject to confirmation by the court within the time the statute allows.'
      )
    )
    blocks.push(
      clause(
        '2.3',
        'I direct that this declaration be filed with the clerk of the circuit court and produced to the court in any proceeding concerning the guardianship of my minor children.'
      )
    )
    if (ctx.minors.wishes) {
      blocks.push(
        clause('2.4', [
          'It is my wish, though not a binding direction, that any guardian of my children observe the following: ',
          { text: ctx.minors.wishes, italic: true },
          '.',
        ])
      )
    }
    if (ctx.fiduciaries.guardians.length === 0) {
      flags.push(
        flag(
          'PRENEED_NO_MINOR_GUARDIAN',
          'warning',
          'The client has minor children but named no guardian for them. Confirm a nominee for the preneed guardian of the minor children.',
          'Fla. Stat. 744.3046'
        )
      )
    }
  }

  // General provisions
  blocks.push(article(ctx.hasMinorChildren ? 'III' : 'II', 'General Provisions', 'art-general'))
  blocks.push(clause(undefined, 'I revoke any prior declaration of preneed guardian I have made that is inconsistent with this declaration. I may amend or revoke this declaration at any time while I am competent.'))
  blocks.push(clause(undefined, 'This declaration shall be governed by and construed under the laws of the State of Florida.'))

  // Execution
  blocks.push(spacer(1))
  blocks.push(
    para([
      { text: 'IN WITNESS WHEREOF, ', bold: true },
      `I have signed this Declaration of Preneed Guardian on the date written below, in the presence of the witnesses whose signatures appear below.`,
    ])
  )
  blocks.push({
    kind: 'signatureBlock',
    lines: [{ role: 'Declarant', name, withDate: true, caption: `${name}, Declarant` }],
  })
  blocks.push(
    para([
      'The foregoing declaration was signed by the declarant in our presence, and we, at the declarant’s request and in the declarant’s presence and in the presence of each other, have subscribed our names as witnesses on the date written above.',
    ])
  )
  blocks.push({
    kind: 'signatureBlock',
    lines: [
      { role: 'Witness', caption: 'Signature / Printed name / Address' },
      { role: 'Witness', caption: 'Signature / Printed name / Address' },
    ],
  })
  blocks.push({
    kind: 'notaryBlock',
    text: [
      [{ text: 'STATE OF FLORIDA', bold: true }, '  COUNTY OF ' + (ctx.testator.county?.toUpperCase() || '____________')],
      [
        `Sworn to and subscribed before me by means of ☐ physical presence or ☐ online notarization by `,
        { text: name, bold: true },
        `, the declarant, and by the witnesses, on ______________, 20___, who are personally known to me or produced ____________________ as identification.`,
      ],
    ],
  })
  blocks.push({ kind: 'signatureBlock', lines: [{ role: 'Notary Public, State of Florida', caption: 'My commission expires: __________' }] })

  return {
    type: 'PRENEED_GUARDIAN_DESIGNATION',
    title: `Declaration of Preneed Guardian of ${name}`,
    meta: { jurisdiction: 'FL', engineVersion: ENGINE_VERSION, generator: 'preneedGuardian' },
    blocks,
    flags,
    execution: preneedExecution,
  }
}
