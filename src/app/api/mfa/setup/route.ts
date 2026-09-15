import { NextResponse } from 'next/server'
import { authenticator } from 'otplib'
import QRCode from 'qrcode'
import { getCurrentUser } from '@/lib/session'
import { requiresMfa } from '@/lib/rbac'
import { db } from '@/lib/db'
import { encryptField } from '@/lib/encryption'

// Generates a fresh TOTP secret for the current user, stores it encrypted, and
// returns the provisioning URI + QR code. Enrollment is only *completed* once a
// valid code is verified (see ../verify).
export async function POST() {
  const actor = await getCurrentUser()
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!requiresMfa(actor.role)) return NextResponse.json({ error: 'MFA not required for this role' }, { status: 400 })

  const user = await db.user.findUnique({ where: { id: actor.id }, select: { email: true } })
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const secret = authenticator.generateSecret()
  await db.user.update({ where: { id: actor.id }, data: { mfaSecretEnc: encryptField(secret), mfaEnabled: false } })

  const otpauth = authenticator.keyuri(user.email, 'EstateCreate', secret)
  const qrDataUrl = await QRCode.toDataURL(otpauth)
  return NextResponse.json({ otpauth, qrDataUrl })
}
