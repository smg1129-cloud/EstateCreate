'use server'

import { z } from 'zod'
import { db } from '@/lib/db'

const contactSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  email: z.string().email(),
  phone: z.string().max(30).optional(),
  message: z.string().min(1).max(2000),
})

export type ContactFormState = { ok: boolean; error?: string }

export async function submitContactForm(
  _prev: ContactFormState,
  formData: FormData
): Promise<ContactFormState> {
  const parsed = contactSchema.safeParse({
    firstName: formData.get('firstName'),
    lastName: formData.get('lastName'),
    email: formData.get('email'),
    phone: formData.get('phone') || undefined,
    message: formData.get('message'),
  })

  if (!parsed.success) {
    return { ok: false, error: 'Please check the form and try again.' }
  }

  const org = await db.organization.findFirst()
  if (!org) return { ok: false, error: 'Clinic is not configured yet.' }

  const lead = await db.lead.create({
    data: {
      organizationId: org.id,
      firstName: parsed.data.firstName,
      lastName: parsed.data.lastName,
      email: parsed.data.email,
      phone: parsed.data.phone,
      source: 'contact-form',
      status: 'NEW',
      notes: parsed.data.message,
    },
  })

  await db.communicationLog.create({
    data: {
      leadId: lead.id,
      authorId: lead.assignedToId ?? (await requireSystemActor()),
      channel: 'EMAIL',
      direction: 'INBOUND',
      subject: 'Website contact form',
      body: parsed.data.message,
    },
  })

  return { ok: true }
}

// The contact form is submitted anonymously, but CommunicationLog.authorId
// is required (every log entry needs an accountable author). We attribute
// unsolicited inbound messages to the org's first STAFF/ADMIN user rather
// than inventing a "system" user with standing DB access.
async function requireSystemActor(): Promise<string> {
  const staffUser = await db.user.findFirst({ where: { role: { in: ['STAFF', 'ADMIN'] } } })
  if (!staffUser) throw new Error('No staff user configured to receive inbound messages')
  return staffUser.id
}
