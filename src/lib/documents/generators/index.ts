// Registry mapping each DocumentType to its deterministic generator.
// Adding a document type to the "full suite" means writing one generator and
// adding one line here — the engine, renderers, and UI need no other change.

import type { DocumentType, DocumentModel } from '../blocks'
import type { IntakeContext } from '../context'

import { generateLastWill } from './lastWill'
import { generateRevocableTrust } from './revocableTrust'
import { generatePourOverWill } from './pourOverWill'
import { generateDurablePOA } from './durablePOA'
import { generateHealthCareSurrogate } from './healthCareSurrogate'
import { generateLivingWill } from './livingWill'
import { generateHipaaAuthorization } from './hipaaAuthorization'
import { generateSpecialNeedsTrust } from './specialNeedsTrust'
import { generatePersonalPropertyMemo } from './personalPropertyMemo'
import { generatePreneedGuardian } from './preneedGuardian'

export type Generator = (ctx: IntakeContext) => DocumentModel

export const GENERATORS: Record<DocumentType, Generator> = {
  LAST_WILL: generateLastWill,
  REVOCABLE_LIVING_TRUST: generateRevocableTrust,
  POUR_OVER_WILL: generatePourOverWill,
  DURABLE_POWER_OF_ATTORNEY: generateDurablePOA,
  HEALTH_CARE_SURROGATE: generateHealthCareSurrogate,
  LIVING_WILL: generateLivingWill,
  HIPAA_AUTHORIZATION: generateHipaaAuthorization,
  SPECIAL_NEEDS_TRUST: generateSpecialNeedsTrust,
  PERSONAL_PROPERTY_MEMORANDUM: generatePersonalPropertyMemo,
  PRENEED_GUARDIAN_DESIGNATION: generatePreneedGuardian,
}

/** Human-readable labels for each document type (used across the UI). */
export const DOCUMENT_LABELS: Record<DocumentType, string> = {
  LAST_WILL: 'Last Will and Testament',
  REVOCABLE_LIVING_TRUST: 'Revocable Living Trust',
  POUR_OVER_WILL: 'Pour-Over Will',
  DURABLE_POWER_OF_ATTORNEY: 'Durable Power of Attorney',
  HEALTH_CARE_SURROGATE: 'Designation of Health Care Surrogate',
  LIVING_WILL: 'Living Will',
  HIPAA_AUTHORIZATION: 'HIPAA Authorization',
  SPECIAL_NEEDS_TRUST: 'Special Needs Trust',
  PERSONAL_PROPERTY_MEMORANDUM: 'Personal Property Memorandum',
  PRENEED_GUARDIAN_DESIGNATION: 'Pre-Need Guardian Designation',
}
