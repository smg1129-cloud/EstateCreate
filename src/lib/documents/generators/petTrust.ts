// Pet Trust (Florida). An enforceable trust for the care of the client's
// animals under Section 736.0408, Florida Statutes. A trustee holds and applies
// funds for the animals' care during their lives; a named person (or a
// court-appointed one) may enforce it; the trust ends when the last covered
// animal dies, and the remainder then passes on.

import {
  article,
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
import {
  ENGINE_VERSION,
  fidName,
  fullName,
  joinAnd,
  petTrustExecution,
  residence,
  successionSentence,
} from './shared'

export function generatePetTrust(ctx: IntakeContext): DocumentModel {
  const blocks: Block[] = []
  const flags: ReviewFlag[] = []
  const name = fullName(ctx)
  const tName = `The ${ctx.testator.fullName || '[CLIENT NAME]'} Pet Trust`

  blocks.push(title('Pet Trust Agreement', tName))
  blocks.push(spacer(1))
  blocks.push(
    para([
      'This Pet Trust Agreement is made by ',
      { text: name, bold: true },
      `, of ${residence(ctx)}, as grantor (the "Grantor"), to provide for the care of the animals described below. This trust is intended to be a valid and enforceable trust for the care of animals under Section 736.0408, Florida Statutes. This trust may be referred to as `,
      { text: `${tName} dated ______________, 20___`, bold: true },
      '.',
    ])
  )

  // Article I — The covered animals and their caregivers.
  blocks.push(article('I', 'The Covered Animals'))
  const pets = ctx.pets
  if (pets.length) {
    blocks.push(
      clause(
        '1.1',
        'This trust is created for the care of the following animal(s) alive during the Grantor’s lifetime (each a "Covered Animal"):'
      )
    )
    blocks.push(
      list(
        pets.map((pet) => {
          const type = pet.type ? ` (${pet.type})` : ''
          const cg = pet.caregiver ? `, to be cared for by ${pet.caregiver}` : ''
          return [`${pet.name || '[animal name]'}${type}${cg}.`]
        }),
        { ordered: true }
      )
    )
  } else {
    blocks.push(
      clause('1.1', [
        'This trust is created for the care of the following animal(s) alive during the Grantor’s lifetime (each a "Covered Animal"): ',
        { text: '[LIST ANIMALS — the name and type of each animal]', italic: true },
        '.',
      ])
    )
    flags.push(
      flag(
        'NO_PETS',
        'warning',
        'No animals were listed for the pet trust. Identify each covered animal (name and type) with the client; the trust must be for the care of one or more animals alive during the grantor’s lifetime.',
        'Fla. Stat. 736.0408(1)'
      )
    )
  }

  const caregivers = Array.from(
    new Set(pets.map((pet) => pet.caregiver).filter((c): c is string => Boolean(c)))
  )
  if (caregivers.length) {
    blocks.push(
      clause('1.2', [
        'The Grantor directs that physical custody and day-to-day care of the Covered Animals be entrusted to ',
        { text: joinAnd(caregivers), bold: true },
        ' (each a "Caregiver"), as indicated for each animal above. If a named Caregiver is unable or unwilling to serve, the Trustee shall select a suitable substitute Caregiver who will provide humane care for the affected animal.',
      ])
    )
  } else {
    blocks.push(
      clause('1.2', [
        'The Grantor directs that physical custody and day-to-day care of the Covered Animals be entrusted to a Caregiver selected by the Trustee. ',
        { text: '[Attorney to confirm caregiver — none was provided.]', italic: true },
      ])
    )
  }

  // Article II — Trustee to hold and manage the funds.
  blocks.push(article('II', 'Trustee'))
  const trustees = ctx.fiduciaries.trustees.length
    ? ctx.fiduciaries.trustees
    : ctx.fiduciaries.personalReps
  blocks.push(clause('2.1', successionSentence('Trustee of this trust', trustees, 'the')))
  blocks.push(
    clause(
      '2.2',
      'The Trustee shall hold, invest, and administer the trust property and shall apply it solely for the benefit of the Covered Animals as provided in this Agreement.'
    )
  )
  if (trustees.length === 0) {
    flags.push(
      flag(
        'NO_TRUSTEE',
        'warning',
        'No trustee was provided to manage the pet trust funds. Name a trustee to hold and apply the funds for the animals’ care.',
        'Fla. Stat. 736.0408(3)'
      )
    )
  }

  // Article III — Funding.
  blocks.push(article('III', 'Trust Funding'))
  const amount = ctx.petTrustAmount
  if (typeof amount === 'number') {
    blocks.push(
      clause('3.1', [
        'The Grantor transfers to the Trustee the sum of ',
        { text: `$${amount.toLocaleString()}`, bold: true },
        ', together with any other property later added, to be held and administered for the care of the Covered Animals.',
      ])
    )
  } else {
    blocks.push(
      clause(
        '3.1',
        'The Grantor transfers to the Trustee the amount stated below, together with any other property later added, to be held and administered for the care of the Covered Animals.'
      )
    )
    blocks.push({
      kind: 'fillIn',
      label: 'Amount used to fund the pet trust',
      note: 'Enter the dollar amount the Grantor transfers to the trust for the animals’ care.',
    })
  }

  // Article IV — Purpose and distributions.
  blocks.push(article('IV', 'Purpose and Distributions'))
  blocks.push(
    clause('4.1', 'The purpose of this trust is to provide for the care of the Covered Animals during their lives.')
  )
  blocks.push(
    clause(
      '4.2',
      'The Trustee shall distribute so much of the income and principal as the Trustee determines necessary for the health, food, grooming, veterinary care, boarding, and other maintenance needs of the Covered Animals, and may reimburse a Caregiver for reasonable expenses of providing that care.'
    )
  )
  blocks.push(
    clause(
      '4.3',
      'No portion of the trust property may be converted to the use of any person or used for any purpose other than the care of the Covered Animals and the payment of the Trustee’s reasonable compensation and the reasonable expenses of administering the trust.'
    )
  )

  // Article V — Enforcement.
  blocks.push(article('V', 'Enforcement'))
  const enforcerPool = [
    ...ctx.fiduciaries.personalReps,
    ...ctx.fiduciaries.guardians,
    ...ctx.fiduciaries.surrogates,
    ...ctx.fiduciaries.trustees,
  ]
  const enforcer = enforcerPool.length ? enforcerPool[0] : undefined
  if (enforcer) {
    blocks.push(
      clause('5.1', [
        'The Grantor appoints ',
        { text: fidName(enforcer), bold: true },
        ' as the person authorized to enforce this trust and to require the Trustee to apply the trust property for the care of the Covered Animals.',
      ])
    )
  } else {
    blocks.push(
      clause('5.1', [
        'The Grantor appoints the following person as the person authorized to enforce this trust and to require the Trustee to apply the trust property for the care of the Covered Animals: ',
        { text: '[NAME OF PERSON TO ENFORCE THE TRUST]', italic: true },
        '.',
      ])
    )
    blocks.push({
      kind: 'fillIn',
      label: 'Person appointed to enforce the pet trust',
      note: 'Name an individual to enforce the trust on the animals’ behalf.',
    })
  }
  blocks.push(
    clause(
      '5.2',
      'If no person named to enforce this trust is able or willing to serve, a person may be appointed by a court to enforce this trust under Section 736.0408(3), Florida Statutes.'
    )
  )

  // Article VI — Termination and remainder.
  blocks.push(article('VI', 'Termination and Remainder'))
  blocks.push(clause('6.1', 'This trust terminates upon the death of the last surviving Covered Animal.'))
  const backstop = ctx.distribution.ultimateBackstop
  if (backstop) {
    blocks.push(
      clause('6.2', [
        'Upon termination, the Trustee shall distribute the remaining trust property to ',
        { text: backstop, bold: true },
        '.',
      ])
    )
  } else if (ctx.hasDescendants) {
    blocks.push(
      clause(
        '6.2',
        'Upon termination, the Trustee shall distribute the remaining trust property to the Grantor’s then-living descendants, per stirpes; or if none, to the Grantor’s heirs at law determined under the laws of the State of Florida then in effect.'
      )
    )
  } else {
    blocks.push(
      clause(
        '6.2',
        'Upon termination, the Trustee shall distribute the remaining trust property to the Grantor’s heirs at law, determined under the laws of the State of Florida then in effect.'
      )
    )
  }

  // Article VII — General provisions.
  blocks.push(article('VII', 'General Provisions'))
  blocks.push(
    clause(
      '7.1',
      'Governing law. This Agreement shall be governed by and construed under the laws of the State of Florida.'
    )
  )

  // Execution — grantor and trustee sign before a notary (two witnesses
  // recommended).
  const firstTrustee = trustees.length ? trustees[0] : undefined
  blocks.push(spacer(1))
  blocks.push(
    para([
      { text: 'IN WITNESS WHEREOF, ', bold: true },
      'the Grantor and the Trustee have executed this Agreement on the date written below.',
    ])
  )
  blocks.push({
    kind: 'signatureBlock',
    lines: [
      { role: 'Grantor', name, withDate: true, caption: `${name}, Grantor` },
      {
        role: 'Trustee',
        name: firstTrustee?.fullName,
        withDate: true,
        caption: firstTrustee ? `${firstTrustee.fullName}, Trustee` : 'Trustee',
      },
    ],
  })
  blocks.push(
    para([
      'Signed by the Grantor in the presence of the witnesses below, and by the witnesses in the presence of the Grantor and of each other.',
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
      [
        { text: 'STATE OF FLORIDA', bold: true },
        '  COUNTY OF ' + (ctx.testator.county?.toUpperCase() || '____________'),
      ],
      [
        'Sworn to and subscribed before me by means of ☐ physical presence or ☐ online notarization by ',
        { text: name, bold: true },
        ', as Grantor, on ______________, 20___, who is personally known to me or produced ____________________ as identification.',
      ],
    ],
  })
  blocks.push({
    kind: 'signatureBlock',
    lines: [{ role: 'Notary Public, State of Florida', caption: 'My commission expires: __________' }],
  })

  flags.push(
    flag(
      'EXCESS_FUNDS',
      'info',
      'Under Section 736.0408, Florida Statutes, if a court determines that the trust property exceeds the amount required for the intended use, the excess is not held for the animals and is distributed as part of the remainder. Confirm the funding amount is reasonable for the animals’ expected care.',
      'Fla. Stat. 736.0408(3)'
    )
  )

  return {
    type: 'PET_TRUST',
    title: `${tName} Agreement`,
    meta: { jurisdiction: 'FL', engineVersion: ENGINE_VERSION, generator: 'petTrust' },
    blocks,
    flags,
    execution: petTrustExecution(),
  }
}
