'use server'

import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { requireActor } from '@/lib/session'
import { canManageUsers, ForbiddenError } from '@/lib/rbac'
import { withAudit } from '@/lib/audit'

const createUserSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  role: z.enum(['ADMIN', 'ATTORNEY', 'PARALEGAL', 'BILLING', 'READONLY']),
  officeId: z.string().optional(),
  barNumber: z.string().optional(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

export async function createUser(formData: FormData) {
  const actor = await requireActor()
  if (!canManageUsers(actor)) throw new ForbiddenError()

  const parsed = createUserSchema.parse({
    email: formData.get('email'),
    firstName: formData.get('firstName'),
    lastName: formData.get('lastName'),
    role: formData.get('role'),
    officeId: formData.get('officeId') || undefined,
    barNumber: formData.get('barNumber') || undefined,
    password: formData.get('password'),
  })

  const passwordHash = await bcrypt.hash(parsed.password, 12)

  await withAudit(
    { organizationId: actor.organizationId, actorId: actor.id, action: 'CREATE', entityType: 'User' },
    () =>
      db.user.create({
        data: {
          organizationId: actor.organizationId,
          email: parsed.email.toLowerCase(),
          firstName: parsed.firstName,
          lastName: parsed.lastName,
          role: parsed.role,
          officeId: parsed.officeId,
          barNumber: parsed.barNumber,
          passwordHash,
        },
      })
  )

  revalidatePath('/admin/users')
}

const statusSchema = z.object({
  status: z.enum(['ACTIVE', 'SUSPENDED', 'DEACTIVATED']),
})

export async function updateUserStatus(userId: string, formData: FormData) {
  const actor = await requireActor()
  if (!canManageUsers(actor)) throw new ForbiddenError()
  if (userId === actor.id) throw new Error('Cannot change your own account status')

  const { status } = statusSchema.parse({ status: formData.get('status') })

  const user = await db.user.findFirst({ where: { id: userId, organizationId: actor.organizationId } })
  if (!user) throw new Error('User not found')

  await withAudit(
    { organizationId: actor.organizationId, actorId: actor.id, action: 'UPDATE', entityType: 'User', entityId: userId, metadata: { status } },
    () => db.user.update({ where: { id: userId }, data: { status } })
  )

  revalidatePath('/admin/users')
}

const roleSchema = z.object({
  role: z.enum(['ADMIN', 'ATTORNEY', 'PARALEGAL', 'BILLING', 'READONLY']),
})

export async function updateUserRole(userId: string, formData: FormData) {
  const actor = await requireActor()
  if (!canManageUsers(actor)) throw new ForbiddenError()
  if (userId === actor.id) throw new Error('Cannot change your own role')

  const { role } = roleSchema.parse({ role: formData.get('role') })

  const user = await db.user.findFirst({ where: { id: userId, organizationId: actor.organizationId } })
  if (!user) throw new Error('User not found')

  await withAudit(
    { organizationId: actor.organizationId, actorId: actor.id, action: 'UPDATE', entityType: 'User', entityId: userId, metadata: { role } },
    () => db.user.update({ where: { id: userId }, data: { role } })
  )

  revalidatePath('/admin/users')
}
