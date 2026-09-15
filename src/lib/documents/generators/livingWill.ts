// Florida Living Will Declaration (Fla. Stat. 765.302 / 765.303). Deterministic
// assembly from IntakeContext.
//
// Structure: declaration and the three statutory triggering conditions
// (terminal condition, end-stage condition, persistent vegetative state), the
// client's direction on life-prolonging procedures (withhold / continue / leave
// to the surrogate), artificial nutrition and hydration, comfort/palliative
// care, an anatomical-gift statement, designation of the surrogate to carry out
// the declaration, and the two-adult-witness execution block (no notary).

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
  type Run,
} from '../blocks'
import type { IntakeContext } from '../context'
import { ENGINE_VERSION, fidName, fullName, livingWillExecution, residence } from './shared'

export function generateLivingWill(ctx: IntakeContext): DocumentModel {
  const blocks: Block[] = []
  const flags: ReviewFlag[] = []
  const name = fullName(ctx)
  const surrogates = ctx.fiduciaries.surrogates

  blocks.push(title('Living Will Declaration', `of ${name}`))
  blocks.push(spacer(1))

  // Exordium
  blocks.push(
    para([
      `I, `,
      bold(name),
      `, a resident of ${residence(ctx)}, being of sound mind, willfully and voluntarily make known my desires that my dying not be artificially prolonged under the circumstances set out below, and I make this declaration under Sections 765.302 and 765.303, Florida Statutes.`,
    ])
  )

  // Article I — Triggering conditions
  blocks.push(article('I', 'When This Declaration Applies', 'art-conditions'))
  blocks.push(
    clause('1.1', 'This declaration applies if, at any time, I am incapacitated and my attending or treating physician and a second consulting physician have determined that there is no reasonable medical probability of my recovery from any one of the following conditions:')
  )
  blocks.push(
    list(
      [
        'A terminal condition, meaning a condition caused by injury, disease, or illness from which, to a reasonable degree of medical certainty, there is no medical probability of recovery and that, without treatment, can be expected to cause death;',
        'An end-stage condition, meaning an irreversible condition caused by injury, disease, or illness that has resulted in progressively severe and permanent deterioration, and for which, to a reasonable degree of medical certainty, treatment would be ineffective; or',
        'A persistent vegetative state, meaning a permanent and irreversible condition of unconsciousness in which there is an absence of voluntary action or cognitive behavior of any kind and an inability to communicate or interact purposefully with the environment.',
      ],
      { ordered: false, ref: 'triggering-conditions' }
    )
  )

  // Article II — Life-prolonging procedures
  blocks.push(article('II', 'Life-Prolonging Procedures', 'art-life-prolonging'))
  if (ctx.health.lifeProlonging === 'withhold') {
    blocks.push(
      clause('2.1', [
        bold('I direct that life-prolonging procedures be withheld or withdrawn. '),
        `If I am in any of the conditions described in Article I, I direct that life-prolonging procedures be withheld or withdrawn when their application would serve only to artificially prolong the process of my dying, and that I be permitted to die naturally with only the administration of medication or the performance of any medical procedure deemed necessary to provide me with comfort care or to alleviate pain.`,
      ])
    )
    blocks.push(
      clause('2.2', [
        `As to artificial nutrition and hydration: `,
        ctx.health.withholdNutrition
          ? bold('I direct that the provision of nutrition and hydration by artificial means be withheld or withdrawn along with other life-prolonging procedures.')
          : bold('I direct that nutrition and hydration by artificial means be provided and continued, even if all other life-prolonging procedures are withheld or withdrawn.'),
      ])
    )
  } else if (ctx.health.lifeProlonging === 'continue') {
    blocks.push(
      clause('2.1', [
        bold('I direct that life-prolonging procedures be provided. '),
        `If I am in any of the conditions described in Article I, I direct that life-prolonging procedures, including nutrition and hydration by artificial means, be provided and continued to sustain my life to the greatest extent possible, consistent with reasonable medical standards and my comfort.`,
      ])
    )
    flags.push(
      flag(
        'LIVING_WILL_CONTINUE',
        'info',
        'Client elected to have life-prolonging procedures provided rather than withheld. Confirm this affirmative election is intended; this is the opposite of the typical living will.',
        'Fla. Stat. 765.302'
      )
    )
  } else {
    blocks.push(
      clause('2.1', [
        bold('I direct that my surrogate decide. '),
        `If I am in any of the conditions described in Article I, I direct that the decision whether to provide, withhold, or withdraw life-prolonging procedures, including nutrition and hydration by artificial means, be made by my health care surrogate named in Article IV, in accordance with my known wishes and my best interest.`,
      ])
    )
  }

  // Article III — Comfort care and anatomical gifts
  blocks.push(article('III', 'Comfort Care and Anatomical Gifts', 'art-comfort'))
  blocks.push(
    clause('3.1', ctx.health.comfortCare
      ? 'In all events, I direct that I be given medication and other palliative care sufficient to relieve pain and provide for my comfort and dignity, even if doing so may hasten my death.'
      : 'I direct that I be kept comfortable and free of pain to the extent reasonably possible, consistent with the other directions in this declaration.')
  )
  const organText =
    ctx.health.organDonation === 'yes_any'
      ? 'Upon my death, I give any needed organs, tissues, or parts of my body for any purpose authorized by law, including transplantation, therapy, research, and education, as an anatomical gift under Part V of Chapter 765, Florida Statutes.'
      : ctx.health.organDonation === 'yes_transplant'
        ? 'Upon my death, I give any needed organs, tissues, or parts of my body for the purpose of transplantation or therapy, as an anatomical gift under Part V of Chapter 765, Florida Statutes.'
        : 'I do not make an anatomical gift of my organs, tissues, or body parts by this declaration. This does not prevent a decision otherwise authorized by law.'
  blocks.push(clause('3.2', organText))

  // Article IV — Surrogate to carry out the declaration
  blocks.push(article('IV', 'Surrogate to Carry Out This Declaration', 'art-surrogate'))
  if (surrogates.length === 0) {
    blocks.push(
      clause('4.1', [
        `In the event my attending physician determines that I am unable to give directions regarding the use of life-prolonging procedures, I designate my health care surrogate to carry out the provisions of this declaration: `,
        { text: '[to be completed — no surrogate was provided]', italic: true },
        '.',
      ])
    )
    flags.push(
      flag('NO_SURROGATE_LIVING_WILL', 'warning', 'No surrogate was provided to carry out the living will. Confirm a nominee before execution.', 'Fla. Stat. 765.302(1)(c)')
    )
  } else {
    const first = surrogates[0]!
    const alternates = surrogates.slice(1)
    const runs: Run[] = [
      `In the event my attending physician determines that I am unable to give directions regarding the use of life-prolonging procedures, I designate `,
      bold(fidName(first)),
      ` to carry out the provisions of this declaration.`,
    ]
    for (let i = 0; i < alternates.length; i++) {
      const prev = i === 0 ? first : alternates[i - 1]!
      const cur = alternates[i]!
      runs.push(` If ${prev.fullName} is unable or unwilling to serve, I designate `, bold(fidName(cur)), '.')
    }
    blocks.push(clause('4.1', runs))
  }
  blocks.push(
    clause('4.2', 'It is my intention that this declaration be honored by my family and physicians as the final expression of my legal right to refuse or direct medical or surgical treatment, and I accept the consequences of that decision. I understand the full import of this declaration and am emotionally and mentally competent to make it.')
  )

  // Article V — Additional personal instructions (only if the client gave any).
  if (ctx.health.specificTreatments || ctx.health.dementiaWishes || ctx.health.wishes) {
    blocks.push(article('V', 'Additional Instructions', 'art-additional'))
    blocks.push(
      clause('5.1', 'The following are my personal instructions and wishes, which I direct be given effect to the extent consistent with the preceding provisions and applicable law:')
    )
    if (ctx.health.specificTreatments) {
      blocks.push(clause('5.2', [bold('Specific treatments. '), ctx.health.specificTreatments]))
    }
    if (ctx.health.dementiaWishes) {
      blocks.push(clause('5.3', [bold('If I develop dementia. '), ctx.health.dementiaWishes]))
    }
    if (ctx.health.wishes) {
      blocks.push(clause('5.4', [bold('Other wishes. '), ctx.health.wishes]))
    }
  }

  // Execution — two adult witnesses (no notary)
  blocks.push(...executionBlocks(name))

  return {
    type: 'LIVING_WILL',
    title: `Living Will Declaration of ${name}`,
    meta: { jurisdiction: 'FL', engineVersion: ENGINE_VERSION, generator: 'livingWill' },
    blocks,
    flags,
    execution: livingWillExecution(),
  }
}

function executionBlocks(name: string): Block[] {
  const blocks: Block[] = []
  blocks.push(spacer(1))
  blocks.push(
    para([
      bold('IN WITNESS WHEREOF, '),
      `I have signed this Living Will Declaration on the date written below, in the presence of the two witnesses named below.`,
    ])
  )
  blocks.push({
    kind: 'signatureBlock',
    lines: [{ role: 'Declarant', name, withDate: true, caption: `${name}, Declarant` }],
  })
  blocks.push(
    para([
      `The Declarant, `,
      bold(name),
      `, signed this declaration in our presence, and appeared to us to be of sound mind and acting willingly and free from duress. We are each an adult, and at least one of us is neither the Declarant’s spouse nor a blood relative of the Declarant.`,
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
