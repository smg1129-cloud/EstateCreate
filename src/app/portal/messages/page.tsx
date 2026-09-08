import { db } from '@/lib/db'
import { getCurrentPatientOrRedirect } from '@/lib/currentPatient'
import { sendPortalMessage } from './actions'

export default async function PortalMessagesPage() {
  const { patient } = await getCurrentPatientOrRedirect()

  const messages = await db.communicationLog.findMany({
    where: { patientId: patient.id, channel: 'PORTAL_MESSAGE' },
    orderBy: { createdAt: 'asc' },
    include: { author: true },
  })

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-semibold text-gray-900">Messages</h1>
      <p className="mt-1 text-sm text-gray-500">
        For medical emergencies, call 911. This inbox is checked during business hours.
      </p>

      <ul className="mt-6 space-y-3">
        {messages.map((m) => (
          <li
            key={m.id}
            className={`rounded-lg border p-3 text-sm ${
              m.direction === 'OUTBOUND' ? 'border-brand-200 bg-brand-50' : 'border-gray-200 bg-white'
            }`}
          >
            <p className="mb-1 text-xs text-gray-500">
              {m.direction === 'OUTBOUND' ? 'You' : `${m.author.firstName} ${m.author.lastName}`} &middot;{' '}
              {new Date(m.createdAt).toLocaleString()}
            </p>
            <p className="text-gray-800">{m.body}</p>
          </li>
        ))}
        {messages.length === 0 && <p className="text-sm text-gray-500">No messages yet.</p>}
      </ul>

      <form action={sendPortalMessage} className="mt-6 flex gap-2">
        <label htmlFor="body" className="sr-only">
          Message
        </label>
        <input
          id="body"
          name="body"
          required
          placeholder="Write a message to the care team…"
          className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
        <button
          type="submit"
          className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          Send
        </button>
      </form>
    </div>
  )
}
