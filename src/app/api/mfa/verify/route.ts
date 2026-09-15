import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { authenticator } from 'otplib'
import { getCurrentUser } from '@/lib/session'
import { db } from '@/lib/db'
import { decryptField } from '@/lib/encryption'
import { recordAudit } from '@/lib/audit'

// Verifies a TOTP code against the stored secret and, on success, marks MFA
// enrolled. The client then refreshes its session to clear requiresMfaSetup.
export async function POST(req: NextRequest) {
  const actor = await getCurrentUser()
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { code } = (await req.json().catch(() => ({}))) as { code?: string }
  if (!code) return NextResponse.json({ error: 'Code required' }, { status: 400 })

  const user = await db.user.findUnique({ where: { id: actor.id }, select: { mfaSecretEnc: true } })
  if (!user?.mfaSecretEnc) return NextResponse.json({ error: 'No enrollment in progress' }, { status: 400 })

  const secret = decryptField(user.mfaSecretEnc)
  if (!authenticator.check(code, secret)) {
    return NextResponse.json({ error: 'Invalid code' }, { status: 400 })
  }

  await db.user.update({ where: { id: actor.id }, data: { mfaEnabled: true } })
  await recordAudit({ actorId: actor.id, action: 'MFA_ENROLLED', entityType: 'User', entityId: actor.id })
  return NextResponse.json({ ok: true })
}
