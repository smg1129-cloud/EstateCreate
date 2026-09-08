import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { headers } from 'next/headers'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { getPaymentProvider } from '@/lib/payments'
import { recordAudit } from '@/lib/audit'

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.role !== 'PATIENT') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { invoiceId } = (await req.json()) as { invoiceId?: string }
  if (!invoiceId) return NextResponse.json({ error: 'invoiceId is required' }, { status: 400 })

  const patient = await db.patient.findUnique({ where: { userId: session.user.id }, include: { user: true } })
  if (!patient) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const invoice = await db.invoice.findUnique({ where: { id: invoiceId } })
  if (!invoice || invoice.patientId !== patient.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  if (invoice.status !== 'OPEN') {
    return NextResponse.json({ error: 'Invoice is not open' }, { status: 400 })
  }

  const origin = headers().get('origin') ?? process.env.NEXTAUTH_URL ?? 'http://localhost:3000'
  const provider = getPaymentProvider()

  const result = await provider.createCheckout({
    invoiceId: invoice.id,
    amountCents: invoice.amountCents,
    currency: invoice.currency,
    patientEmail: patient.user.email,
    successUrl: `${origin}/portal/billing`,
    cancelUrl: `${origin}/portal/billing`,
  })

  await db.invoice.update({ where: { id: invoice.id }, data: { stripePaymentIntentId: result.providerRef } })

  if (result.paidImmediately) {
    await db.invoice.update({ where: { id: invoice.id }, data: { status: 'PAID', paidAt: new Date() } })
    await recordAudit({
      actorId: session.user.id,
      action: 'UPDATE',
      entityType: 'Invoice',
      entityId: invoice.id,
      metadata: { status: 'PAID', via: 'mock-payment' },
    })
  }

  return NextResponse.json({ redirectUrl: result.redirectUrl })
}
