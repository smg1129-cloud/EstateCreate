import type { DocumentStatus, MatterStatus } from '@prisma/client'

/** Client-facing status labels (softened; attorney-internal states are hidden). */
export const CLIENT_DOC_STATUS: Record<DocumentStatus, { label: string; tone: 'neutral' | 'progress' | 'good' | 'warn' }> = {
  DRAFT: { label: 'Preparing', tone: 'progress' },
  IN_REVIEW: { label: 'In attorney review', tone: 'progress' },
  CHANGES_REQUESTED: { label: 'Being revised', tone: 'warn' },
  APPROVED: { label: 'Approved — ready to sign', tone: 'good' },
  REJECTED: { label: 'Being revised', tone: 'warn' },
  SUPERSEDED: { label: 'Replaced', tone: 'neutral' },
  EXECUTED: { label: 'Signed', tone: 'good' },
}

/** Full status labels for staff (attorney/paralegal/admin). */
export const STAFF_DOC_STATUS: Record<DocumentStatus, { label: string; tone: 'neutral' | 'progress' | 'good' | 'warn' }> = {
  DRAFT: { label: 'Draft', tone: 'neutral' },
  IN_REVIEW: { label: 'In review', tone: 'progress' },
  CHANGES_REQUESTED: { label: 'Changes requested', tone: 'warn' },
  APPROVED: { label: 'Approved', tone: 'good' },
  REJECTED: { label: 'Rejected', tone: 'warn' },
  SUPERSEDED: { label: 'Superseded', tone: 'neutral' },
  EXECUTED: { label: 'Executed', tone: 'good' },
}

export const MATTER_STATUS_LABEL: Record<MatterStatus, string> = {
  INTAKE: 'Intake',
  READY_TO_GENERATE: 'Ready to generate',
  IN_REVIEW: 'In review',
  CHANGES_REQUESTED: 'Changes requested',
  APPROVED: 'Approved',
  EXECUTION: 'Execution',
  COMPLETED: 'Completed',
  ABANDONED: 'Closed',
}

export const TONE_CLASSES: Record<'neutral' | 'progress' | 'good' | 'warn', string> = {
  neutral: 'bg-gray-100 text-gray-700',
  progress: 'bg-blue-100 text-blue-800',
  good: 'bg-green-100 text-green-800',
  warn: 'bg-amber-100 text-amber-800',
}
