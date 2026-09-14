// Florida Durable Power of Attorney (Chapter 709, Fla. Stat.). Deterministic
// assembly from IntakeContext.
//
// Structure: exordium and appointment of agent(s) with a line of succession,
// durability and effective-date clause (effective when signed, NOT springing —
// Fla. Stat. 709.2104 / 709.2108), enumerated general authority, a separately
// initialed section of qualified ("superpower") authority under Fla. Stat.
// 709.2202, agent duties and compensation, third-party reliance, revocation of
// prior powers, governing law, and the two-witness/notary execution block
// required by Fla. Stat. 709.2105.

import {
  article,
  bold,
  clause,
  flag,
  list,
  para,
  spacer,
  title,
  type Block,
  type DocumentModel,
  type ReviewFlag,
} from '../blocks'
import type { IntakeContext } from '../context'
import { ENGINE_VERSION, dpoaExecution, fullName, residence, successionSentence } from './shared'

export function generateDurablePOA(ctx: IntakeContext): DocumentModel {
  const blocks: Block[] = []
  const flags: ReviewFlag[] = []
  const name = fullName(ctx)
  const agents = ctx.fiduciaries.poaAgents

  blocks.push(title('Durable Power of Attorney', `of ${name}`))
  blocks.push(spacer(1))

  // Exordium
  blocks.push(
    para([
      `I, `,
      bold(name),
      `, a resident of ${residence(ctx)}, being of sound mind, make this Durable Power of Attorney under Chapter 709, Florida Statutes, and appoint the agent named below to act for me as my attorney-in-fact.`,
    ])
  )

  // Article I — Appointment of agent
  blocks.push(article('I', 'Appointment of Agent', 'art-agent'))
  blocks.push(clause('1.1', successionSentence('agent', agents)))
  if (agents.length === 0) {
    flags.push(
      flag('NO_POA_AGENT', 'warning', 'No power-of-attorney agent was provided. Confirm a nominee before execution.', 'Fla. Stat. 709.2105')
    )
  }
  blocks.push(
    clause('1.2', [
      `Each successor agent shall serve only when every agent named before that successor is unable or unwilling to serve, and a third party may rely on the written declaration of a successor agent that each prior agent has ceased to serve. `,
      `Only one agent may act at a time; my agents are not authorized to act jointly unless I have expressly said so in this instrument.`,
    ])
  )
  blocks.push(
    clause('1.3', 'My agent shall act in my best interest, exercise the authority granted in good faith and only within its scope, keep my property separate from the agent’s own, and maintain records of all transactions made on my behalf.')
  )

  // Article II — Durability and effective date (NOT springing)
  blocks.push(article('II', 'Durability and Effective Date', 'art-durability'))
  blocks.push(
    clause('2.1', [
      bold('This is a durable power of attorney. '),
      `The authority granted here is not terminated by my subsequent incapacity, except as provided in Chapter 709, Florida Statutes.`,
    ])
  )
  blocks.push(
    clause('2.2', [
      bold('This power of attorney is effective when I sign it '),
      `and is not conditioned on my lack of capacity. Under Section 709.2108, Florida Statutes, Florida does not recognize a power of attorney that becomes effective only upon a future date or event, and I do not intend this instrument to be a springing power.`,
    ])
  )

  // Article III — General authority
  blocks.push(article('III', 'General Authority Granted', 'art-general'))
  blocks.push(
    clause('3.1', 'I grant my agent full authority to act for me with respect to the following subjects, to the same extent I could act for myself, subject to the limitations stated in this instrument and to the qualified powers in Article IV, which are effective only if separately initialed:')
  )
  const generalItems: Block = list(
    [
      'Banking and financial-institution transactions, including opening, using, and closing accounts, and endorsing and depositing instruments;',
      'Real property transactions, including buying, selling, leasing, mortgaging, managing, and conveying interests in real estate;',
      'Tangible personal property transactions;',
      'Stock, bond, commodity, and other investment and securities transactions;',
      'Business operating transactions, including the management and continuation of any business interest I own;',
      'Tax matters, including preparing, signing, and filing federal, state, and local returns and dealing with taxing authorities on my behalf;',
      'Government benefits, including Social Security, Medicare, and other public benefits (subject to the qualified-powers limits on Medicaid planning below);',
      'Retirement plans and individual retirement accounts, including making permitted elections, contributions, rollovers, and withdrawals;',
      'Insurance and annuity transactions, including paying premiums and making claims;',
      'Claims and litigation, including asserting, defending, settling, and compromising claims for and against me;',
      'Estate, trust, and other beneficiary transactions in which I have an interest;',
      'Digital assets and electronic communications, including access to and management of my online accounts, under the Florida Fiduciary Access to Digital Assets Act, Chapter 740, Florida Statutes;',
      'Care of my person and property, including engaging and paying for services necessary for my maintenance and support; and',
      'Any other act reasonably necessary to give effect to the authority granted above.',
    ],
    { ordered: false, ref: 'general-authority' }
  )
  blocks.push(generalItems)
  if (ctx.poaPowers.realEstate) {
    blocks.push(
      clause('3.2', 'For the avoidance of doubt, my agent’s authority over real property transactions includes the conveyance, mortgage, and lease of my homestead, subject to the joinder of my spouse where required by law.')
    )
  } else {
    blocks.push(
      clause('3.2', 'My agent’s authority does not extend to the sale, conveyance, or encumbrance of my homestead real property.')
    )
    flags.push(
      flag('POA_NO_REALESTATE', 'info', 'Client did not grant real-property authority; confirm this restriction is intended.', 'Fla. Stat. 709.2201')
    )
  }
  blocks.push(
    clause('3.3', 'Notwithstanding the authority granted above, my agent may not make, publish, or revoke a will or codicil for me, may not exercise any authority over property held in trust unless expressly granted below, and may not exercise any power that would cause my agent’s income or property to be taxed or applied to discharge the agent’s own legal obligations, including the obligation to support a dependent.')
  )

  // Article IV — Qualified / enhanced powers (separately initialed)
  blocks.push(article('IV', 'Qualified Powers Requiring Separate Signature', 'art-qualified'))
  blocks.push(
    clause('4.1', [
      bold('The following powers are effective only where I have separately signed or initialed. '),
      `Under Section 709.2202, Florida Statutes, an agent may not exercise any of these authorities unless I have separately signed or initialed the specific grant. Any grant not initialed below is withheld from my agent.`,
    ])
  )

  let granted = 0
  const grantQualified = (num: string, heading: string, text: string) => {
    granted++
    blocks.push(clause(num, [bold(`${heading}. `), text]))
    blocks.push({ kind: 'fillIn', label: 'Principal’s initials', note: `Initial to grant: ${heading}` })
  }

  let qn = 2
  if (ctx.poaPowers.gifting) {
    grantQualified(
      `4.${qn++}`,
      'Authority to make gifts',
      'I authorize my agent to make gifts of my property, outright or in trust, including gifts that qualify for the federal gift-tax annual exclusion, provided the gifts are consistent with my known estate plan and made in my best interest. The attorney should confirm any intended dollar limits, permissible recipients, and whether gifts to the agent are authorized.'
    )
    flags.push(
      flag(
        'POA_GIFTING_LIMITS',
        'caution',
        'Gifting superpower granted. Confirm gifting limits, permissible donees, whether self-gifts by the agent are intended, and the tax/estate-planning objective (e.g. annual-exclusion vs. Medicaid transfers).',
        'Fla. Stat. 709.2202(1); 709.2116'
      )
    )
  }
  if (ctx.poaPowers.beneficiaryChanges) {
    grantQualified(
      `4.${qn++}`,
      'Authority to change beneficiary designations',
      'I authorize my agent to create or change the beneficiary designations on my life insurance, annuities, retirement accounts, transfer-on-death and payable-on-death accounts, and similar assets.'
    )
    flags.push(
      flag(
        'POA_BENEFICIARY_CHANGE_RISK',
        'warning',
        'Authority to change beneficiary designations granted. This power can redirect non-probate assets away from the intended plan and is a common vector for financial abuse. Confirm the principal understands the risk and consider limiting or excluding the agent as a permissible new beneficiary.',
        'Fla. Stat. 709.2202(1)(b)'
      )
    )
  }
  if (ctx.poaPowers.trustPowers) {
    grantQualified(
      `4.${qn++}`,
      'Authority over trusts',
      'I authorize my agent to create, amend, modify, revoke, or terminate a trust on my behalf, and to transfer my property to a trust of which I am a grantor, but only in accordance with the terms of the governing trust instrument and applicable law.'
    )
    flags.push(
      flag(
        'POA_TRUST_POWERS',
        'caution',
        'Trust superpower granted. Confirm the referenced trust permits amendment/revocation by an agent and that this power is coordinated with any existing revocable living trust.',
        'Fla. Stat. 709.2202(1)(c)'
      )
    )
  }
  if (ctx.poaPowers.medicaidPlanning) {
    grantQualified(
      `4.${qn++}`,
      'Authority for Medicaid and long-term-care planning',
      'I authorize my agent to take actions to plan for and qualify me for Medicaid and other long-term-care benefits, including transferring, converting, and restructuring my assets, purchasing exempt assets, funding qualified income or pooled trusts, and applying for benefits on my behalf.'
    )
    flags.push(
      flag(
        'POA_MEDICAID_PLANNING',
        'caution',
        'Medicaid-planning authority granted. Confirm the intended strategy and that asset transfers under this power will not create disqualifying transfer penalties or conflict with the gifting grant.',
        'Fla. Stat. 709.2202; 42 U.S.C. 1396p'
      )
    )
  }
  if (granted === 0) {
    blocks.push(
      clause('4.2', 'I have not granted any qualified power under Section 709.2202, Florida Statutes. My agent’s authority is limited to the general authority in Article III.')
    )
  }

  // Article V — Reliance, compensation, and administration
  blocks.push(article('V', 'Reliance, Compensation, and Administration', 'art-admin'))
  blocks.push(
    clause('5.1', 'Third parties may rely on this power of attorney. Any person or institution that acts in good-faith reliance on this instrument, or on a photocopy or electronic copy of it, shall not incur liability for doing so, and I hold that person or institution harmless from any claim arising out of such reliance. A person who is asked to accept this power of attorney may require the agent’s identification, an agent’s certification of facts under Section 709.2119, Florida Statutes, or an opinion of counsel, but may not require an additional or different form.')
  )
  blocks.push(
    clause('5.2', 'My agent is entitled to reimbursement for reasonable expenses incurred on my behalf and to reasonable compensation for services rendered, unless my agent has agreed to serve without compensation.')
  )
  blocks.push(
    clause('5.3', 'My agent may not delegate the authority granted here except as permitted by law, and may engage and reasonably rely on attorneys, accountants, and other professionals, the reasonable cost of which shall be paid from my property.')
  )

  // Article VI — Revocation and governing law
  blocks.push(article('VI', 'Revocation and Governing Law', 'art-revocation'))
  blocks.push(
    clause('6.1', 'I revoke any power of attorney I have previously executed, except a power of attorney executed for a limited or special purpose that expressly survives this instrument. Revocation is not effective as to a third party until the third party has notice of it.')
  )
  blocks.push(
    clause('6.2', 'This power of attorney is governed by the laws of the State of Florida. A power of attorney validly executed under the laws of another jurisdiction is nonetheless recognized in Florida to the extent provided by Section 709.2106, Florida Statutes.')
  )
  blocks.push(
    clause('6.3', 'If any provision of this instrument is held invalid, that determination shall not affect the remaining provisions, which shall continue in full effect.')
  )

  // Execution — principal, two witnesses, and notary (Fla. Stat. 709.2105)
  blocks.push(...executionBlocks(ctx, name))

  return {
    type: 'DURABLE_POWER_OF_ATTORNEY',
    title: `Durable Power of Attorney of ${name}`,
    meta: { jurisdiction: 'FL', engineVersion: ENGINE_VERSION, generator: 'durablePOA' },
    blocks,
    flags,
    execution: dpoaExecution(),
  }
}

