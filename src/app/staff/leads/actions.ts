'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { canAccessCrm } from '@/lib/rbac'

async function requireCrmActor() {
  const session = await getServerSession(authOptions)
  if (!session?.user || !canAccessCrm({ id: session.user.id, role: session.user.role, organizationId: session.user.organizationId })) {
    throw new Error('Unauthorized')
  }
  return session.user
}

const statusSchema = z.enum(['NEW', 'CONTACTED', 'QUALIFIED', 'CONVERTED', 'LOST'])

export async function updateLeadStatus(leadId: string, status: string) {
  const actor = await requireCrmActor()
  const parsedStatus = statusSchema.parse(status)
  await db.lead.update({ where: { id: leadId }, data: { status: parsedStatus, assignedToId: actor.id } })
  revalidatePath('/staff/leads')
}

const noteSchema = z.object({ leadId: z.string().min(1), body: z.string().min(1).max(2000) })

export async function addLeadNote(formData: FormData) {
  const actor = await requireCrmActor()
  const parsed = noteSchema.parse({ leadId: formData.get('leadId'), body: formData.get('body') })

  await db.communicationLog.create({
    data: {
      leadId: parsed.leadId,
      authorId: actor.id,
      channel: 'NOTE',
      direction: 'OUTBOUND',
      body: parsed.body,
    },
  })
  revalidatePath('/staff/leads')
}
