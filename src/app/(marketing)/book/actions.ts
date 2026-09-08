'use server'

import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { headers } from 'next/headers'
import { db } from '@/lib/db'
import { recordAudit } from '@/lib/audit'

const VISIT_PRICE_CENTS = 12500

export async function getStatesWithCoverage(): Promise<string[]> {
  const rows = await db.providerLicense.findMany({
    where: { status: 'ACTIVE', expiresAt: { gt: new Date() } },
    select: { state: true },
    distinct: ['state'],
    orderBy: { state: 'asc' },
  })
  return rows.map((r) => r.state)
}

export interface BookingProvider {
  id: string
  name: string
  specialties: string[]
  bio: string | null
}

export async function getProvidersForState(state: string): Promise<BookingProvider[]> {
  const providers = await db.provider.findMany({
    where: { licenses: { some: { state, status: 'ACTIVE', expiresAt: { gt: new Date() } } } },
    include: { user: true },
  })
  return providers.map((p) => ({
    id: p.id,
    name: `${p.user.firstName} ${p.user.lastName}`,
    specialties: p.specialties,
    bio: p.bio,
  }))
}

// Prototype scheduling: next 10 weekdays, fixed hourly slots, minus
// whatever's already booked for that provider. A production booking engine
// would account for provider-configured availability, buffers, and time
// zones properly.
const SLOT_HOURS = [9, 10, 11, 13, 14, 15]

export async function getAvailableSlots(providerId: string): Promise<string[]> {
  const booked = await db.appointment.findMany({
    where: { providerId, status: { in: ['SCHEDULED', 'CHECKED_IN'] } },
    select: { scheduledAt: true },
  })
  const bookedTimes = new Set(booked.map((b) => b.scheduledAt.toISOString()))

  const slots: string[] = []
  const day = new Date()
  day.setHours(0, 0, 0, 0)
  let daysAdded = 0
  let cursor = 1

  while (daysAdded < 10) {
    const candidate = new Date(day)
    candidate.setDate(candidate.getDate() + cursor)
    cursor += 1
    const dow = candidate.getDay()
    if (dow === 0 || dow === 6) continue // skip weekends

    for (const hour of SLOT_HOURS) {
      const slot = new Date(candidate)
      slot.setHours(hour, 0, 0, 0)
      const iso = slot.toISOString()
      if (!bookedTimes.has(iso)) slots.push(iso)
    }
    daysAdded += 1
  }

  return slots
}

const bookingSchema = z.object({
  state: z.string().length(2),
  providerId: z.string().min(1),
  slot: z.string().min(1),
  reasonForVisit: z.string().max(1000).optional(),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  email: z.string().email(),
  phone: z.string().max(30).optional(),
  password: z.string().min(10, 'Password must be at least 10 characters'),
  dateOfBirth: z.string().min(1),
  addressLine1: z.string().max(200).optional(),
  city: z.string().max(100).optional(),
  postalCode: z.string().max(20).optional(),
  consentPrivacy: z.literal('on'),
  consentTelehealth: z.literal('on'),
  consentTerms: z.literal('on'),
  consentFinancial: z.literal('on'),
})

export type BookingState = { ok: boolean; error?: string }

export async function submitBooking(_prev: BookingState, formData: FormData): Promise<BookingState> {
  const raw = Object.fromEntries(formData.entries())
  const parsed = bookingSchema.safeParse(raw)

  if (!parsed.success) {
    const first = parsed.error.issues[0]
    return { ok: false, error: first?.message ?? 'Please check the form and try again.' }
  }
  const data = parsed.data

  const org = await db.organization.findFirst()
  if (!org) return { ok: false, error: 'Clinic is not configured yet.' }

  const existingUser = await db.user.findUnique({ where: { email: data.email.toLowerCase() } })
  if (existingUser) {
    return { ok: false, error: 'An account with that email already exists. Please sign in instead.' }
  }

  // Re-validate licensure server-side — the client-selected provider/state
  // pairing must never be trusted blindly.
  const license = await db.providerLicense.findFirst({
    where: { providerId: data.providerId, state: data.state, status: 'ACTIVE', expiresAt: { gt: new Date() } },
  })
  if (!license) {
    return { ok: false, error: 'That provider is not licensed in the selected state. Please choose another.' }
  }

  const ipAddress = headers().get('x-forwarded-for') ?? '127.0.0.1'
  const passwordHash = await bcrypt.hash(data.password, 12)

  const result = await db.$transaction(async (tx) => {
    const lead = await tx.lead.create({
      data: {
        organizationId: org.id,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        source: 'online-booking',
        status: 'CONVERTED',
      },
    })

    const user = await tx.user.create({
      data: {
        organizationId: org.id,
        email: data.email.toLowerCase(),
        passwordHash,
        role: 'PATIENT',
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
      },
    })

    const patient = await tx.patient.create({
      data: {
        userId: user.id,
        dateOfBirth: new Date(data.dateOfBirth),
        addressLine1: data.addressLine1,
        city: data.city,
        state: data.state,
        postalCode: data.postalCode,
      },
    })

    await tx.lead.update({ where: { id: lead.id }, data: { convertedPatientId: patient.id } })

    const now = new Date()
    await tx.consentRecord.createMany({
      data: [
        { patientId: patient.id, type: 'PRIVACY_NOTICE', version: '2026-01-v1', ipAddress, signedAt: now },
        { patientId: patient.id, type: 'TELEHEALTH_CONSENT', version: '2026-01-v1', ipAddress, signedAt: now },
        { patientId: patient.id, type: 'TERMS_OF_SERVICE', version: '2026-01-v1', ipAddress, signedAt: now },
        {
          patientId: patient.id,
          type: 'FINANCIAL_RESPONSIBILITY',
          version: '2026-01-v1',
          ipAddress,
          signedAt: now,
        },
      ],
    })

    const appointment = await tx.appointment.create({
      data: {
        patientId: patient.id,
        providerId: data.providerId,
        scheduledAt: new Date(data.slot),
        visitType: 'VIDEO',
        status: 'SCHEDULED',
        reasonForVisit: data.reasonForVisit,
        stateAtTimeOfVisit: data.state,
      },
    })

    await tx.invoice.create({
      data: { patientId: patient.id, appointmentId: appointment.id, amountCents: VISIT_PRICE_CENTS },
    })

    return { user, appointment }
  })

  await recordAudit({
    actorId: result.user.id,
    action: 'CREATE',
    entityType: 'Appointment',
    entityId: result.appointment.id,
    ipAddress,
    metadata: { via: 'online-booking' },
  })

  return { ok: true }
}
