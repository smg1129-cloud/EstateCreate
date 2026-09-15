// The document block model.
//
// Every generator (src/lib/documents/generators/*) emits a `DocumentModel`
// made of these blocks. Renderers (src/lib/documents/render/*) turn that one
// model into HTML (on-screen preview), DOCX (attorney-editable), and PDF
// (print/sign). Because the model is a plain serializable structure it is what
// we persist in GeneratedDocument.contentJson, hash for change-detection, and
// annotate at the clause level during review.
//
// Nothing here involves an LLM: a generator is ordinary TypeScript that maps a
// typed IntakeContext to an ordered list of blocks using a fixed clause
// library. The output for a given input is fully deterministic.

export type DocumentType =
  | 'LAST_WILL'
  | 'REVOCABLE_LIVING_TRUST'
  | 'POUR_OVER_WILL'
  | 'DURABLE_POWER_OF_ATTORNEY'
  | 'HEALTH_CARE_SURROGATE'
  | 'LIVING_WILL'
  | 'HIPAA_AUTHORIZATION'
  | 'SPECIAL_NEEDS_TRUST'
  | 'PERSONAL_PROPERTY_MEMORANDUM'
  | 'PRENEED_GUARDIAN_DESIGNATION'
  | 'CERTIFICATE_OF_TRUST'
  | 'MARITAL_TRUST'
  | 'QDOT_TRUST'
  | 'IRREVOCABLE_LIFE_INSURANCE_TRUST'
  | 'PET_TRUST'
  | 'GUN_TRUST'

/** A styled run of text within a paragraph or clause. A bare string is an
 * unstyled run. */
export type Run =
  | string
  | {
      text: string
      bold?: boolean
      italic?: boolean
      underline?: boolean
      smallCaps?: boolean
    }

export type Align = 'left' | 'center' | 'right' | 'justify'

/** Severity for attorney-facing review flags. These are issue-spotting notes
 * attached by the rules engine or generators; they render in the attorney
 * review UI and as a cover memo, but are stripped from the client-facing
 * final document. */
export type FlagSeverity = 'info' | 'caution' | 'warning'

export interface ReviewFlag {
  /** Short machine-ish code, e.g. "NONCITIZEN_SPOUSE". */
  code: string
  severity: FlagSeverity
  /** Human-readable explanation shown to the reviewing attorney. */
  message: string
  /** Optional statutory anchor for the attorney's research (not legal advice). */
  authority?: string
  /** Ref of the block this flag relates to, if any. */
  blockRef?: string
}

export interface SignatureLine {
  /** e.g. "Testator", "Witness", "Grantor", "Notary Public". */
  role: string
  /** Printed name if known, otherwise blank line for manual completion. */
  name?: string
  /** Extra caption under the line, e.g. "Sign in the presence of a notary". */
  caption?: string
  /** Show a date line next to the signature line. */
  withDate?: boolean
}

export type Block =
  // Document title, centered, top of first page.
  | { kind: 'title'; ref?: string; text: string; subtitle?: string }
  // "ARTICLE I" style heading with an all-caps title beneath/next to it.
  | { kind: 'article'; ref?: string; number: string; title: string }
  // Generic heading, level 1..3.
  | { kind: 'heading'; ref?: string; level: 1 | 2 | 3; text: string; numberLabel?: string }
  // A normal body paragraph.
  | { kind: 'paragraph'; ref?: string; runs: Run[]; align?: Align; indent?: number }
  // A numbered/lettered sub-clause within an article (e.g. "1.1", "(a)").
  | { kind: 'clause'; ref?: string; number?: string; runs: Run[]; indent?: number }
  // An ordered or bulleted list.
  | { kind: 'list'; ref?: string; ordered: boolean; items: Run[][] }
  // Vertical space.
  | { kind: 'spacer'; ref?: string; lines?: number }
  // Hard page break.
  | { kind: 'pageBreak'; ref?: string }
  // A block of signature lines (testator/grantor/principal, witnesses, etc.).
  | { kind: 'signatureBlock'; ref?: string; heading?: string; lines: SignatureLine[] }
  // Florida self-proving / notary acknowledgment block.
  | { kind: 'notaryBlock'; ref?: string; text: Run[][] }
  // A blank the attorney or client must complete by hand or in review.
  | { kind: 'fillIn'; ref?: string; label: string; note?: string }

export interface ExecutionRequirement {
  /** Witnesses required at execution (FL will/trust = 2). */
  witnesses: number
  /** Whether a notary is required (self-proving affidavit, DPOA, RON). */
  notaryRequired: boolean
  /** Human-readable, FL-specific execution steps for this document. */
  steps: string[]
  /** Statutory basis, for the attorney (not legal advice to the client). */
  authority?: string
}

export interface DocumentModel {
  type: DocumentType
  title: string
  meta: {
    jurisdiction: 'FL'
    engineVersion: string
    /** Names the generator that produced this, for reproducibility. */
    generator: string
  }
  blocks: Block[]
  /** Attorney-facing issue-spotting notes; never shown to the client. */
  flags: ReviewFlag[]
  execution: ExecutionRequirement
}

// ---------------------------------------------------------------------------
// Small authoring helpers so generators read like prose, not data literals.
// ---------------------------------------------------------------------------

export function title(text: string, subtitle?: string): Block {
  return { kind: 'title', text, subtitle }
}

export function article(number: string, title: string, ref?: string): Block {
  return { kind: 'article', number, title, ref }
}

export function heading(text: string, level: 1 | 2 | 3 = 2, ref?: string): Block {
  return { kind: 'heading', level, text, ref }
}

export function para(runs: Run[] | string, opts: { align?: Align; indent?: number; ref?: string } = {}): Block {
  return {
    kind: 'paragraph',
    runs: typeof runs === 'string' ? [runs] : runs,
    align: opts.align,
    indent: opts.indent,
    ref: opts.ref,
  }
}

export function clause(number: string | undefined, runs: Run[] | string, opts: { indent?: number; ref?: string } = {}): Block {
  return {
    kind: 'clause',
    number,
    runs: typeof runs === 'string' ? [runs] : runs,
    indent: opts.indent,
    ref: opts.ref,
  }
}

export function list(items: (Run[] | string)[], opts: { ordered?: boolean; ref?: string } = {}): Block {
  return {
    kind: 'list',
    ordered: opts.ordered ?? false,
    items: items.map((i) => (typeof i === 'string' ? [i] : i)),
    ref: opts.ref,
  }
}

export function spacer(lines = 1): Block {
  return { kind: 'spacer', lines }
}

export function pageBreak(): Block {
  return { kind: 'pageBreak' }
}

export function bold(text: string): Run {
  return { text, bold: true }
}

export function italic(text: string): Run {
  return { text, italic: true }
}

/** Reduce a Run[] to plain text — used for hashing and plain-text fallbacks. */
export function runsToText(runs: Run[]): string {
  return runs.map((r) => (typeof r === 'string' ? r : r.text)).join('')
}

/** Convenience flag constructors. */
export function flag(
  code: string,
  severity: FlagSeverity,
  message: string,
  authority?: string,
  blockRef?: string
): ReviewFlag {
  return { code, severity, message, authority, blockRef }
}
