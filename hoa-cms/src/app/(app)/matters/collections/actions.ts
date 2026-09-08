'use server'

import { z } from 'zod'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { requireActor } from '@/lib/session'
import {
  canEditClientsAndMatters,
  canTransitionCollectionsStatus,
  canEditOwnerLedger,
  canEditCertifiedMail,
  canEditFirmLedger,
  ForbiddenError,
} from '@/lib/rbac'
import { withAudit } from '@/lib/audit'
import { nextMatterNumber } from '@/lib/numbering'
import { assertTransitionAllowed, syncMatterStatus } from '@/lib/collections/stateMachine'
import { getCertifiedMailAdapter } from '@/lib/certifiedMail'
import { getBillingSyncAdapter } from '@/lib/billing'
import { parseLocalDate } from '@/lib/dates'
import type { CollectionsStatus } from '@prisma/client'

const createSchema = z.object({
  clientId: z.string().min(1),
  title: z.string().min(1),
  responsibleAttorneyId: z.string().min(1),
  assignedParalegalId: z.string().optional(),
  unitAddressLine1: z.string().min(1),
  unitAddressLine2: z.string().optional(),
  unitCity: z.string().min(1),
  unitPostalCode: z.string().min(1),
  ownerFirstName: z.string().min(1),
  ownerLastName: z.string().min(1),
  ownerEmail: z.string().email().optional().or(z.literal('')),
  ownerPhone: z.string().optional(),
})

export async function createCollectionsMatter(formData: FormData) {
  const actor = await requireActor()
  if (!canEditClientsAndMatters(actor)) throw new ForbiddenError()

  const parsed = createSchema.parse({
    clientId: formData.get('clientId'),
    title: formData.get('title'),
    responsibleAttorneyId: formData.get('responsibleAttorneyId'),
    assignedParalegalId: formData.get('assignedParalegalId') || undefined,
    unitAddressLine1: formData.get('unitAddressLine1'),
    unitAddressLine2: formData.get('unitAddressLine2') || undefined,
    unitCity: formData.get('unitCity'),
    unitPostalCode: formData.get('unitPostalCode'),
    ownerFirstName: formData.get('ownerFirstName'),
    ownerLastName: formData.get('ownerLastName'),
    ownerEmail: formData.get('ownerEmail') || undefined,
    ownerPhone: formData.get('ownerPhone') || undefined,
  })

  const client = await db.client.findFirst({ where: { id: parsed.clientId, organizationId: actor.organizationId } })
  if (!client) throw new Error('Client not found')

  const matterNumber = await nextMatterNumber('COLLECTIONS')

  const matter = await db.$transaction(async (tx) => {
    const m = await tx.matter.create({
      data: {
        organizationId: actor.organizationId,
        matterNumber,
        clientId: client.id,
        practiceArea: 'COLLECTIONS',
        title: parsed.title,
        responsibleAttorneyId: parsed.responsibleAttorneyId,
        assignedParalegalId: parsed.assignedParalegalId || undefined,
      },
    })

    await tx.collectionsMatterDetail.create({
      data: {
        matterId: m.id,
        unitAddressLine1: parsed.unitAddressLine1,
        unitAddressLine2: parsed.unitAddressLine2,
        unitCity: parsed.unitCity,
        unitPostalCode: parsed.unitPostalCode,
      },
    })

    const owner = await tx.contact.create({
      data: {
        organizationId: actor.organizationId,
        contactType: 'UNIT_OWNER',
        firstName: parsed.ownerFirstName,
        lastName: parsed.ownerLastName,
        email: parsed.ownerEmail || undefined,
        phone: parsed.ownerPhone,
        mailingAddressLine1: parsed.unitAddressLine1,
        mailingAddressLine2: parsed.unitAddressLine2,
        city: parsed.unitCity,
        state: 'FL',
        postalCode: parsed.unitPostalCode,
      },
    })

    await tx.matterContact.create({
      data: { matterId: m.id, contactId: owner.id, role: 'Primary Owner' },
    })

    return m
  })

  await withAudit(
    { organizationId: actor.organizationId, actorId: actor.id, action: 'CREATE', entityType: 'Matter', entityId: matter.id },
    async () => {}
  )

  redirect(`/matters/collections/${matter.id}`)
}

