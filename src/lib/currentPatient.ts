import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

/// Server-component helper: resolves the signed-in PATIENT's own Patient
/// record. Deliberately scoped to `userId: session.user.id` — there is no
/// path here for a patient to fetch anyone else's record.
export async function getCurrentPatientOrRedirect() {
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.role !== 'PATIENT') redirect('/login')

  const patient = await db.patient.findUnique({
    where: { userId: session.user.id },
    include: { user: true },
  })
  if (!patient) redirect('/login')

  return { session, patient }
}
