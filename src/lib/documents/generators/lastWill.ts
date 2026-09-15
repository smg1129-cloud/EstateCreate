// Last Will & Testament (Florida). Deterministic assembly from IntakeContext.
//
// Structure: exordium, revocation, family identification, debts/expenses,
// specific gifts (+ optional tangible-property memo reference), residuary
// disposition (with a contingent trust for minor/young beneficiaries when the
// plan calls for it), guardian nomination, personal-representative nomination
// and powers, general fiduciary provisions, machinery clauses, and the Florida
// attestation clause + self-proving affidavit.

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
  excludedClause,
  fidName,
  fullName,
  joinAnd,
  lapsePhrase,
  residence,
  successionSentence,
  willExecution,
} from './shared'
import { residuaryDispositionBlocks, contingentTrustArticle, fiduciaryPowersClauses, dispositionOfRemainsClause } from './commonEstate'

export function generateLastWill(ctx: IntakeContext): DocumentModel {
  const blocks: Block[] = []
  const flags: ReviewFlag[] = []
  const name = fullName(ctx)
  const p = ctx.testator.p

  blocks.push(title('Last Will and Testament', `of ${name}`))
  blocks.push(spacer(1))

  // Exordium
  blocks.push(
    para([
      `I, `,
      { text: name, bold: true },
      `, a resident of ${residence(ctx)}, being of sound mind and disposing memory and not acting under duress, menace, fraud, or the undue influence of any person, do make, publish, and declare this to be my Last Will and Testament, and I hereby revoke all wills and codicils previously made by me.`,
    ])
  )

  // Article I — Family
  blocks.push(article('I', 'Family and Definitions', 'art-family'))
  blocks.push(familyClause(ctx))
  if (ctx.children.length > 0) {
    blocks.push(childrenClause(ctx))
  }
  blocks.push(
    clause(
      undefined,
      ctx.includeAfterborn
        ? 'References in this Will to my children and descendants include those now living and any child later born to or legally adopted by me. I have intentionally provided for any afterborn or after-adopted child through the dispositions in this Will.'
        : 'I have considered any child who may be born to or adopted by me after the execution of this Will, and I intend that this Will govern my estate as written.'
    )
  )
  if (ctx.disinherits && ctx.disinherits !== 'yes') {
    blocks.push(
      clause(undefined, [
        `I have intentionally and with full knowledge made no provision in this Will for the following person or persons, and any of their descendants, for reasons I consider sufficient: `,
        { text: ctx.disinherits, bold: true },
        `. This omission is intentional and not the result of accident or mistake.`,
      ])
    )
  }

  // Article II — Debts, expenses, taxes
  blocks.push(article('II', 'Debts, Expenses, and Taxes', 'art-debts'))
  blocks.push(
    clause(
      '2.1',
      'I direct that my legally enforceable debts, the expenses of my last illness, and the costs of administering my estate be paid as soon as practicable, except that any debt secured by a mortgage or other lien on property specifically devised shall, unless I direct otherwise, pass with that property subject to the lien.'
    )
  )
  blocks.push(
    clause(
      '2.2',
      'All estate, inheritance, and similar death taxes payable by reason of my death shall be paid out of the residue of my estate, without apportionment and without a right of reimbursement from any person.'
    )
  )
  if (ctx.debts.forgiveFamilyLoans) {
    blocks.push(
      clause('2.3', [
        'I forgive and cancel any debt or loan owed to me at my death by any of my descendants, and I direct that no such debt be charged against that person’s share of my estate.',
        ctx.debts.forgiveFamilyLoansDetail ? ` Specifically: ${ctx.debts.forgiveFamilyLoansDetail}.` : '',
      ])
    )
  }

  // Article III — Tangible personal property + specific gifts
  blocks.push(article('III', 'Tangible Personal Property and Specific Gifts', 'art-gifts'))
  if (ctx.usePersonalPropertyMemo) {
    blocks.push(
      clause('3.1', [
        'I may leave a written statement or list disposing of items of my tangible personal property, as authorized by Section 732.515, Florida Statutes. Any such writing, whether prepared before or after the execution of this Will, shall be given effect to the extent it is signed by me and describes the items and recipients with reasonable certainty. To the extent any item is not effectively disposed of by such a writing, it passes under this Will.',
      ])
    )
  }
  const giftClauses = specificGiftClauses(ctx, ctx.usePersonalPropertyMemo ? 3.2 : 3.1)
  if (giftClauses.length) {
    blocks.push(...giftClauses)
  } else if (!ctx.usePersonalPropertyMemo) {
    blocks.push(clause('3.1', 'I make no specific gifts under this Will; all of my property passes under the residuary provisions below.'))
  }

  // Article IV — Residuary estate
  blocks.push(article('IV', 'Residuary Estate', 'art-residue'))
  const { blocks: resBlocks, usesContingentTrust, flags: resFlags } = residuaryDispositionBlocks(ctx, {
    articlePrefix: '4',
    trustArticleNumber: 'V',
    context: 'will',
  })
  blocks.push(...resBlocks)
  flags.push(...resFlags)

  // Article V — Contingent trust (only if minors / staggered / lifetime)
  let nextArticle = 5
  if (usesContingentTrust) {
    blocks.push(...contingentTrustArticle(ctx, 'V'))
    nextArticle = 6
  }

  // Guardian for minor children
  if (ctx.hasMinorChildren) {
    blocks.push(article(roman(nextArticle), 'Guardian of Minor Children', 'art-guardian'))
    blocks.push(clause(undefined, successionSentence('guardian of the person and property of my minor children', ctx.fiduciaries.guardians)))
    if (ctx.minors.wishes) {
      blocks.push(clause(undefined, [`It is my wish, though not a binding direction, that any guardian observe the following: `, { text: ctx.minors.wishes, italic: true }, '.']))
    }
    if (ctx.fiduciaries.guardians.length === 0) {
      flags.push(flag('NO_GUARDIAN', 'warning', 'Client has minor children but named no guardian. Confirm a nominee.', 'Fla. Stat. 744.3021'))
    }
    nextArticle++
  }

  // Personal Representative
  blocks.push(article(roman(nextArticle), 'Personal Representative', 'art-pr'))
  blocks.push(clause(undefined, successionSentence('Personal Representative', ctx.fiduciaries.personalReps)))
  const excludedPR = excludedClause(ctx, 'my Personal Representative')
  if (excludedPR) blocks.push(clause(undefined, excludedPR))
  blocks.push(clause(undefined, bondClause(ctx)))
  blocks.push(
    clause(undefined, 'I direct that my Personal Representative be permitted to serve without the requirement of filing an inventory or accounting with any court, except as required by law or on the demand of an interested person, and I request that my estate be administered with as little court supervision as the law allows.')
  )
  nextArticle++

  // Fiduciary powers + machinery
  blocks.push(article(roman(nextArticle), 'Fiduciary Powers and Administrative Provisions', 'art-powers'))
  blocks.push(...fiduciaryPowersClauses(ctx, { includeTrustPowers: usesContingentTrust }))
  nextArticle++

  // Machinery article
  blocks.push(article(roman(nextArticle), 'General Provisions', 'art-general'))
  const disposition = dispositionOfRemainsClause(ctx)
  if (disposition) blocks.push(disposition)
  blocks.push(
    clause(
      undefined,
      'Survivorship. Any beneficiary who fails to survive me by thirty (30) days shall be deemed to have predeceased me for all purposes of this Will.'
    )
  )
  blocks.push(
    clause(
      undefined,
      ctx.digital.executorFullAccess
        ? 'Digital assets. I grant my Personal Representative full authority to access, manage, distribute, copy, delete, and control my digital assets and electronic communications, including the content of my communications, under the Florida Fiduciary Access to Digital Assets Act, Chapter 740, Florida Statutes.'
        : 'Digital assets. I grant my Personal Representative authority to access and manage my digital assets and to close my online accounts under the Florida Fiduciary Access to Digital Assets Act, Chapter 740, Florida Statutes, but I do not authorize access to the content of my electronic communications.'
    )
  )
  blocks.push(clause(undefined, 'Governing law. This Will shall be governed by and construed under the laws of the State of Florida.'))
  blocks.push(
    clause(
      undefined,
      'Simultaneous death. If any person and I die under circumstances in which the order of our deaths cannot be established, I shall be deemed to have survived that person, except that if that person is my spouse, my spouse shall be deemed to have predeceased me.'
    )
  )
  blocks.push(
    clause(
      undefined,
      'Severability. If any provision of this Will is held invalid, that determination shall not affect the remaining provisions, which shall continue in full effect.'
    )
  )

  // Execution — attestation + self-proving affidavit
  blocks.push(...executionBlocks(ctx))

  return {
    type: 'LAST_WILL',
    title: `Last Will and Testament of ${name}`,
    meta: { jurisdiction: 'FL', engineVersion: ENGINE_VERSION, generator: 'lastWill' },
    blocks,
    flags,
    execution: willExecution(),
  }
}

