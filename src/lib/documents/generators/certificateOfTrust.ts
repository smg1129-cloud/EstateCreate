// Certification of Trust (Florida). A short, signed-and-notarized instrument a
// trustee gives a bank, title company, or other third party — under Section
// 736.1017, Florida Statutes — to prove the trust exists and the trustee has
// authority, without disclosing the full trust agreement. It certifies the
// client's revocable living trust (see revocableTrust.ts for the trust itself).

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
  certificateExecution,
  fullName,
  residence,
  successionSentence,
} from './shared'
import { trustName } from './revocableTrust'

export function generateCertificateOfTrust(ctx: IntakeContext): DocumentModel {
  const blocks: Block[] = []
  const flags: ReviewFlag[] = []
  const name = fullName(ctx)
  const tName = trustName(ctx)

  blocks.push(title('Certification of Trust', tName))
  blocks.push(spacer(1))
  blocks.push(
    para([
      'This Certification of Trust is made under Section 736.1017, Florida Statutes, by the undersigned currently acting Trustee, to confirm the existence of the trust described below and the Trustee’s authority to act with respect to trust property, without the need to disclose the full trust instrument.',
    ])
  )

  // Article I — The trust, its date, revocability, and the grantor.
  blocks.push(article('I', 'The Trust'))
  blocks.push(
    clause('1.1', [
      'The trust is known as ',
      { text: `${tName} dated ______________, 20___`, bold: true },
      ' (the "Trust").',
    ])
  )
  blocks.push(
    clause('1.2', [
      'The grantor of the Trust is ',
      { text: name, bold: true },
      `, of ${residence(ctx)} (the "Grantor").`,
    ])
  )
  blocks.push(
    clause(
      '1.3',
      'The Trust is presently in existence and has not been terminated. The Trust is a revocable trust, and the Grantor has reserved the right to amend or revoke it during the Grantor’s lifetime while the Grantor has capacity.'
    )
  )

  // Article II — Currently acting trustee (grantor) and the line of succession.
  blocks.push(article('II', 'Trustee and Succession'))
  blocks.push(
    clause('2.1', `The Grantor, ${name}, is the currently acting Trustee of the Trust.`)
  )
  const trustees = ctx.fiduciaries.trustees.length
    ? ctx.fiduciaries.trustees
    : ctx.fiduciaries.personalReps
  blocks.push(
    clause(
      '2.2',
      successionSentence(
        'successor Trustee, to serve upon the Grantor’s resignation, incapacity, or death',
        trustees,
        'the'
      )
    )
  )
  if (trustees.length === 0) {
    flags.push(
      flag(
        'NO_SUCCESSOR_TRUSTEE',
        'warning',
        'No successor trustee was provided for the certification. Confirm the successor named in the executed trust before this certification is used.',
        'Fla. Stat. 736.0704'
      )
    )
  }

  // Article III — Powers of the trustee over trust property.
  blocks.push(article('III', 'Powers of the Trustee'))
  blocks.push(
    clause(
      '3.1',
      'The Trustee is authorized to acquire, sell, convey, exchange, lease, mortgage, pledge, borrow money and pledge trust property as security, invest and reinvest, and otherwise manage and deal with the real and personal property of the Trust, and to execute all instruments necessary or convenient to do so.'
    )
  )

  // Article IV — No inconsistent revocation or amendment.
  blocks.push(article('IV', 'Trust Not Revoked or Amended'))
  blocks.push(
    clause(
      '4.1',
      'The Trust has not been revoked, modified, or amended in any manner that would cause any representation in this Certification to be incorrect.'
    )
  )

  // Article V — Manner of taking title to trust property.
  blocks.push(article('V', 'Manner of Taking Title'))
  blocks.push(
    clause('5.1', [
      'Title to property of the Trust is to be taken in the following form: ',
      { text: `${name}, as Trustee of ${tName} dated ______________, 20___`, bold: true },
      ', and in the name of any successor Trustee then acting, in like form.',
    ])
  )

  // Article VI — Third-party reliance and the trustee's declaration.
  blocks.push(article('VI', 'Reliance by Third Parties'))
  blocks.push(
    clause(
      '6.1',
      'Under Section 736.1017(4), Florida Statutes, a person who acts in reliance upon this Certification of Trust without knowledge that the representations contained in it are incorrect is not liable to any person for so acting, and may assume without inquiry the existence of the facts contained in it.'
    )
  )
  blocks.push(
    clause(
      '6.2',
      'This Certification of Trust is signed by a currently acting Trustee of the Trust, who declares under penalty of perjury that the representations contained in it are true and correct and that the Trust has not been revoked or amended in any manner that would cause the representations to be incorrect.'
    )
  )

  // Execution — a currently acting trustee swears to it before a notary.
  blocks.push(spacer(1))
  blocks.push(
    para([
      { text: 'IN WITNESS WHEREOF, ', bold: true },
      'the undersigned currently acting Trustee has executed this Certification of Trust on the date written below.',
    ])
  )
  blocks.push({
    kind: 'signatureBlock',
    lines: [{ role: 'Trustee', name, withDate: true, caption: `${name}, Trustee` }],
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
        ', as Trustee, on ______________, 20___, who is personally known to me or produced ____________________ as identification.',
      ],
    ],
  })
  blocks.push({
    kind: 'signatureBlock',
    lines: [{ role: 'Notary Public, State of Florida', caption: 'My commission expires: __________' }],
  })

  flags.push(
    flag(
      'TRUST_DATE',
      'info',
      'The date of the Trust must be completed so that it matches the date of the executed trust instrument. A blank or mismatched date defeats the certification.',
      'Fla. Stat. 736.1017'
    )
  )

  return {
    type: 'CERTIFICATE_OF_TRUST',
    title: 'Certification of Trust',
    meta: { jurisdiction: 'FL', engineVersion: ENGINE_VERSION, generator: 'certificateOfTrust' },
    blocks,
    flags,
    execution: certificateExecution(),
  }
}
