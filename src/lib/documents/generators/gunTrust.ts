// Firearms (NFA) Trust — Florida. A revocable trust that holds Title I
// firearms and Title II / NFA items (suppressors, short-barreled rifles and
// shotguns, machine guns). It keeps possession and transfer lawful: it bars
// prohibited persons, requires compliance with the National Firearms Act and
// Gun Control Act, and on the grantor's death distributes each firearm only to
// a beneficiary legally entitled to possess it, otherwise selling it through a
// licensed dealer and passing the proceeds instead. The intake captures only
// whether the client owns firearms, so Schedule A is left blank for the
// attorney and client to complete.

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
  fullName,
  gunTrustExecution,
  joinAnd,
  residence,
  successionSentence,
} from './shared'

export function generateGunTrust(ctx: IntakeContext): DocumentModel {
  const blocks: Block[] = []
  const flags: ReviewFlag[] = []
  const name = fullName(ctx)
  const tName = `The ${ctx.testator.fullName || '[CLIENT NAME]'} Firearms Trust`

  blocks.push(title('Firearms Trust Agreement', tName))
  blocks.push(spacer(1))
  blocks.push(
    para([
      'This Firearms Trust Agreement is made by ',
      { text: name, bold: true },
      `, of ${residence(ctx)}, as grantor (the "Grantor") and as initial trustee (the "Trustee"). This trust is established to acquire, hold, and lawfully possess firearms, including firearms regulated under the National Firearms Act, and to provide for their lawful use and transfer. This trust may be referred to as `,
      { text: `${tName} dated ______________, 20___`, bold: true },
      '.',
    ])
  )

  // Article I — Purpose; revocability.
  blocks.push(article('I', 'Purpose'))
  blocks.push(
    clause(
      '1.1',
      'The purpose of this trust is to acquire, hold, possess, administer, and lawfully transfer firearms and related items for the benefit of the Grantor during the Grantor’s lifetime and for the beneficiaries named below, in each case only in a manner permitted by applicable federal and Florida law.'
    )
  )
  blocks.push(
    clause(
      '1.2',
      'This is a revocable trust. During the Grantor’s lifetime, while the Grantor has capacity, the Grantor may amend or revoke this trust in whole or in part by a signed writing delivered to the Trustee.'
    )
  )

  // Article II — Trustees; only lawful possessors may serve.
  blocks.push(article('II', 'Trustees'))
  blocks.push(clause('2.1', `The Grantor, ${name}, shall serve as initial Trustee.`))
  blocks.push(
    clause(
      '2.2',
      successionSentence(
        'successor Trustee, and any co-Trustee, to serve upon the Grantor’s resignation, incapacity, or death',
        ctx.fiduciaries.trustees,
        'the'
      )
    )
  )
  if (ctx.fiduciaries.trustees.length === 0) {
    flags.push(
      flag(
        'NO_SUCCESSOR_TRUSTEE',
        'warning',
        'No successor or co-trustee was named for the firearms trust. Name a responsible person, legally entitled to possess firearms, to serve on the grantor’s incapacity or death.',
        'Fla. Stat. 736.0704'
      )
    )
  }
  blocks.push(
    clause(
      '2.3',
      'A person may serve as Trustee or co-Trustee, and may exercise any power over firearms held in this trust, only if that person may lawfully possess firearms under federal and Florida law. No person who is a Prohibited Person, as defined in Article III, may serve as Trustee or have access to any firearm held in this trust.'
    )
  )

  // Article III — Prohibited persons and unlawful possession.
  blocks.push(article('III', 'Prohibited Persons'))
  blocks.push(
    clause(
      '3.1',
      'A "Prohibited Person" is any person who is prohibited from receiving, possessing, shipping, or transporting firearms or ammunition under 18 U.S.C. § 922(g) or any other provision of federal law, or under the laws of the State of Florida.'
    )
  )
  blocks.push(
    clause(
      '3.2',
      'Notwithstanding any other provision of this trust, no firearm or other trust property may be transferred to, or possessed by, any Prohibited Person, and no Trustee shall permit any Prohibited Person to possess, use, or have access to any firearm held in this trust.'
    )
  )
  blocks.push(
    clause(
      '3.3',
      'No firearm held in this trust may be possessed, carried, stored, transported, or used in any place, or in any manner, where such possession or use is unlawful under federal, state, or local law.'
    )
  )

  // Article IV — Compliance with the NFA and GCA.
  blocks.push(article('IV', 'Compliance With Firearms Laws'))
  blocks.push(
    clause(
      '4.1',
      'The Trustee shall at all times administer this trust in compliance with the National Firearms Act (26 U.S.C. ch. 53), the Gun Control Act of 1968 (18 U.S.C. ch. 44), the regulations of the Bureau of Alcohol, Tobacco, Firearms and Explosives at 27 C.F.R. Parts 478 and 479, and all applicable Florida law.'
    )
  )
  blocks.push(
    clause(
      '4.2',
      'No firearm regulated under the National Firearms Act (an "NFA Firearm"), including any suppressor, short-barreled rifle, short-barreled shotgun, or machine gun, shall be acquired, made, or transferred except in compliance with the National Firearms Act and only after all required approvals of the Bureau of Alcohol, Tobacco, Firearms and Explosives — including approval of the applicable ATF form — have been obtained.'
    )
  )

  // Article V — Trustee powers over firearms.
  blocks.push(article('V', 'Powers of the Trustee'))
  blocks.push(
    clause(
      '5.1',
      'Subject to the restrictions in this trust and to applicable law, the Trustee shall have power to acquire, purchase, make, hold, possess, insure, maintain, use, lend (only to a person legally entitled to possess the item), and transfer firearms, including NFA Firearms, and to expend trust funds and take all actions necessary to obtain any required governmental approval of any such acquisition, making, or transfer, subject in each case to approval by the Bureau of Alcohol, Tobacco, Firearms and Explosives where required.'
    )
  )
  blocks.push(
    clause(
      '5.2',
      'The Trustee shall also have the powers granted to trustees under Florida law, exercisable without court authorization, to the extent consistent with the firearms-related purpose and restrictions of this trust.'
    )
  )

  // Article VI — Distribution on the grantor's death.
  blocks.push(article('VI', 'Distribution Upon the Grantor’s Death'))
  const benes = ctx.distribution.residuary.map((b) => b.name).filter((bn) => bn.length > 0)
  if (benes.length) {
    blocks.push(
      clause('6.1', [
        'Upon the Grantor’s death, the Trustee shall distribute the firearms and other trust property to the following beneficiaries: ',
        { text: joinAnd(benes), bold: true },
        ', in the shares and manner provided in this Article.',
      ])
    )
  } else if (ctx.hasDescendants) {
    blocks.push(
      clause(
        '6.1',
        'Upon the Grantor’s death, the Trustee shall distribute the firearms and other trust property to the Grantor’s then-living descendants, per stirpes, in the manner provided in this Article.'
      )
    )
  } else {
    blocks.push(
      clause(
        '6.1',
        'Upon the Grantor’s death, the Trustee shall distribute the firearms and other trust property to the Grantor’s heirs at law, determined under the laws of the State of Florida then in effect, in the manner provided in this Article.'
      )
    )
  }
  blocks.push(
    clause(
      '6.2',
      'A firearm may be distributed to a beneficiary only if, at the time of distribution, that beneficiary is legally entitled to receive and possess it under federal and Florida law, and, for any NFA Firearm, only after any required transfer approval of the Bureau of Alcohol, Tobacco, Firearms and Explosives has been obtained.'
    )
  )
  blocks.push(
    clause(
      '6.3',
      'If a beneficiary otherwise entitled to a firearm is not legally entitled to possess it, or is a Prohibited Person, that firearm shall not be distributed to that beneficiary. Instead, the Trustee shall sell or transfer the firearm through a licensed firearms dealer (and, for an NFA Firearm, through the required approval process of the Bureau of Alcohol, Tobacco, Firearms and Explosives), and the net proceeds shall pass to that beneficiary in place of the firearm.'
    )
  )

  // Schedule A — firearm inventory. Intake captures an approximate count and
  // whether NFA items are involved, but not a per-firearm inventory, so we size
  // the blank rows to the stated count and note the NFA detail.
  blocks.push({ kind: 'pageBreak' })
  blocks.push({ kind: 'heading', level: 1, text: 'Schedule A — Firearms Held in Trust' })
  blocks.push(
    para(
      'List each firearm transferred to or held by this trust. For each firearm, include the make, model, type, caliber or gauge, and serial number. For any NFA Firearm, identify it as such and note the applicable ATF form and approval. Additional firearms may be added by supplementing this Schedule.'
    )
  )
  if (ctx.assets.nfaDetail) {
    blocks.push(para([{ text: 'Client-reported NFA items: ', bold: true }, ctx.assets.nfaDetail]))
  }
  const count = ctx.assets.firearmsCount
  const rowCount = Math.min(Math.max(count && count > 0 ? count : 5, 3), 20)
  for (let i = 1; i <= rowCount; i++) {
    blocks.push({
      kind: 'fillIn',
      label: `Firearm ${i}`,
      note: 'Make / model / type / caliber or gauge / serial number; NFA item (Y/N) and ATF approval, if any.',
    })
  }

  // Execution — grantor and trustee sign before a notary (two witnesses
  // recommended).
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
      { role: 'Trustee', name, withDate: true, caption: `${name}, Trustee` },
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
        ', as Grantor and Trustee, on ______________, 20___, who is personally known to me or produced ____________________ as identification.',
      ],
    ],
  })
  blocks.push({
    kind: 'signatureBlock',
    lines: [{ role: 'Notary Public, State of Florida', caption: 'My commission expires: __________' }],
  })

  flags.push(
    flag(
      'NFA_APPROVAL',
      'caution',
      'Any NFA item (suppressor, short-barreled rifle or shotgun, or machine gun) requires transfer approval by the Bureau of Alcohol, Tobacco, Firearms and Explosives (e.g., ATF Form 4) before it may be acquired or transferred, and each responsible person of the trust must comply with 27 C.F.R. Parts 478 and 479, including the responsible-person requirements and CLEO notification.',
      '26 U.S.C. ch. 53; 27 C.F.R. Parts 478, 479'
    )
  )
  if (ctx.assets.hasNFAItems) {
    flags.push(
      flag(
        'NFA_ITEMS_PRESENT',
        'warning',
        `Client indicated NFA item(s)${ctx.assets.nfaDetail ? ` — "${ctx.assets.nfaDetail}"` : ''}. A trust is strongly indicated; each item requires ATF transfer approval, and the trust must be finalized before any NFA acquisition (Form 1) or transfer (Form 4).`,
        '26 U.S.C. ch. 53'
      )
    )
  }
  if (ctx.assets.firearmsRecipient) {
    flags.push(
      flag(
        'FIREARMS_RECIPIENT',
        'info',
        `Client’s stated intended recipient of the firearms: "${ctx.assets.firearmsRecipient}". Confirm that person is legally eligible to possess each firearm (and any NFA item) before distribution.`
      )
    )
  }
  flags.push(
    flag(
      'SCHEDULE_A_INVENTORY',
      'caution',
      `Complete the Schedule A firearm inventory${ctx.assets.firearmsCount ? ` (client reported approximately ${ctx.assets.firearmsCount})` : ''} and confirm the treatment of any NFA items with the attorney before funding the trust.`,
      'Attorney checklist — firearms inventory'
    )
  )
  if (!ctx.assets.ownsFirearms) {
    flags.push(
      flag(
        'NO_FIREARMS_INDICATED',
        'info',
        'The intake did not indicate the client owns firearms. Confirm the client intends to establish a firearms trust and identify the firearms it will hold.'
      )
    )
  }

  return {
    type: 'GUN_TRUST',
    title: `${tName} Agreement`,
    meta: { jurisdiction: 'FL', engineVersion: ENGINE_VERSION, generator: 'gunTrust' },
    blocks,
    flags,
    execution: gunTrustExecution(),
  }
}
