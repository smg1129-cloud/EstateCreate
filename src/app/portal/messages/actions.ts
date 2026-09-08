'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

const messageSchema = z.object({ body: z.string().min(1).max(2000) })

export async function sendPortalMessage(formData: FormData) {
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.role !== 'PATIENT') throw new Error('Unauthorized')

  const parsed = messageSchema.parse({ body: formData.get('body') })

  const patient = await db.patient.findUnique({ where: { userId: session.user.id } })
  if (!patient) throw new Error('Patient record not found')

  await db.communicationLog.create({
    data: {
      patientId: patient.id,
      authorId: session.user.id,
      channel: 'PORTAL_MESSAGE',
      direction: 'OUTBOUND',
      body: parsed.body,
    },
  })

  revalidatePath('/portal/messages')
}