// --- local helpers ---------------------------------------------------------

function roman(n: number): string {
  const map: [number, string][] = [
    [10, 'X'],
    [9, 'IX'],
    [5, 'V'],
    [4, 'IV'],
    [1, 'I'],
  ]
  let out = ''
  let rem = n
  for (const [v, s] of map) {
    while (rem >= v) {
      out += s
      rem -= v
    }
  }
  return out
}

function familyClause(ctx: IntakeContext): Block {
  if (ctx.spouse && ctx.testator.maritalStatus === 'married') {
    return clause('1.1', [
      `I am married to `,
      { text: ctx.spouse.fullName || '[SPOUSE NAME]', bold: true },
      `, who is referred to in this Will as my spouse.`,
    ])
  }
  if (ctx.spouse && ctx.testator.maritalStatus === 'partnered') {
    return clause('1.1', [
      `I am not married. My partner is `,
      { text: ctx.spouse.fullName || '[PARTNER NAME]', bold: true },
      `.`,
    ])
  }
  const statusWord =
    ctx.testator.maritalStatus === 'widowed'
      ? 'widowed'
      : ctx.testator.maritalStatus === 'divorced'
        ? 'divorced and not remarried'
        : 'not married'
  return clause('1.1', `I am ${statusWord}.`)
}

