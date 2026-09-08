import crypto from 'crypto'

// Application-layer encryption for a small set of especially sensitive
// fields (currently: MFA secrets). This is defense-in-depth on top of
// storage-level encryption (RDS/EBS encryption at rest in prod) — it is not
// a substitute for it. In production, FIELD_ENCRYPTION_KEY should itself be
// managed via a KMS rather than a plain env var.

const ALGORITHM = 'aes-256-gcm'

function getKey(): Buffer {
  const raw = process.env.FIELD_ENCRYPTION_KEY
  if (!raw) {
    throw new Error('FIELD_ENCRYPTION_KEY is not set — see .env.example')
  }
  const key = Buffer.from(raw, 'base64')
  if (key.length !== 32) {
    throw new Error('FIELD_ENCRYPTION_KEY must decode to exactly 32 bytes')
  }
  return key
}

export function encryptField(plaintext: string): string {
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv)
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const authTag = cipher.getAuthTag()
  return [iv.toString('base64'), authTag.toString('base64'), encrypted.toString('base64')].join('.')
}

export function decryptField(payload: string): string {
  const [ivB64, tagB64, dataB64] = payload.split('.')
  if (!ivB64 || !tagB64 || !dataB64) {
    throw new Error('Malformed encrypted field payload')
  }
  const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), Buffer.from(ivB64, 'base64'))
  decipher.setAuthTag(Buffer.from(tagB64, 'base64'))
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(dataB64, 'base64')),
    decipher.final(),
  ])
  return decrypted.toString('utf8')
}
