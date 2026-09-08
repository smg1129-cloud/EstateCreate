'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { recordAudit } from '@/lib/audit'

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.role !== 'ADMIN') throw new Error('Unauthorized')
  return session.user
}

const createUserSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  email: z.string().email(),
  role: z.enum(['STAFF', 'CLINICIAN', 'ADMIN']),
  password: z.string().min(10),
  npi: z.string().max(20).optional(),
})

export async function createStaffUser(formData: FormData) {
  const admin = await requireAdmin()

  const parsed = createUserSchema.parse({
    firstName: formData.get('firstName'),
    lastName: formData.get('lastName'),
    email: formData.get('email'),
    role: formData.get('role'),
    password: formData.get('password'),
    npi: formData.get('npi') || undefined,
  })

  if (parsed.role === 'CLINICIAN' && !parsed.npi) {
    throw new Error('NPI is required when creating a clinician account')
  }

  const passwordHash = await bcrypt.hash(parsed.password, 12)

  const user = await db.user.create({
    data: {
      organizationId: admin.organizationId,
      firstName: parsed.firstName,
      lastName: parsed.lastName,
      email: parsed.email.toLowerCase(),
      role: parsed.role,
      passwordHash,
    },
  })

  if (parsed.role === 'CLINICIAN' && parsed.npi) {
    await db.provider.create({ data: { userId: user.id, npi: parsed.npi, specialties: [] } })
  }

  await recordAudit({ actorId: admin.id, action: 'CREATE', entityType: 'User', entityId: user.id, metadata: { role: parsed.role } })
  revalidatePath('/admin/users')
}

export async function setUserStatus(userId: string, status: 'ACTIVE' | 'SUSPENDED') {
  const admin = await requireAdmin()
  await db.user.update({ where: { id: userId }, data: { status } })
  await recordAudit({ actorId: admin.id, action: 'UPDATE', entityType: 'User', entityId: userId, metadata: { status } })
  revalidatePath('/admin/users')
}