const balanceEntrySchema = z.object({
  entryType: z.enum(['ASSESSMENT', 'LATE_FEE', 'INTEREST', 'ATTORNEY_FEE', 'COST', 'PAYMENT', 'ADJUSTMENT']),
  amountDollars: z.coerce.number(),
  description: z.string().optional(),
})

async function resyncBalance(collectionsMatterDetailId: string) {
  const agg = await db.ownerLedgerEntry.aggregate({
    where: { collectionsMatterDetailId },
    _sum: { amountCents: true },
  })
  await db.collectionsMatterDetail.update({
    where: { id: collectionsMatterDetailId },
    data: { currentBalanceCents: agg._sum.amountCents ?? 0 },
  })
}

const CHARGE_TYPES = new Set(['ASSESSMENT', 'LATE_FEE', 'INTEREST', 'ATTORNEY_FEE', 'COST'])

export async function addOwnerLedgerEntry(matterId: string, formData: FormData) {
  const actor = await requireActor()
  if (!canEditOwnerLedger(actor)) throw new ForbiddenError()

  const matter = await db.matter.findFirst({
    where: { id: matterId, organizationId: actor.organizationId },
    include: { collectionsDetail: true },
  })
  if (!matter?.collectionsDetail) throw new Error('Collections matter not found')

  const parsed = balanceEntrySchema.parse({
    entryType: formData.get('entryType'),
    amountDollars: formData.get('amountDollars'),
    description: formData.get('description') || undefined,
  })

  // Charges (assessments, fees, interest, costs) increase what's owed;
  // payments/credit adjustments decrease it — sign the stored cents so a
  // simple SUM() is always the running balance.
  const magnitudeCents = Math.round(Math.abs(parsed.amountDollars) * 100)
  const amountCents = CHARGE_TYPES.has(parsed.entryType) ? magnitudeCents : -magnitudeCents

  await withAudit(
    { organizationId: actor.organizationId, actorId: actor.id, action: 'CREATE', entityType: 'OwnerLedgerEntry' },
    () =>
      db.ownerLedgerEntry.create({
        data: {
          collectionsMatterDetailId: matter.collectionsDetail!.id,
          entryType: parsed.entryType,
          amountCents,
          description: parsed.description,
          createdById: actor.id,
        },
      })
  )

  await resyncBalance(matter.collectionsDetail.id)
  redirect(`/matters/collections/${matterId}?tab=ledger`)
}

const transitionSchema = z.object({
  to: z.string(),
})

