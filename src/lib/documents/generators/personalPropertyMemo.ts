// Personal Property Memorandum (Florida). A separate writing, authorized by
// Section 732.515, Florida Statutes, that disposes of items of TANGIBLE personal
// property and is referenced by (and given effect through) the client's will or
// revocable trust. It reaches only tangible things — not money, real estate,
// business interests, or other intangibles — may be created or changed at any
// time without a lawyer, and is effective only if signed by the client and
// describing the items and recipients with reasonable certainty.

import {
  flag,
  heading,
  para,
  spacer,
  title,
  type Block,
  type DocumentModel,
  type ReviewFlag,
} from '../blocks'
import type { IntakeContext } from '../context'
import { ENGINE_VERSION, fullName, memoExecution } from './shared'

/** Number of blank item/recipient rows provided for the client to complete. */
const BLANK_ROWS = 10

export function generatePersonalPropertyMemo(ctx: IntakeContext): DocumentModel {
  const blocks: Block[] = []
  const flags: ReviewFlag[] = []
  const name = fullName(ctx)

  blocks.push(title('Memorandum of Tangible Personal Property', `of ${name}`))
  blocks.push(spacer(1))

  // Purpose and effect
  blocks.push(
    para([
      `I, `,
      { text: name, bold: true },
      `, make this written statement to dispose of items of my tangible personal property. I make it under, and intend it to be given effect as authorized by, Section 732.515, Florida Statutes, and I refer to it in my `,
      { text: 'Last Will and Testament (or Revocable Living Trust) dated ______________, 20___', bold: true },
      `.`,
    ])
  )

  blocks.push(heading('What this memorandum can and cannot do', 2))
  blocks.push(
    para(
      'This memorandum disposes of tangible personal property only — things I can touch, such as jewelry, furniture, artwork, collections, tools, household goods, vehicles, and other personal effects. It does NOT dispose of money, cash, bank or brokerage accounts, stocks, bonds, or other intangible property; real estate; or any interest in a business used in a trade or business. Any of those pass under my will or trust, not under this memorandum.'
    )
  )
  blocks.push(
    para(
      'I may prepare or change this memorandum at any time, before or after signing my will or trust, and I may do so without a lawyer. To be effective, the writing must be signed by me and must describe each item and each recipient with reasonable certainty. If any item listed below is not effectively disposed of by this memorandum, it passes under my will or trust.'
    )
  )
  blocks.push(
    para([
      { text: 'How to complete this list: ', bold: true },
      'describe each item clearly enough that it can be identified (for example, "my mother’s diamond engagement ring," not just "a ring"), and name each recipient by full name. If a recipient does not survive me, the item passes under my will or trust unless I state otherwise on the line.',
    ])
  )

  // The item / recipient rows
  blocks.push(spacer(1))
  blocks.push(heading('Distribution of Tangible Personal Property', 2))
  blocks.push(
    para([
      { text: 'Item of tangible personal property', bold: true },
      '  →  ',
      { text: 'Recipient (full name)', bold: true },
    ])
  )
  for (let i = 1; i <= BLANK_ROWS; i++) {
    blocks.push({
      kind: 'fillIn',
      label: `${i}. Item description`,
      note: 'Recipient (full name): ______________________________',
    })
  }
  blocks.push(
    para([
      { text: 'Additional items. ', italic: true },
      'I may attach further signed and dated pages using the same format, and each such page is part of this memorandum.',
    ])
  )

  // Signature
  blocks.push(spacer(1))
  blocks.push(
    para([
      'I sign this Memorandum of Tangible Personal Property, and I declare that it expresses my wishes for the disposition of the tangible personal property described above.',
    ])
  )
  blocks.push({
    kind: 'signatureBlock',
    lines: [{ role: 'Testator', name, withDate: true, caption: `${name}` }],
  })

  // --- Attorney review flags ---
  if (!ctx.usePersonalPropertyMemo) {
    flags.push(
      flag(
        'MEMO_NOT_REFERENCED',
        'caution',
        'The intake did not indicate that the client wants a personal-property memorandum. For this writing to be effective, the client’s will or trust must refer to a separate writing under Section 732.515 — confirm the will/trust contains that reference.',
        'Fla. Stat. 732.515'
      )
    )
  }
  flags.push(
    flag(
      'MEMO_TANGIBLE_ONLY',
      'info',
      'Remind the client that this memorandum reaches tangible personal property only and must be signed to be effective; money, real estate, accounts, and business interests cannot be given through it.',
      'Fla. Stat. 732.515'
    )
  )

  return {
    type: 'PERSONAL_PROPERTY_MEMORANDUM',
    title: `Memorandum of Tangible Personal Property of ${name}`,
    meta: { jurisdiction: 'FL', engineVersion: ENGINE_VERSION, generator: 'personalPropertyMemo' },
    blocks,
    flags,
    execution: memoExecution(),
  }
}
