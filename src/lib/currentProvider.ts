import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function getCurrentProviderOrRedirect() {
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.role !== 'CLINICIAN') redirect('/login')

  const provider = await db.provider.findUnique({
    where: { userId: session.user.id },
    include: { user: true },
  })
  if (!provider) redirect('/login')

  return { session, provider }
}
