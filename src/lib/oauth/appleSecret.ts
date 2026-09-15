import crypto from 'crypto'

/**
 * Apple "Sign in with Apple" requires the OAuth client secret to be a
 * short-lived ES256 JWT that we sign ourselves with the private key (.p8)
 * downloaded from the Apple Developer portal — there is no static secret to
 * paste. NextAuth's Apple provider accepts a ready-made string for
 * `clientSecret`, so we mint one here at startup.
 *
 * Env (either provide the four components, or a pre-generated APPLE_CLIENT_SECRET):
 *   APPLE_TEAM_ID       10-char Apple Developer Team ID (the JWT `iss`)
 *   APPLE_KEY_ID        10-char Key ID of the .p8 signing key (JWT header `kid`)
 *   APPLE_CLIENT_ID     the Services ID / bundle id (JWT `sub`, and OAuth client id)
 *   APPLE_PRIVATE_KEY   contents of the .p8 file (PEM). Newlines may be escaped
 *                       as "\n" in the env value; we unescape them.
 *   APPLE_CLIENT_SECRET optional pre-generated secret; if set, it wins.
 *
 * Apple caps the secret's lifetime at 6 months; we use ~180 days. The process
 * generates a fresh one on each boot, so a long-running instance should be
 * restarted within that window (or supply APPLE_CLIENT_SECRET out of band).
 */

function base64url(input: Buffer | string): string {
  return Buffer.from(input)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
}

const SIX_MONTHS_SECONDS = 60 * 60 * 24 * 180

export function generateAppleClientSecret(): string | null {
  const override = process.env.APPLE_CLIENT_SECRET
  if (override) return override

  const teamId = process.env.APPLE_TEAM_ID
  const keyId = process.env.APPLE_KEY_ID
  const clientId = process.env.APPLE_CLIENT_ID
  const rawKey = process.env.APPLE_PRIVATE_KEY

  if (!teamId || !keyId || !clientId || !rawKey) return null

  // Allow the PEM to be stored on a single line with literal "\n".
  const privateKey = rawKey.includes('\\n') ? rawKey.replace(/\\n/g, '\n') : rawKey

  const now = Math.floor(Date.now() / 1000)
  const header = { alg: 'ES256', kid: keyId, typ: 'JWT' }
  const payload = {
    iss: teamId,
    iat: now,
    exp: now + SIX_MONTHS_SECONDS,
    aud: 'https://appleid.apple.com',
    sub: clientId,
  }

  const signingInput = `${base64url(JSON.stringify(header))}.${base64url(JSON.stringify(payload))}`

  // ES256 = ECDSA over P-256 with SHA-256. Apple requires the raw (r||s)
  // JOSE signature, not the DER encoding OpenSSL produces by default.
  const signature = crypto.sign('SHA256', Buffer.from(signingInput), {
    key: privateKey,
    dsaEncoding: 'ieee-p1363',
  })

  return `${signingInput}.${base64url(signature)}`
}
