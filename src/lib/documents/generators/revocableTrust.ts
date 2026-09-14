// Revocable Living Trust (Florida). The grantor is the initial trustee; on the
// grantor's incapacity or death, the successor trustee administers and
// distributes per the same dispositive scheme used by the will. Includes a
// Schedule A for initial funding (the trust does nothing until funded).

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
import { contingentTrustArticle, fiduciaryPowersClauses, residuaryDispositionBlocks } from './commonEstate'

export function trustName(ctx: IntakeContext): string {
  const n = ctx.testator.fullName || '[CLIENT NAME]'
  return `The ${n} Revocable Living Trust`
}

export function generateRevocableTrust(ctx: IntakeContext): DocumentModel {
  const blocks: Block[] = []
  const flags: ReviewFlag[] = []
  const name = fullName(ctx)
  const tName = trustName(ctx)
  const p = ctx.testator.p

  blocks.push(title('Revocable Living Trust Agreement', tName))
  blocks.push(spacer(1))
  blocks.push(
    para([
      `This Revocable Living Trust Agreement is made by `,
      { text: name, bold: true },
      `, of ${residence(ctx)}, as grantor (the "Grantor"), and `,
      { text: name, bold: true },
      `, as initial trustee (the "Trustee"). This trust may be referred to as `,
      { text: `${tName} dated ______________, 20___`, bold: true },
      `.`,
    ])
  )

  // Article I — Trust property & purpose
  blocks.push(article('I', 'Creation of Trust'))
  blocks.push(
    clause('1.1', 'The Grantor transfers to the Trustee the property listed on Schedule A, together with any other property later added to this trust, to be held, administered, and distributed as provided in this Agreement.')
  )
  blocks.push(
    clause('1.2', 'This is a revocable trust. During the Grantor’s lifetime, while the Grantor has capacity, the Grantor may at any time amend or revoke this trust in whole or in part by a signed writing delivered to the Trustee.')
  )

  // Article II — Grantor's rights and lifetime administration
  blocks.push(article('II', 'Rights of the Grantor During Lifetime'))
  blocks.push(
    clause('2.1', 'While the Grantor has capacity, the Trustee shall distribute to or for the benefit of the Grantor as much of the net income and principal of the trust as the Grantor directs, and the Grantor may add or withdraw property at will.')
  )
  blocks.push(
    clause('2.2', [
      'Incapacity. If the Grantor becomes unable to manage the Grantor’s financial affairs, as certified in writing by two licensed physicians (or as otherwise determined under Florida law), the successor Trustee shall administer the trust for the benefit of the Grantor and those dependent on the Grantor, applying so much of the income and principal as the Trustee determines necessary for the Grantor’s health, maintenance, support, and comfort in the Grantor’s accustomed manner of living.',
    ])
  )

  // Article III — Trustees
  blocks.push(article('III', 'Trustees'))
  blocks.push(clause('3.1', `The Grantor shall serve as initial Trustee.`))
  blocks.push(
    clause('3.2', successionSentence('successor Trustee, to serve upon the Grantor’s resignation, incapacity, or death', ctx.fiduciaries.trustees.length ? ctx.fiduciaries.trustees : ctx.fiduciaries.personalReps, 'the'))
  )
  blocks.push(clause('3.3', bondClause(ctx)))
  blocks.push(
    clause('3.4', 'A Trustee may resign by written notice to the successor Trustee and the then-current adult beneficiaries. No successor Trustee shall be liable for the acts or omissions of any prior Trustee.')
  )
  if (ctx.fiduciaries.trustees.length === 0) {
    flags.push(flag('NO_TRUSTEE', 'warning', 'No successor trustee named for the revocable trust. A nominee is required.', 'Fla. Stat. 736.0704'))
  }

  // Article IV — Administration on death of Grantor
  blocks.push(article('IV', 'Administration Upon the Grantor’s Death'))
  blocks.push(
    clause('4.1', 'Upon the Grantor’s death, the Trustee shall pay from the trust estate the Grantor’s legally enforceable debts, expenses of last illness and funeral, and costs of administration, to the extent the probate estate is insufficient or the Grantor’s Personal Representative requests, and shall pay all death taxes as directed in the Grantor’s will or, absent such direction, from the residue of the trust.')
  )
  if (ctx.usePersonalPropertyMemo) {
    blocks.push(
      clause('4.2', 'The Trustee shall distribute items of tangible personal property in accordance with any written statement or list the Grantor leaves as authorized by Section 732.515, Florida Statutes, and otherwise as part of the residue.')
    )
  }
  // Specific gifts through the trust
  const gifts = ctx.specificGifts
  if (gifts.length) {
    blocks.push(clause(ctx.usePersonalPropertyMemo ? '4.3' : '4.2', 'The Trustee shall then make the following specific distributions:'))
    blocks.push({
      kind: 'list',
      ordered: false,
      items: gifts.map((g) => [
        `${g.description} to ${g.recipient}${g.isCharity ? ', a charitable organization' : ''}. `,
        {
          text:
            g.ifPredeceased === 'to_descendants'
              ? `If ${g.recipient} does not survive the Grantor, to that person’s then-living descendants, per stirpes.`
              : `If ${g.recipient} does not survive the Grantor, this gift lapses and becomes part of the residue.`,
          italic: true,
        },
      ]),
    })
  }

  // Spousal / residue disposition
  blocks.push(article('V', 'Distribution of the Residue'))
  const { blocks: resBlocks, usesContingentTrust, flags: resFlags } = residuaryDispositionBlocks(ctx, {
    articlePrefix: '5',
    trustArticleNumber: 'VI',
    context: 'trust',
  })
  blocks.push(...resBlocks)
  flags.push(...resFlags)

  // Continuing trusts
  if (usesContingentTrust) {
    blocks.push(...contingentTrustArticle(ctx, 'VI'))
  }

  const powersArticle = usesContingentTrust ? 'VII' : 'VI'
  const generalArticle = usesContingentTrust ? 'VIII' : 'VII'

  // Fiduciary powers
  blocks.push(article(powersArticle, 'Trustee Powers'))
  blocks.push(...fiduciaryPowersClauses(ctx, { includeTrustPowers: true }))

  // General provisions
  blocks.push(article(generalArticle, 'General Provisions'))
  blocks.push(clause(undefined, 'Governing law. This Agreement shall be governed by and construed under the laws of the State of Florida, and the trust is a Florida trust for all purposes.'))
  blocks.push(
    clause(undefined, 'Spendthrift. To the fullest extent permitted by Section 736.0502, Florida Statutes, no beneficiary (other than the Grantor) may assign or encumber any interest in this trust, and no such interest shall be subject to the claims of creditors or to legal process.')
  )
  blocks.push(
    clause(undefined, 'Survivorship. A beneficiary who fails to survive the Grantor by thirty (30) days shall be deemed to have predeceased the Grantor.')
  )
  blocks.push(
    clause(undefined, [
      ctx.digital.executorFullAccess
        ? 'Digital assets. The Trustee shall have full authority over the Grantor’s digital assets and the content of electronic communications under Chapter 740, Florida Statutes.'
        : 'Digital assets. The Trustee may access and manage the Grantor’s digital assets and close online accounts under Chapter 740, Florida Statutes, but is not authorized to access the content of electronic communications.',
    ])
  )
  blocks.push(clause(undefined, 'Perpetuities. Notwithstanding any other provision, every trust created under this Agreement shall terminate no later than the period allowed under Section 689.225, Florida Statutes, and any property then held shall be distributed to the persons then entitled to the income.'))
  blocks.push(clause(undefined, 'Severability. The invalidity of any provision shall not affect the remaining provisions of this Agreement.'))

  // Execution
  blocks.push(spacer(1))
  blocks.push(para([{ text: 'IN WITNESS WHEREOF, ', bold: true }, `the Grantor and the Trustee have executed this Agreement on the date written below.`]))
  blocks.push({
    kind: 'signatureBlock',
    lines: [
      { role: 'Grantor', name, withDate: true, caption: `${name}, Grantor` },
      { role: 'Trustee', name, withDate: true, caption: `${name}, Trustee` },
    ],
  })
  blocks.push(
    para([
      `Signed by the Grantor in our presence, and by us in the presence of the Grantor and of each other, as witnesses. Because this trust disposes of property at the Grantor’s death, it is executed with the formalities of a will.`,
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
        { text: name, bold: true },
        `, as Grantor and Trustee, and by the witnesses, on ______________, 20___, who are personally known to me or produced ____________________ as identification.`,
      ],
    ],
  })
  blocks.push({ kind: 'signatureBlock', lines: [{ role: 'Notary Public, State of Florida', caption: 'My commission expires: __________' }] })

  // Schedule A
  blocks.push({ kind: 'pageBreak' })
  blocks.push({ kind: 'heading', level: 1, text: 'Schedule A — Initial Trust Property' })
  blocks.push(para('The following property is transferred to the trust upon execution. Additional property may be added at any time. Assets must be retitled into the name of the trust to be governed by it.'))
  blocks.push(...scheduleAItems(ctx))
  flags.push(
    flag(
      'FUNDING',
      'warning',
      'A revocable trust does nothing until funded. Confirm the scope of engagement covers retitling the home (deed), accounts, and beneficiary designations, and complete Schedule A accordingly.',
      'Attorney checklist — funding scope'
    )
  )

  return {
    type: 'REVOCABLE_LIVING_TRUST',
    title: `${tName} Agreement`,
    meta: { jurisdiction: 'FL', engineVersion: ENGINE_VERSION, generator: 'revocableTrust' },
    blocks,
    flags,
    execution: trustExecution(),
  }
}

function scheduleAItems(ctx: IntakeContext): Block[] {
  const items: string[] = []
  if (ctx.assets.ownsHome) {
    items.push(`Real property (primary residence): ${ctx.assets.homeAddress || '[address — attach deed]'} — deed to be recorded transferring title to the trust.`)
  }
  for (const re of ctx.assets.realEstate) {
    items.push(`Real property: ${re.description}${re.state ? `, ${re.state}` : ''} — deed to be recorded.`)
  }
  for (const acct of ctx.assets.accounts) {
    if (acct.type !== 'retirement') {
      items.push(`Account at ${acct.institution} (${acct.type})${acct.value ? ` — approx. $${acct.value.toLocaleString()}` : ''} — retitle to the trust.`)
    }
  }
  if (items.length === 0) {
    items.push('[No assets listed yet — complete during funding.]')
  }
  return [{ kind: 'list', ordered: true, items: items.map((i) => [i]) }]
}
