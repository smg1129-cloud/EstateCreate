// Florida Designation of Health Care Surrogate (Fla. Stat. 765.202 / 765.203).
// Deterministic assembly from IntakeContext.
//
// Structure: designation of surrogate(s) with a line of succession, scope of
// authority (health care decisions, access to records, benefits), the timing of
// the surrogate's authority (concurrent under 765.204(4) or only upon
// incapacity), a HIPAA access authorization, optional non-binding guidance from
// the client, and the two-adult-witness execution block (no notary required).

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
import { ENGINE_VERSION, fullName, residence, successionSentence, surrogateExecution } from './shared'

export function generateHealthCareSurrogate(ctx: IntakeContext): DocumentModel {
  const blocks: Block[] = []
  const flags: ReviewFlag[] = []
  const name = fullName(ctx)
  const surrogates = ctx.fiduciaries.surrogates

  blocks.push(title('Designation of Health Care Surrogate', `of ${name}`))
  blocks.push(spacer(1))

  // Exordium
  blocks.push(
    para([
      `I, `,
      bold(name),
      `, a resident of ${residence(ctx)}, being of sound mind, willfully and voluntarily make this Designation of Health Care Surrogate under Sections 765.202 and 765.203, Florida Statutes.`,
    ])
  )

  // Article I — Designation of surrogate
  blocks.push(article('I', 'Designation of Health Care Surrogate', 'art-surrogate'))
  blocks.push(clause('1.1', successionSentence('health care surrogate', surrogates)))
  if (surrogates.length === 0) {
    flags.push(
      flag('NO_SURROGATE', 'warning', 'No health care surrogate was provided. Confirm a nominee before execution.', 'Fla. Stat. 765.202')
    )
  }
  blocks.push(
    clause('1.2', 'Each alternate surrogate shall serve only when every surrogate named before that alternate is unable, unwilling, or unavailable to serve. A health care provider may rely on the authority of a surrogate or alternate who represents that the prior surrogate is not available.')
  )

  // Article II — Timing of authority
  blocks.push(article('II', 'When My Surrogate May Act', 'art-timing'))
  if (ctx.health.surrogateNow) {
    blocks.push(
      clause('2.1', [
        bold('My surrogate may act while I retain capacity. '),
        `Under Section 765.204(4), Florida Statutes, I authorize my surrogate to make health care decisions for me, to receive my health information, and to consult with my health care providers concurrently with me, whether or not I have been determined to lack capacity, unless I object at the time. My surrogate’s authority is not limited to periods of my incapacity.`,
      ])
    )
  } else {
    blocks.push(
      clause('2.1', [
        bold('My surrogate may act upon my incapacity. '),
        `My surrogate’s authority to make health care decisions for me begins when my attending or treating physician, together with a second physician where required, determines in accordance with Section 765.204, Florida Statutes, that I lack the capacity to make my own health care decisions, and it continues while that incapacity persists. My authority to make my own decisions is restored whenever I regain capacity.`,
      ])
    )
  }

  // Article III — Authority granted
  blocks.push(article('III', 'Authority of My Surrogate', 'art-authority'))
  blocks.push(clause('3.1', 'When authorized to act, my surrogate may make all health care decisions for me that I could make for myself, including without limitation the authority to:'))
  blocks.push(
    list(
      [
        'Consent to, refuse, or withdraw consent to any medical or surgical procedure, treatment, medication, diagnostic test, or other health care;',
        'Select and discharge health care providers and institutions, and arrange for my admission to or discharge from hospitals, nursing homes, hospice, and other facilities;',
        'Access, receive, review, and consent to the release of my medical records and health information as necessary to make informed decisions;',
        'Apply for and manage public and private health care benefits on my behalf, including Medicare, Medicaid, and insurance benefits;',
        'Authorize or refuse the provision of pain relief and palliative care; and',
        'Make anatomical gifts and decisions concerning my remains to the extent permitted by law and consistent with any separate living will or declaration I have made.',
      ],
      { ordered: false, ref: 'surrogate-authority' }
    )
  )
  blocks.push(
    clause('3.2', 'My surrogate shall make decisions in accordance with my known wishes and, where my wishes are not known, in my best interest, considering my personal, philosophical, and religious values. This designation does not authorize my surrogate to override any specific direction I have given in a living will or other advance directive.')
  )

  // Article IV — HIPAA authorization
  blocks.push(article('IV', 'Authority to Receive Health Information (HIPAA)', 'art-hipaa'))
  blocks.push(
    clause('4.1', 'I intend for my surrogate to be treated as my personal representative for purposes of the Health Insurance Portability and Accountability Act of 1996 (HIPAA) and its implementing regulations, 45 C.F.R. Parts 160 and 164. I authorize any physician, health care professional, hospital, clinic, laboratory, pharmacy, or other health care provider, and any health plan, to disclose to my surrogate my individually identifiable health information and medical records, including information relating to mental health, substance use, and communicable diseases, to the extent permitted by law. This authority exists whether or not I have been determined to lack capacity.')
  )

  // Article V — Guidance (optional)
  if (ctx.health.wishes) {
    blocks.push(article('V', 'Statement of Wishes', 'art-wishes'))
    blocks.push(
      clause('5.1', [
        `The following statement of my wishes is intended to guide my surrogate. It is a statement of my values and preferences and is not a binding direction: `,
        { text: ctx.health.wishes, italic: true },
        '.',
      ])
    )
  }

  // Execution — two adult witnesses (no notary)
  blocks.push(...executionBlocks(name))

  return {
    type: 'HEALTH_CARE_SURROGATE',
    title: `Designation of Health Care Surrogate of ${name}`,
    meta: { jurisdiction: 'FL', engineVersion: ENGINE_VERSION, generator: 'healthCareSurrogate' },
    blocks,
    flags,
    execution: surrogateExecution(),
  }
}

function executionBlocks(name: string): Block[] {
  const blocks: Block[] = []
  blocks.push(spacer(1))
  blocks.push(
    para([
      bold('IN WITNESS WHEREOF, '),
      `I have signed this Designation of Health Care Surrogate on the date written below, in the presence of the two witnesses named below.`,
    ])
  )
  blocks.push({
    kind: 'signatureBlock',
    lines: [{ role: 'Principal', name, withDate: true, caption: `${name}, Principal` }],
  })
  blocks.push(
    para([
      `The Principal, `,
      bold(name),
      `, signed this designation in our presence. We are each an adult, and at least one of us is neither the Principal’s spouse nor a blood relative of the Principal. The person designated as surrogate has not acted as a witness.`,
    ])
  )
  blocks.push({
    kind: 'signatureBlock',
    lines: [
      { role: 'Witness', caption: 'Signature / Printed name / Address' },
      { role: 'Witness', caption: 'Signature / Printed name / Address' },
    ],
  })
  return blocks
}