export async function transitionCollectionsStatus(matterId: string, formData: FormData) {
  const actor = await requireActor()

  const matter = await db.matter.findFirst({
    where: { id: matterId, organizationId: actor.organizationId },
    include: { collectionsDetail: true },
  })
  if (!matter?.collectionsDetail) throw new Error('Collections matter not found')

  const { to } = transitionSchema.parse({ to: formData.get('to') })
  const toStatus = to as CollectionsStatus

  if (!canTransitionCollectionsStatus(actor, toStatus)) throw new ForbiddenError('Not permitted to make this transition')

  const overriddenStay = formData.get('overrideStay') === 'on'
  if (matter.collectionsDetail.bankruptcyStayActive && toStatus !== 'CLOSED' && !overriddenStay) {
    throw new Error('Bankruptcy stay is active — an explicit override is required to proceed with this transition')
  }

  const extra: Record<string, unknown> = {}
  let lienToCreate: { orBook: string; orPage: string; amountCents: number; recordedDate: Date } | null = null
  if (toStatus === 'LIEN_RECORDED') {
    const orBook = formData.get('orBook')
    const orPage = formData.get('orPage')
    const amt = formData.get('lienAmountDollars')
    const recordedDate = formData.get('recordedDate')
    if (!orBook || !orPage || !amt || !recordedDate) throw new Error('Lien details are required for this transition')
    lienToCreate = {
      orBook: String(orBook),
      orPage: String(orPage),
      amountCents: Math.round(Number(amt) * 100),
      recordedDate: parseLocalDate(String(recordedDate)),
    }
  }
  if (toStatus === 'SUIT_FILED') {
    extra.caseNumber = formData.get('caseNumber') || undefined
    extra.court = formData.get('court') || undefined
    extra.suitFiledDate = new Date()
  }
  if (toStatus === 'JUDGMENT') {
    const amt = formData.get('judgmentAmountDollars')
    extra.judgmentDate = new Date()
    extra.judgmentAmountCents = amt ? Math.round(Number(amt) * 100) : undefined
  }
  if (toStatus === 'SALE_SCHEDULED') {
    const d = formData.get('saleScheduledDate')
    extra.saleScheduledDate = d ? parseLocalDate(String(d)) : undefined
  }
  if (toStatus === 'SALE_HELD') {
    const price = formData.get('salePriceDollars')
    extra.saleHeldDate = new Date()
    extra.salePriceCents = price ? Math.round(Number(price) * 100) : undefined
  }
  if (toStatus === 'CLOSED') {
    extra.closedReason = formData.get('closedReason') || 'OTHER'
    extra.closedAt = new Date()
  }

  assertTransitionAllowed(matter.collectionsDetail.status, toStatus)

  await withAudit(
    {
      organizationId: actor.organizationId,
      actorId: actor.id,
      action: 'STATUS_TRANSITION',
      entityType: 'CollectionsMatterDetail',
      entityId: matter.collectionsDetail.id,
      metadata: { from: matter.collectionsDetail.status, to: toStatus, ...(overriddenStay ? { overriddenStay: true } : {}) },
    },
    () =>
      db.$transaction(async (tx) => {
        await tx.collectionsMatterDetail.update({
          where: { id: matter.collectionsDetail!.id },
          data: { status: toStatus, statusChangedAt: new Date(), ...extra },
        })
        if (lienToCreate) {
          await tx.lienRecord.create({
            data: { collectionsMatterDetailId: matter.collectionsDetail!.id, ...lienToCreate },
          })
        }
      })
  )

  await syncMatterStatus(matterId)
  redirect(`/matters/collections/${matterId}`)
}

const certifiedMailSchema = z.object({
  recipientName: z.string().min(1),
  recipientAddress: z.string().min(1),
})

export async function sendCertifiedMail(matterId: string, formData: FormData) {
  const actor = await requireActor()
  if (!canEditCertifiedMail(actor)) throw new ForbiddenError()

  const matter = await db.matter.findFirst({ where: { id: matterId, organizationId: actor.organizationId } })
  if (!matter) throw new Error('Matter not found')

  const parsed = certifiedMailSchema.parse({
    recipientName: formData.get('recipientName'),
    recipientAddress: formData.get('recipientAddress'),
  })

  const adapter = getCertifiedMailAdapter()
  const result = await adapter.send({ recipientName: parsed.recipientName, recipientAddress: parsed.recipientAddress })

  await withAudit(
    { organizationId: actor.organizationId, actorId: actor.id, action: 'CREATE', entityType: 'CertifiedMailing' },
    () =>
      db.certifiedMailing.create({
        data: {
          matterId,
          recipientName: parsed.recipientName,
          recipientAddress: parsed.recipientAddress,
          provider: result.provider,
          trackingNumber: result.trackingNumber,
          status: 'IN_TRANSIT',
        },
      })
  )

  redirect(`/matters/collections/${matterId}?tab=mail`)
}

