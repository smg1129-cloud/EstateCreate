// Pour-Over Will (Florida). Companion to the revocable living trust: it names
// the trust as the residuary beneficiary so any asset not titled in the trust
// at death "pours over" into it, and handles the probate-only machinery
// (personal representative, guardian, tangible property).

import {
  article,
  clause,
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
  excludedClause,
  fullName,
  residence,
  successionSentence,
  willExecution,
} from './shared'
import { flag } from '../blocks'
import { trustName } from './revocableTrust'
import { dispositionOfRemainsClause } from './commonEstate'

export function generatePourOverWill(ctx: IntakeContext): DocumentModel {
  const blocks: Block[] = []
  const flags: ReviewFlag[] = []
  const name = fullName(ctx)
  const tName = trustName(ctx)

  blocks.push(title('Last Will and Testament', `of ${name} (Pour-Over Will)`))
  blocks.push(spacer(1))
  blocks.push(
    para([
      `I, `,
      { text: name, bold: true },
      `, a resident of ${residence(ctx)}, being of sound mind, make this my Last Will and Testament, and I revoke all prior wills and codicils. This Will is intended to work together with `,
      { text: `${tName} dated ______________, 20___`, bold: true },
      ` (the "Trust").`,
    ])
  )

  blocks.push(article('I', 'Family'))
  if (ctx.spouse && ctx.testator.maritalStatus === 'married') {
    blocks.push(clause('1.1', ['I am married to ', { text: ctx.spouse.fullName || '[SPOUSE NAME]', bold: true }, '.']))
  } else {
    blocks.push(clause('1.1', 'My family is as identified in the Trust.'))
  }
  const living = ctx.children.filter((c) => !c.deceased).map((c) => c.fullName)
  if (living.length) {
    blocks.push(clause('1.2', ['My children are ', { text: living.join(', '), bold: true }, '. References to my descendants include afterborn and adopted descendants.']))
  }

  blocks.push(article('II', 'Tangible Personal Property'))
  blocks.push(
    clause(
      '2.1',
      ctx.usePersonalPropertyMemo
        ? 'I may dispose of tangible personal property by a separate written statement or list under Section 732.515, Florida Statutes. Any tangible personal property not so disposed of shall pour over to the Trust under Article IV.'
        : 'I give all of my tangible personal property to the Trustee of the Trust, to be distributed as part of the trust estate.'
    )
  )

  blocks.push(article('III', 'Debts and Taxes'))
  blocks.push(clause('3.1', 'I direct payment of my enforceable debts and administration expenses. All death taxes shall be paid as directed in the Trust.'))

  blocks.push(article('IV', 'Pour-Over of Residuary Estate'))
  blocks.push(
    clause('4.1', [
      'I give all the rest, residue, and remainder of my estate to the then-serving Trustee of the Trust, to be added to and administered as part of the trust estate under the terms of the Trust in effect at my death, including any amendment made after the date of this Will. This gift is valid under Section 732.513, Florida Statutes.',
    ])
  )
  blocks.push(
    clause('4.2', [
      'If for any reason the gift to the Trust is ineffective, I incorporate the dispositive terms of the Trust by reference as if fully set forth in this Will, and my residuary estate shall be distributed to the persons and in the manner provided in the Trust as of the date of this Will.',
    ])
  )

  let art = 5
  if (ctx.hasMinorChildren) {
    blocks.push(article('V', 'Guardian of Minor Children'))
    blocks.push(clause(undefined, successionSentence('guardian of the person and property of my minor children', ctx.fiduciaries.guardians)))
    if (ctx.fiduciaries.guardians.length === 0) {
      flags.push(flag('NO_GUARDIAN', 'warning', 'Minor children but no guardian nominated in the pour-over will.', 'Fla. Stat. 744.3021'))
    }
    art = 6
  }

  blocks.push(article(art === 6 ? 'VI' : 'V', 'Personal Representative'))
  blocks.push(clause(undefined, successionSentence('Personal Representative', ctx.fiduciaries.personalReps)))
  const excl = excludedClause(ctx, 'my Personal Representative')
  if (excl) blocks.push(clause(undefined, excl))
  blocks.push(clause(undefined, bondClause(ctx)))
  blocks.push(
    clause(undefined, ctx.digital.executorFullAccess
      ? 'My Personal Representative shall have full authority over my digital assets, including the content of communications, under Chapter 740, Florida Statutes.'
      : 'My Personal Representative may access and manage my digital assets and close accounts under Chapter 740, Florida Statutes, but not the content of communications.')
  )
  const disposition = dispositionOfRemainsClause(ctx)
  if (disposition) blocks.push(disposition)
  if (ctx.debts.forgiveFamilyLoans) {
    blocks.push(clause(undefined, 'I forgive any debt owed to me at my death by any of my descendants, and no such debt shall be charged against that person’s share.'))
  }
  blocks.push(clause(undefined, 'This Will shall be governed by Florida law. A beneficiary who fails to survive me by thirty (30) days is deemed to have predeceased me.'))

  // Execution (same self-proving affidavit as the standalone will)
  blocks.push(spacer(1))
  blocks.push(para([{ text: 'IN WITNESS WHEREOF, ', bold: true }, 'I sign this Will in the presence of the witnesses below.']))
  blocks.push({ kind: 'signatureBlock', lines: [{ role: 'Testator', name, withDate: true, caption: `${name}, Testator` }] })
  blocks.push(
    para([
      'Signed, published, and declared by the Testator as the Testator’s Last Will and Testament in our presence, and subscribed by us as witnesses in the presence of the Testator and of each other.',
    ])
  )
  blocks.push({
    kind: 'signatureBlock',
    lines: [
      { role: 'Witness', caption: 'Signature / Printed name / Address' },
      { role: 'Witness', caption: 'Signature / Printed name / Address' },
    ],
  })
  blocks.push({ kind: 'heading', level: 1, text: 'Self-Proving Affidavit' })
  blocks.push({
    kind: 'notaryBlock',
    text: [
      [{ text: 'STATE OF FLORIDA', bold: true }, '  COUNTY OF ' + (ctx.testator.county?.toUpperCase() || '____________')],
      [
        'Sworn to and subscribed before me by means of ☐ physical presence or ☐ online notarization by the Testator and the witnesses on ______________, 20___, who are personally known to me or produced ____________________ as identification. The Testator declared, and the witnesses attested, that the Testator executed this Will willingly, as a free and voluntary act, being of sound mind and under no constraint or undue influence.',
      ],
    ],
  })
  blocks.push({
    kind: 'signatureBlock',
    lines: [
      { role: 'Testator' },
      { role: 'Witness' },
      { role: 'Witness' },
      { role: 'Notary Public, State of Florida', caption: 'My commission expires: __________' },
    ],
  })

  return {
    type: 'POUR_OVER_WILL',
    title: `Pour-Over Will of ${name}`,
    meta: { jurisdiction: 'FL', engineVersion: ENGINE_VERSION, generator: 'pourOverWill' },
    blocks,
    flags,
    execution: willExecution(),
  }
}