function executionBlocks(ctx: IntakeContext, name: string): Block[] {
  const blocks: Block[] = []
  blocks.push(spacer(1))
  blocks.push(
    para([
      bold('IN WITNESS WHEREOF, '),
      `I have signed this Durable Power of Attorney on the date written below, in the presence of two subscribing witnesses and a notary public.`,
    ])
  )
  blocks.push({
    kind: 'signatureBlock',
    lines: [{ role: 'Principal', name, withDate: true, caption: `${name}, Principal` }],
  })
  blocks.push(
    para([
      `Signed by the Principal, `,
      bold(name),
      `, in our presence, and by us in the presence of the Principal and of each other, on the date above written.`,
    ])
  )
  blocks.push({
    kind: 'signatureBlock',
    lines: [
      { role: 'Witness', caption: 'Signature / Printed name / Address' },
      { role: 'Witness', caption: 'Signature / Printed name / Address' },
    ],
  })

  blocks.push(spacer(1))
  blocks.push({ kind: 'heading', level: 1, text: 'Notary Acknowledgment', ref: 'notary' })
  blocks.push({
    kind: 'notaryBlock',
    text: [
      [bold('STATE OF FLORIDA'), '  COUNTY OF ' + (ctx.testator.county?.toUpperCase() || '____________')],
      [
        `The foregoing instrument was acknowledged before me by means of ☐ physical presence or ☐ online notarization on __________________ by `,
        bold(name),
        `, the Principal, who is personally known to me or who produced ____________________ as identification, and by the witnesses named above.`,
      ],
    ],
  })
  blocks.push({
    kind: 'signatureBlock',
    lines: [{ role: 'Notary Public, State of Florida', caption: 'My commission expires: __________' }],
  })
  blocks.push({ kind: 'fillIn', label: 'Notary commission number', note: 'affix seal' })
  return blocks
}
