// HIPAA Authorization for Release of Protected Health Information
// (45 C.F.R. 164.508). Deterministic assembly from IntakeContext.
//
// Structure: identification of the individual, the persons authorized to
// receive the information (the client's power-of-attorney agents and health care
// surrogates, plus any additional persons named in the intake), the information
// covered, the purpose, no-expiration-unless-revoked and right-to-revoke terms,
// a re-disclosure note, and a signature/date block. No witnesses or notary are
// required for a HIPAA authorization.

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
import { ENGINE_VERSION, fidName, fullName, hipaaExecution, residence } from './shared'

export function generateHipaaAuthorization(ctx: IntakeContext): DocumentModel {
  const blocks: Block[] = []
  const flags: ReviewFlag[] = []
  const name = fullName(ctx)

  blocks.push(title('HIPAA Authorization for Release of Health Information', `of ${name}`))
  blocks.push(spacer(1))

  // Exordium
  blocks.push(
    para([
      `I, `,
      bold(name),
      `, a resident of ${residence(ctx)}, make this authorization under the Health Insurance Portability and Accountability Act of 1996 (HIPAA) and its implementing privacy regulations, 45 C.F.R. Parts 160 and 164, to authorize the release of my protected health information to the persons named below.`,
    ])
  )

  // Article I — Authorized recipients
  blocks.push(article('I', 'Persons Authorized to Receive My Health Information', 'art-recipients'))

  const recipientItems: Run[][] = []
  for (const a of ctx.fiduciaries.poaAgents) {
    recipientItems.push([bold(fidName(a)), ', my agent under my durable power of attorney;'])
  }
  for (const s of ctx.fiduciaries.surrogates) {
    recipientItems.push([bold(fidName(s)), ', my health care surrogate;'])
  }
  for (const extra of parseAdditionalRecipients(ctx.health.hipaaRelease)) {
    recipientItems.push([bold(extra), ';'])
  }

  if (recipientItems.length > 0) {
    blocks.push(clause('1.1', 'I authorize the release of my protected health information to each of the following persons:'))
    blocks.push(list(recipientItems, { ordered: false, ref: 'recipients' }))
  } else {
    blocks.push(
      clause('1.1', [
        `I authorize the release of my protected health information to the following persons: `,
        { text: '[to be completed — no authorized recipients were provided]', italic: true },
        '.',
      ])
    )
    flags.push(
      flag('NO_HIPAA_RECIPIENTS', 'warning', 'No HIPAA recipients were provided (no agents, surrogates, or additional persons named). Confirm who should be authorized before execution.', '45 C.F.R. 164.508(c)(1)(iii)')
    )
  }
  blocks.push(
    clause('1.2', 'I authorize any physician, health care professional, dentist, health plan, hospital, clinic, laboratory, pharmacy, or other covered entity or business associate that has provided payment, treatment, or services to me, or that otherwise possesses my protected health information, to disclose that information to the persons named above.')
  )

  // Article II — Information covered
  blocks.push(article('II', 'Information Covered by This Authorization', 'art-information'))
  blocks.push(clause('2.1', 'This authorization applies to all of my individually identifiable health information and medical records, including but not limited to:'))
  blocks.push(
    list(
      [
        'Diagnoses, test and laboratory results, and treatment records;',
        'Prescription and medication history;',
        'Billing, payment, and insurance records; and',
        'Sensitive information, including information relating to mental health treatment, substance use and treatment, HIV/AIDS and other communicable diseases, and genetic information, to the extent permitted by law.',
      ],
      { ordered: false, ref: 'information-covered' }
    )
  )

  // Article III — Purpose
  blocks.push(article('III', 'Purpose', 'art-purpose'))
  blocks.push(
    clause('3.1', 'The purpose of this authorization is to enable my named representatives to make health care and financial decisions on my behalf and to manage my affairs, including consulting with my health care providers, coordinating my care, and applying for and administering benefits. At my request, the information may also be released to the persons named above for their own information.')
  )

  // Article IV — Duration and revocation
  blocks.push(article('IV', 'Duration, Revocation, and Re-Disclosure', 'art-duration'))
  blocks.push(
    clause('4.1', [
      bold('No expiration. '),
      `This authorization has no expiration date and remains in effect until I revoke it. It does not expire upon my disability or incapacity, and it continues after my death to the extent necessary for my personal representative to administer my estate and as otherwise permitted by law.`,
    ])
  )
  blocks.push(
    clause('4.2', [
      bold('Right to revoke. '),
      `I understand that I may revoke this authorization at any time by delivering a signed, written revocation to my health care provider or health plan, except to the extent that the provider or plan has already acted in reliance on it. Revocation of this authorization does not revoke any health care surrogate designation, power of attorney, or advance directive I have executed.`,
    ])
  )
  blocks.push(
    clause('4.3', [
      bold('Re-disclosure. '),
      `I understand that information disclosed under this authorization may be subject to re-disclosure by the recipient and may then no longer be protected by federal privacy regulations. I also understand that a covered entity generally may not condition treatment, payment, enrollment, or eligibility for benefits on whether I sign this authorization.`,
    ])
  )

  // Execution — signature and date (no witnesses or notary required)
  blocks.push(spacer(1))
  blocks.push(
    para([
      `I have read and understand this authorization, and I sign it voluntarily. A photocopy or electronic copy of this authorization shall be as valid as the original.`,
    ])
  )
  blocks.push({
    kind: 'signatureBlock',
    lines: [{ role: 'Signature of Individual', name, withDate: true, caption: `${name}` }],
  })

  return {
    type: 'HIPAA_AUTHORIZATION',
    title: `HIPAA Authorization of ${name}`,
    meta: { jurisdiction: 'FL', engineVersion: ENGINE_VERSION, generator: 'hipaaAuthorization' },
    blocks,
    flags,
    execution: hipaaExecution(),
  }
}

/** Split free-text HIPAA-release input into individual named persons. */
function parseAdditionalRecipients(text: string | undefined): string[] {
  if (!text) return []
  return text
    .split(/[\n;,]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
}
