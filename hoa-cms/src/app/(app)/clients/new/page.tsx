import { requireActor } from '@/lib/session'
import { canEditClientsAndMatters, ForbiddenError } from '@/lib/rbac'
import { ClientForm } from '@/components/ClientForm'
import { createClient } from '../actions'

export default async function NewClientPage() {
  const actor = await requireActor()
  if (!canEditClientsAndMatters(actor)) throw new ForbiddenError()

  return (
    <div>
      <h1 className="text-xl font-semibold text-slate-900">New Client</h1>
      <ClientForm action={createClient} />
    </div>
  )
}
