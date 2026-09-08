'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

const taskSchema = z.object({ title: z.string().min(1).max(200), dueAt: z.string().optional() })

export async function createTask(formData: FormData) {
  const session = await getServerSession(authOptions)
  if (!session?.user) throw new Error('Unauthorized')

  const parsed = taskSchema.parse({
    title: formData.get('title'),
    dueAt: formData.get('dueAt') || undefined,
  })

  await db.staffTask.create({
    data: {
      title: parsed.title,
      dueAt: parsed.dueAt ? new Date(parsed.dueAt) : undefined,
      assignedToId: session.user.id,
    },
  })
  revalidatePath('/staff/tasks')
}

export async function completeTask(taskId: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user) throw new Error('Unauthorized')

  // updateMany (not update) so the assignedToId filter is enforced as part
  // of the query itself — a staff member can only complete their own tasks.
  await db.staffTask.updateMany({
    where: { id: taskId, assignedToId: session.user.id },
    data: { completedAt: new Date() },
  })
  revalidatePath('/staff/tasks')
}