/// Dev-only control: the mock adapter has no real carrier to poll for
/// delivery status, so this simulates a "delivered" webhook. Guarded by
/// the same RBAC check as sending mail; not exposed once a real adapter
/// with real delivery callbacks exists.
export async function simulateCertifiedMailDelivery(matterId: string, mailingId: string) {
  const actor = await requireActor()
  if (!canEditCertifiedMail(actor)) throw new ForbiddenError()

  const mailing = await db.certifiedMailing.findFirst({
    where: { id: mailingId, matter: { organizationId: actor.organizationId } },
  })
  if (!mailing) throw new Error('Mailing not found')

  await withAudit(
    { organizationId: actor.organizationId, actorId: actor.id, action: 'UPDATE', entityType: 'CertifiedMailing', entityId: mailingId },
    () =>
      db.certifiedMailing.update({
        where: { id: mailingId },
        data: { status: 'DELIVERED', deliveredDate: new Date() },
      })
  )

  redirect(`/matters/collections/${matterId}?tab=mail`)
}

const bankruptcySchema = z.object({
  caseNumber: z.string().min(1),
  chapter: z.enum(['CHAPTER_7', 'CHAPTER_11', 'CHAPTER_13']),
  trusteeName: z.string().optional(),
  court: z.string().optional(),
  filedDate: z.string().min(1),
})

export async function addBankruptcyMatter(parentMatterId: string, formData: FormData) {
  const actor = await requireActor()
  if (!canEditClientsAndMatters(actor)) throw new ForbiddenError()

  const parent = await db.matter.findFirst({
    where: { id: parentMatterId, organizationId: actor.organizationId },
    include: { collectionsDetail: true },
  })
  if (!parent?.collectionsDetail) throw new Error('Collections matter not found')

  const parsed = bankruptcySchema.parse({
    caseNumber: formData.get('caseNumber'),
    chapter: formData.get('chapter'),
    trusteeName: formData.get('trusteeName') || undefined,
    court: formData.get('court') || undefined,
    filedDate: formData.get('filedDate'),
  })

  const matterNumber = await nextMatterNumber(parent.practiceArea)

  await db.$transaction(async (tx) => {
    const child = await tx.matter.create({
      data: {
        organizationId: actor.organizationId,
        matterNumber,
        clientId: parent.clientId,
        practiceArea: parent.practiceArea,
        matterType: 'BANKRUPTCY_ANCILLARY',
        parentMatterId: parent.id,
        title: `Bankruptcy — ${parent.title}`,
        responsibleAttorneyId: parent.responsibleAttorneyId,
        assignedParalegalId: parent.assignedParalegalId,
      },
    })

    await tx.bankruptcyMatterDetail.create({
      data: {
        matterId: child.id,
        caseNumber: parsed.caseNumber,
        chapter: parsed.chapter,
        trusteeName: parsed.trusteeName,
        court: parsed.court,
        filedDate: parseLocalDate(parsed.filedDate),
      },
    })

    // The federal automatic stay halts collection activity the moment the
    // bankruptcy petition is filed — reflect that immediately on the
    // parent Collections matter rather than waiting for a separate step.
    await tx.collectionsMatterDetail.update({
      where: { id: parent.collectionsDetail!.id },
      data: { bankruptcyStayActive: true },
    })
  })

  await withAudit(
    { organizationId: actor.organizationId, actorId: actor.id, action: 'CREATE', entityType: 'Matter' },
    async () => {}
  )

  await syncMatterStatus(parentMatterId)
  redirect(`/matters/collections/${parentMatterId}?tab=linked`)
}

const evictionSchema = z.object({
  caseNumber: z.string().min(1),
  court: z.string().optional(),
  filedDate: z.string().min(1),
  hearingDate: z.string().optional(),
})

