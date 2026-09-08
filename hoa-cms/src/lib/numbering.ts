import { db } from '@/lib/db'
import type { PracticeArea } from '@prisma/client'

/// Firm-facing sequential identifiers, backed by Postgres sequences so
/// concurrent creates never collide (no read-count-then-format race). The
/// sequence is created lazily on first use — safe under concurrency because
/// CREATE SEQUENCE IF NOT EXISTS is idempotent in Postgres.
export async function nextClientNumber(): Promise<string> {
  await db.$executeRawUnsafe(`CREATE SEQUENCE IF NOT EXISTS client_number_seq START 10001`)
  const rows = await db.$queryRawUnsafe<{ nextval: bigint }[]>(`SELECT nextval('client_number_seq')`)
  return `C-${rows[0].nextval}`
}

const PRACTICE_AREA_CODES: Record<PracticeArea, string> = {
  COLLECTIONS: 'COLL',
  COVENANT_ENFORCEMENT: 'COV',
  GENERAL_CORPORATE: 'CORP',
  GENERAL_LITIGATION: 'LIT',
  CLAIMS_MONITORING: 'CLAIM',
}

/// Format: {year}-{practiceAreaCode}-{sequence}, e.g. "2026-COLL-0001".
/// A separate sequence per year+practice-area keeps numbers dense and
/// meaningful rather than one firm-wide counter.
export async function nextMatterNumber(practiceArea: PracticeArea): Promise<string> {
  const year = new Date().getFullYear()
  const code = PRACTICE_AREA_CODES[practiceArea]
  const seqName = `matter_seq_${year}_${code.toLowerCase()}`
  await db.$executeRawUnsafe(`CREATE SEQUENCE IF NOT EXISTS "${seqName}" START 1`)
  const rows = await db.$queryRawUnsafe<{ nextval: bigint }[]>(`SELECT nextval('"${seqName}"')`)
  return `${year}-${code}-${String(rows[0].nextval).padStart(4, '0')}`
}
