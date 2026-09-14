// Shared building blocks for the document generators. These keep the legal
// language in one place so a fix (e.g. to succession/nomination phrasing)
// propagates to every instrument that uses it.

import type { ExecutionRequirement, Run } from '../blocks'
import type { Fiduciary, IntakeContext } from '../context'

/** Bumped whenever generator output changes in a way that should invalidate a
 * previously reviewed version. Stored on each GeneratedDocument. */
export const ENGINE_VERSION = '2026.09.1'

export function fullName(ctx: IntakeContext): string {
  return ctx.testator.fullName || '[CLIENT NAME]'
}

export function residence(ctx: IntakeContext): string {
  const parts = [ctx.testator.city, ctx.testator.county ? `${ctx.testator.county} County` : undefined, ctx.testator.state]
  return parts.filter(Boolean).join(', ') || 'Florida'
}

/** "A, B, and C" from a list of strings. */
export function joinAnd(items: string[]): string {
  if (items.length === 0) return ''
  if (items.length === 1) return items[0]!
  if (items.length === 2) return `${items[0]} and ${items[1]}`
  return `${items.slice(0, -1).join(', ')}, and ${items[items.length - 1]}`
}

export function fidName(f: Fiduciary): string {
  const loc = [f.city, f.state].filter(Boolean).join(', ')
  return loc ? `${f.fullName} of ${loc}` : f.fullName
}

/**
 * Nomination language with an ordered line of succession, e.g.
 * "I nominate JOHN to serve as my Personal Representative. If JOHN is unable or
 * unwilling to serve, then I nominate MARY; and if MARY is unable or unwilling
 * to serve, then I nominate SAM."
 */
export function successionSentence(role: string, fids: Fiduciary[], articleWord = 'my'): Run[] {
  if (fids.length === 0) {
    return [
      `I have not named ${articleWord} ${role} in this instrument. `,
      { text: `[Attorney to confirm nominee — no ${role} was provided.]`, italic: true },
    ]
  }
  const first = fidName(fids[0]!)
  let sentence = `I nominate ${first} to serve as ${articleWord} ${role}.`
  for (let i = 1; i < fids.length; i++) {
    const prev = fids[i - 1]!.fullName
    const cur = fidName(fids[i]!)
    sentence += ` If ${prev} is unable or unwilling to serve, then I nominate ${cur} to serve as ${articleWord} ${role}.`
  }
  return [sentence]
}

/** Per-stirpes vs. surviving-descendants remainder phrase for a predeceased
 * beneficiary. */
export function lapsePhrase(mode: 'per_stirpes' | 'others' | 'surviving' | 'to_descendants'): string {
  switch (mode) {
    case 'per_stirpes':
    case 'to_descendants':
      return 'to that beneficiary’s then-living descendants, per stirpes'
    case 'surviving':
    case 'others':
      return 'to the other beneficiaries named in this provision, in proportion to their respective shares'
  }
}

export function bondClause(ctx: IntakeContext): string {
  return ctx.fiduciaries.bondWaived
    ? 'No bond or other security shall be required of any fiduciary named in this instrument, in any jurisdiction.'
    : 'Each fiduciary shall post such bond as may be required by law or by the court.'
}

export function excludedClause(ctx: IntakeContext, role: string): Run[] | null {
  if (!ctx.fiduciaries.excluded || ctx.fiduciaries.excluded === 'yes') return null
  return [
    `I direct that the following person or persons shall not serve as ${role}, nor be appointed by any court in that capacity: `,
    { text: ctx.fiduciaries.excluded, bold: false },
    '.',
  ]
}

// --- Execution requirements per document type (Florida) --------------------

export function willExecution(): ExecutionRequirement {
  return {
    witnesses: 2,
    notaryRequired: true,
    authority: 'Fla. Stat. 732.502 (execution); 732.503 (self-proof)',
    steps: [
      'The testator signs at the end of the will in the presence of two witnesses.',
      'Both witnesses sign in the presence of the testator and of each other.',
      'The testator and both witnesses appear before a notary public and sign the self-proving affidavit, which the notary acknowledges — this makes the will self-proved so witnesses need not be located later.',
      'If executed by remote online notarization, follow the additional requirements for electronic wills in Fla. Stat. 732.521–.525, including the qualified-custodian and vulnerable-adult rules.',
    ],
  }
}

export function trustExecution(): ExecutionRequirement {
  return {
    witnesses: 2,
    notaryRequired: true,
    authority: 'Fla. Stat. 736.0403(2)(b) (testamentary aspects executed with will formalities)',
    steps: [
      'The grantor signs the trust agreement.',
      'Because the trust disposes of property at death, execute it with the same formalities as a will: two witnesses and a notary acknowledgment.',
      'Fund the trust by retitling assets into the name of the trust — an unfunded trust does almost nothing. Coordinate deeds and beneficiary designations.',
    ],
  }
}

export function dpoaExecution(): ExecutionRequirement {
  return {
    witnesses: 2,
    notaryRequired: true,
    authority: 'Fla. Stat. 709.2105 (two witnesses and a notary required)',
    steps: [
      'The principal signs the durable power of attorney in the presence of two witnesses and a notary public.',
      'Both witnesses and the notary sign.',
      'Any "superpowers" (e.g. gifting, changing beneficiary designations, creating/amending a trust) must be separately signed or initialed by the principal to be effective (Fla. Stat. 709.2202).',
    ],
  }
}

export function surrogateExecution(): ExecutionRequirement {
  return {
    witnesses: 2,
    notaryRequired: false,
    authority: 'Fla. Stat. 765.202 (two adult witnesses; the surrogate may not act as a witness)',
    steps: [
      'The principal signs in the presence of two adult witnesses.',
      'At least one witness must not be the principal’s spouse or blood relative.',
      'The person named as surrogate may not act as a witness.',
    ],
  }
}

export function livingWillExecution(): ExecutionRequirement {
  return {
    witnesses: 2,
    notaryRequired: false,
    authority: 'Fla. Stat. 765.302 (two adult witnesses)',
    steps: [
      'The principal signs in the presence of two adult witnesses.',
      'At least one witness must not be the principal’s spouse or blood relative.',
    ],
  }
}

export function hipaaExecution(): ExecutionRequirement {
  return {
    witnesses: 0,
    notaryRequired: false,
    authority: '45 C.F.R. 164.508 (HIPAA authorization requirements)',
    steps: ['The principal signs and dates the authorization. Witnessing is not required but is recommended.'],
  }
}

export function memoExecution(): ExecutionRequirement {
  return {
    witnesses: 0,
    notaryRequired: false,
    authority: 'Fla. Stat. 732.515 (separate writing for tangible personal property)',
    steps: [
      'The list must be signed by the testator and describe the items and recipients with reasonable certainty.',
      'It may be prepared or updated after the will is signed and may be changed at any time without a lawyer.',
      'It disposes of tangible personal property only — not money, real estate, or business interests.',
    ],
  }
}
