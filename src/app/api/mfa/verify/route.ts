import { NextResponse } from 'next/server'
import { authenticator } from 'otplib'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { decryptField } from '@/lib/encryption'
import { recordAudit } from '@/lib/audit'

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { code } = (await req.json()) as { code?: string }
  if (!code) return NextResponse.json({ error: 'Code is required' }, { status: 400 })

  const user = await db.user.findUnique({ where: { id: session.user.id } })
  if (!user?.mfaSecretEnc) {
    return NextResponse.json({ error: 'Call /api/mfa/setup first' }, { status: 400 })
  }

  const secret = decryptField(user.mfaSecretEnc)
  const valid = authenticator.check(code, secret)
  if (!valid) {
    return NextResponse.json({ error: 'Invalid code' }, { status: 400 })
  }

  await db.user.update({ where: { id: user.id }, data: { mfaEnabled: true } })
  await recordAudit({ actorId: user.id, action: 'MFA_ENROLLED', entityType: 'User', entityId: user.id })

  return NextResponse.json({ ok: true })
}
