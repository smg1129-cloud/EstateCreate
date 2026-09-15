'use server'

import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { headers } from 'next/headers'
import { db } from '@/lib/db'
import { recordAudit } from '@/lib/audit'
import { createMatterForClient } from '@/lib/matters/service'

const schema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Enter a valid email'),
  password: z.string().min(10, 'Use at least 10 characters'),
  acceptTerms: z.literal('on', { errorMap: () => ({ message: 'You must accept the terms to continue' }) }),
  acceptElectronic: z.literal('on', { errorMap: () => ({ message: 'Electronic-records consent is required' }) }),
})

export type RegisterResult = { ok: true } | { ok: false; error: string }

export async function registerClient(formData: FormData): Promise<RegisterResult> {
  const parsed = schema.safeParse({
    firstName: formData.get('firstName'),
    lastName: formData.get('lastName'),
    email: formData.get('email'),
    password: formData.get('password'),
    acceptTerms: formData.get('acceptTerms'),
    acceptElectronic: formData.get('acceptElectronic'),
  })
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' }
  }
  const { firstName, lastName, email, password } = parsed.data
  const normalizedEmail = email.toLowerCase().trim()

  const org = await db.organization.findFirst({ orderBy: { createdAt: 'asc' } })
  if (!org) {
    return { ok: false, error: 'This firm is not yet set up to accept new clients. Please contact the office.' }
  }

  const existing = await db.user.findUnique({ where: { email: normalizedEmail } })
  if (existing) {
    return { ok: false, error: 'An account with that email already exists. Please sign in.' }
  }

  const passwordHash = await bcrypt.hash(password, 12)
  const ip = headers().get('x-forwarded-for') ?? undefined

  const user = await db.user.create({
    data: {
      organizationId: org.id,
      email: normalizedEmail,
      passwordHash,
      role: 'CLIENT',
      firstName,
      lastName,
    },
  })

  // Capture signup-time consents (append-only).
  const version = '2026-09-v1'
  await db.consentRecord.createMany({
    data: [
      { userId: user.id, type: 'TERMS_OF_SERVICE', version, ipAddress: ip },
      { userId: user.id, type: 'PRIVACY_NOTICE', version, ipAddress: ip },
      { userId: user.id, type: 'ELECTRONIC_RECORDS_CONSENT', version, ipAddress: ip },
    ],
  })

  await createMatterForClient({ id: user.id, organizationId: org.id })
  await recordAudit({ actorId: user.id, action: 'CREATE', entityType: 'User', entityId: user.id, metadata: { role: 'CLIENT' } })

  return { ok: true }
}
