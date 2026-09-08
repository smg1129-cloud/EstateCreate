'use server'

import { z } from 'zod'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { requireActor } from '@/lib/session'
import { canEditContacts, ForbiddenError } from '@/lib/rbac'
import { withAudit } from '@/lib/audit'

const contactSchema = z.object({
  contactType: z.enum(['BOARD_MEMBER', 'PROPERTY_MANAGER', 'UNIT_OWNER', 'OPPOSING_COUNSEL', 'JUDGE', 'VENDOR', 'OTHER']),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  company: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  mailingAddressLine1: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postalCode: z.string().optional(),
  linkClientId: z.string().optional(),
  linkRole: z.string().optional(),
})

export async function createContact(formData: FormData) {
  const actor = await requireActor()
  if (!canEditContacts(actor)) throw new ForbiddenError()

  const parsed = contactSchema.parse({
    contactType: formData.get('contactType'),
    firstName: formData.get('firstName'),
    lastName: formData.get('lastName'),
    company: formData.get('company') || undefined,
    email: formData.get('email') || undefined,
    phone: formData.get('phone') || undefined,
    mailingAddressLine1: formData.get('mailingAddressLine1') || undefined,
    city: formData.get('city') || undefined,
    state: formData.get('state') || undefined,
    postalCode: formData.get('postalCode') || undefined,
    linkClientId: formData.get('linkClientId') || undefined,
    linkRole: formData.get('linkRole') || undefined,
  })

  const { linkClientId, linkRole, email, ...contactData } = parsed

  const contact = await withAudit(
    { organizationId: actor.organizationId, actorId: actor.id, action: 'CREATE', entityType: 'Contact' },
    () =>
      db.contact.create({
        data: {
          organizationId: actor.organizationId,
          email: email || undefined,
          ...contactData,
        },
      })
  )

  if (linkClientId) {
    const client = await db.client.findFirst({ where: { id: linkClientId, organizationId: actor.organizationId } })
    if (client) {
      await db.clientContact.create({
        data: { clientId: client.id, contactId: contact.id, role: linkRole || parsed.contactType },
      })
      redirect(`/clients/${client.id}?tab=contacts`)
    }
  }

  redirect(`/contacts/${contact.id}`)
}
