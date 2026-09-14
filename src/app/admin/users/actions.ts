'use server'

import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/session'
import { requireRole } from '@/lib/rbac'
import { recordAudit } from '@/lib/audit'

const createSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  role: z.enum(['ATTORNEY', 'PARALEGAL', 'ADMIN']),
  barNumber: z.string().optional(),
  password: z.string().min(10),
})

export type ActionResult = { ok: true } | { ok: false; error: string }

export async function createStaffUser(formData: FormData): Promise<ActionResult> {
  const actor = await getCurrentUser()
  if (!actor) return { ok: false, error: 'Unauthorized' }
  requireRole(actor, ['ADMIN'])

  const parsed = createSchema.safeParse({
    firstName: formData.get('firstName'),
    lastName: formData.get('lastName'),
    email: formData.get('email'),
    role: formData.get('role'),
    barNumber: formData.get('barNumber') || undefined,
    password: formData.get('password'),
  })
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' }

  const email = parsed.data.email.toLowerCase().trim()
  if (await db.user.findUnique({ where: { email } })) {
    return { ok: false, error: 'A user with that email already exists.' }
  }

  const user = await db.user.create({
    data: {
      organizationId: actor.organizationId,
      email,
      passwordHash: await bcrypt.hash(parsed.data.password, 12),
      role: parsed.data.role,
      firstName: parsed.data.firstName,
      lastName: parsed.data.lastName,
      barNumber: parsed.data.role === 'ATTORNEY' ? parsed.data.barNumber : undefined,
    },
  })
  await recordAudit({ actorId: actor.id, action: 'CREATE', entityType: 'User', entityId: user.id, metadata: { role: parsed.data.role } })
  revalidatePath('/admin/users')
  return { ok: true }
}

export async function setUserStatus(formData: FormData): Promise<void> {
  const actor = await getCurrentUser()
  if (!actor) return
  requireRole(actor, ['ADMIN'])
  const userId = String(formData.get('userId'))
  const status = String(formData.get('status')) as 'ACTIVE' | 'SUSPENDED' | 'DEACTIVATED'
  if (userId === actor.id) return // don't let an admin lock themselves out
  await db.user.update({ where: { id: userId }, data: { status } })
  await recordAudit({ actorId: actor.id, action: 'UPDATE', entityType: 'User', entityId: userId, metadata: { status } })
  revalidatePath('/admin/users')
}