function childrenClause(ctx: IntakeContext): Block {
  const living = ctx.children.filter((c) => !c.deceased)
  const names = living.map((c) => c.fullName)
  if (names.length === 0) {
    return clause('1.2', 'I have no living children.')
  }
  return clause('1.2', [
    `My ${names.length === 1 ? 'child is' : 'children are'} `,
    { text: joinAnd(names), bold: true },
    `. The terms "child," "children," and "descendants" as used in this Will refer to my descendants by blood or legal adoption.`,
  ])
}

function specificGiftClauses(ctx: IntakeContext, startNum: number): Block[] {
  return ctx.specificGifts.map((g, i) => {
    const num = (startNum + i * 0.1).toFixed(1)
    const lapse =
      g.ifPredeceased === 'to_descendants'
        ? ` If ${g.recipient} does not survive me, this gift shall pass to ${g.recipient}’s then-living descendants, per stirpes.`
        : ` If ${g.recipient} does not survive me, this gift shall lapse and become part of my residuary estate.`
    return clause(num, [
      `I give `,
      { text: g.description, bold: true },
      ` to `,
      { text: g.recipient, bold: true },
      g.isCharity ? ', a charitable organization,' : '',
      ` if ${g.recipient === 'my' ? 'they' : g.recipient} survives me.`,
      lapse,
    ])
  })
}

function executionBlocks(ctx: IntakeContext): Block[] {
  const name = fullName(ctx)
  const blocks: Block[] = []
  blocks.push(spacer(1))
  blocks.push(
    para([
      { text: 'IN WITNESS WHEREOF, ', bold: true },
      `I have signed this Last Will and Testament, consisting of the preceding pages, on the date written below, and I declare to the witnesses that this is my Will.`,
    ])
  )
  blocks.push({
    kind: 'signatureBlock',
    heading: undefined,
    lines: [{ role: 'Testator', name, withDate: true, caption: `${name}, Testator` }],
  })

  // Attestation clause
  blocks.push(
    para([
      `The foregoing instrument was signed, published, and declared by `,
      { text: name, bold: true },
      `, the Testator, to be the Testator’s Last Will and Testament, in our presence, and we, at the Testator’s request and in the Testator’s presence and in the presence of each other, have subscribed our names as witnesses on the date above written. We believe the Testator to be of sound mind and under no constraint or undue influence.`,
    ])
  )
  blocks.push({
    kind: 'signatureBlock',
    lines: [
      { role: 'Witness', caption: 'Signature / Printed name / Address' },
      { role: 'Witness', caption: 'Signature / Printed name / Address' },
    ],
  })

  // Self-proving affidavit (Fla. Stat. 732.503)
  blocks.push(spacer(1))
  blocks.push({ kind: 'heading', level: 1, text: 'Self-Proving Affidavit', ref: 'self-proof' })
  blocks.push({
    kind: 'notaryBlock',
    text: [
      [{ text: 'STATE OF FLORIDA', bold: true }, '  COUNTY OF ' + (ctx.testator.county?.toUpperCase() || '____________')],
      [
        `Sworn to and subscribed before me by means of ☐ physical presence or ☐ online notarization by the Testator, `,
        { text: name, bold: true },
        `, and by the witnesses, on __________________, who are personally known to me or who produced ____________________ as identification.`,
      ],
      [
        `I, the Testator, sign my name to this instrument this ____ day of __________, 20___, and, being first duly sworn, declare to the undersigned authority that I sign it willingly, that I execute it as my free and voluntary act, and that I am eighteen years of age or older, of sound mind, and under no constraint or undue influence.`,
      ],
      [
        `We, the witnesses, being first duly sworn, declare to the undersigned authority that the Testator signed this instrument as the Testator’s Will, that the Testator signed willingly, and that each of us, in the presence of the Testator and of each other, signed the Will as a witness, and that to the best of our knowledge the Testator was at that time eighteen years of age or older, of sound mind, and under no constraint or undue influence.`,
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
  blocks.push({ kind: 'fillIn', label: 'Notary commission number', note: 'affix seal' })
  return blocks
}
