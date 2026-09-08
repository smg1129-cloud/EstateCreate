import { createNote } from '@/app/(app)/notes/actions'

interface NoteRow {
  id: string
  category: string
  body: string
  createdAt: Date
  author: { firstName: string; lastName: string }
}

export function NotesPanel({
  notes,
  clientId,
  matterId,
  redirectPath,
  canEdit,
}: {
  notes: NoteRow[]
  clientId?: string
  matterId?: string
  redirectPath: string
  canEdit: boolean
}) {
  return (
    <div>
      <ul className="space-y-4">
        {notes.map((n) => (
          <li key={n.id} className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>
                {n.author.firstName} {n.author.lastName} · {n.category.replaceAll('_', ' ')}
              </span>
              <span>{n.createdAt.toLocaleString()}</span>
            </div>
            <p className="mt-2 whitespace-pre-wrap text-sm text-slate-800">{n.body}</p>
          </li>
        ))}
        {notes.length === 0 && <p className="text-sm text-slate-400">No notes yet.</p>}
      </ul>

      {canEdit && (
        <form action={createNote} className="mt-6 max-w-xl space-y-3">
          {clientId && <input type="hidden" name="clientId" value={clientId} />}
          {matterId && <input type="hidden" name="matterId" value={matterId} />}
          <input type="hidden" name="redirectPath" value={redirectPath} />
          <div>
            <label className="block text-xs font-medium text-slate-700" htmlFor="category">Category</label>
            <select id="category" name="category" className="mt-1 rounded-md border border-slate-300 px-3 py-2 text-sm">
              <option value="GENERAL">General</option>
              <option value="CALL">Call</option>
              <option value="EMAIL">Email</option>
              <option value="COURT_APPEARANCE">Court appearance</option>
              <option value="INTERNAL">Internal</option>
            </select>
          </div>
          <div>
            <textarea
              name="body"
              required
              rows={3}
              placeholder="Add a note..."
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <button type="submit" className="rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700">
            Add note
          </button>
        </form>
      )}
    </div>
  )
}
