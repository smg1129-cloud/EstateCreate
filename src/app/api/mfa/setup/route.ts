import { NextResponse } from 'next/server'
import QRCode from 'qrcode'
import { authenticator } from 'otplib'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { encryptField } from '@/lib/encryption'

/// Generates a new TOTP secret for the current user and stores it
/// (encrypted) with mfaEnabled still false — enrollment only completes once
/// the user proves possession of the secret via /api/mfa/verify.
export async function POST() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const secret = authenticator.generateSecret()
  const otpauthUrl = authenticator.keyuri(session.user.email ?? session.user.id, 'Meridian Health', secret)
  const qrDataUrl = await QRCode.toDataURL(otpauthUrl)

  await db.user.update({
    where: { id: session.user.id },
    data: { mfaSecretEnc: encryptField(secret), mfaEnabled: false },
  })

  return NextResponse.json({ qrDataUrl, secret })
}
