import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { requireActor } from '@/lib/session'
import { canEditClientsAndMatters, ForbiddenError } from '@/lib/rbac'
import { ClientForm } from '@/components/ClientForm'
import { updateClient } from '../../actions'

export default async function EditClientPage({ params }: { params: Promise<{ clientId: string }> }) {
  const actor = await requireActor()
  if (!canEditClientsAndMatters(actor)) throw new ForbiddenError()

  const { clientId } = await params
  const client = await db.client.findFirst({ where: { id: clientId, organizationId: actor.organizationId } })
  if (!client) notFound()

  const action = updateClient.bind(null, clientId)

  return (
    <div>
      <h1 className="text-xl font-semibold text-slate-900">Edit {client.name}</h1>
      <ClientForm
        action={action}
        includeStatus
        defaultValues={{
          name: client.name,
          clientType: client.clientType,
          status: client.status,
          addressLine1: client.addressLine1 ?? undefined,
          addressLine2: client.addressLine2 ?? undefined,
          city: client.city ?? undefined,
          state: client.state ?? undefined,
          postalCode: client.postalCode ?? undefined,
          county: client.county ?? undefined,
          federalEin: client.federalEin ?? undefined,
        }}
      />
    </div>
  )
}