export async function addEvictionMatter(parentMatterId: string, formData: FormData) {
  const actor = await requireActor()
  if (!canEditClientsAndMatters(actor)) throw new ForbiddenError()

  const parent = await db.matter.findFirst({ where: { id: parentMatterId, organizationId: actor.organizationId } })
  if (!parent) throw new Error('Collections matter not found')

  const parsed = evictionSchema.parse({
    caseNumber: formData.get('caseNumber'),
    court: formData.get('court') || undefined,
    filedDate: formData.get('filedDate'),
    hearingDate: formData.get('hearingDate') || undefined,
  })

  const matterNumber = await nextMatterNumber(parent.practiceArea)

  await db.$transaction(async (tx) => {
    const child = await tx.matter.create({
      data: {
        organizationId: actor.organizationId,
        matterNumber,
        clientId: parent.clientId,
        practiceArea: parent.practiceArea,
        matterType: 'EVICTION_ANCILLARY',
        parentMatterId: parent.id,
        title: `Eviction — ${parent.title}`,
        responsibleAttorneyId: parent.responsibleAttorneyId,
        assignedParalegalId: parent.assignedParalegalId,
      },
    })

    await tx.evictionMatterDetail.create({
      data: {
        matterId: child.id,
        caseNumber: parsed.caseNumber,
        court: parsed.court,
        filedDate: parseLocalDate(parsed.filedDate),
        hearingDate: parsed.hearingDate ? parseLocalDate(parsed.hearingDate) : undefined,
      },
    })
  })

  await withAudit(
    { organizationId: actor.organizationId, actorId: actor.id, action: 'CREATE', entityType: 'Matter' },
    async () => {}
  )

  redirect(`/matters/collections/${parentMatterId}?tab=linked`)
}

const firmLedgerSchema = z.object({
  entryType: z.enum(['FEE', 'COST', 'PAYMENT', 'ADJUSTMENT']),
  amountDollars: z.coerce.number(),
  description: z.string().optional(),
})

export async function addFirmLedgerEntry(matterId: string, formData: FormData) {
  const actor = await requireActor()
  if (!canEditFirmLedger(actor)) throw new ForbiddenError()

  const matter = await db.matter.findFirst({ where: { id: matterId, organizationId: actor.organizationId } })
  if (!matter) throw new Error('Matter not found')

  const parsed = firmLedgerSchema.parse({
    entryType: formData.get('entryType'),
    amountDollars: formData.get('amountDollars'),
    description: formData.get('description') || undefined,
  })

  await withAudit(
    { organizationId: actor.organizationId, actorId: actor.id, action: 'CREATE', entityType: 'LedgerEntry' },
    () =>
      db.ledgerEntry.create({
        data: {
          matterId,
          entryType: parsed.entryType,
          amountCents: Math.round(parsed.amountDollars * 100),
          description: parsed.description,
          createdById: actor.id,
        },
      })
  )

  redirect(`/matters/collections/${matterId}?tab=billing`)
}

/// Manual "Sync to QuickBooks" trigger — mirrors the certified mail tab's
/// dev-only simulate-delivery control. There is no real accounting vendor
/// wired up (see lib/billing), so this just marks the entry synced with a
/// fabricated reference id.
export async function syncFirmLedgerEntry(matterId: string, entryId: string) {
  const actor = await requireActor()
  if (!canEditFirmLedger(actor)) throw new ForbiddenError()

  const entry = await db.ledgerEntry.findFirst({
    where: { id: entryId, matter: { organizationId: actor.organizationId } },
    include: { matter: { include: { client: true } } },
  })
  if (!entry) throw new Error('Ledger entry not found')

  const adapter = getBillingSyncAdapter()
  const result = await adapter.syncEntry({
    matterNumber: entry.matter.matterNumber,
    clientName: entry.matter.client.name,
    entryType: entry.entryType,
    amountCents: entry.amountCents,
    description: entry.description,
    entryDate: entry.entryDate,
  })

  await withAudit(
    { organizationId: actor.organizationId, actorId: actor.id, action: 'UPDATE', entityType: 'LedgerEntry', entityId: entryId },
    () =>
      db.ledgerEntry.update({
        where: { id: entryId },
        data: { qbSyncStatus: 'SYNCED', qbReferenceId: result.qbReferenceId },
      })
  )

  redirect(`/matters/collections/${matterId}?tab=billing`)
}
