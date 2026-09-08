import { uploadDocument } from '@/app/(app)/documents/actions'

interface DocumentRow {
  id: string
  category: string
  fileName: string
  sizeBytes: number
  createdAt: Date
  uploadedBy: { firstName: string; lastName: string }
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function DocumentsPanel({
  documents,
  clientId,
  matterId,
  redirectPath,
  canView,
  canUpload,
  canDownload,
}: {
  documents: DocumentRow[]
  clientId?: string
  matterId?: string
  redirectPath: string
  canView: boolean
  canUpload: boolean
  canDownload: boolean
}) {
  if (!canView) return null

  return (
    <div>
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-2">File</th>
              <th className="px-4 py-2">Category</th>
              <th className="px-4 py-2">Size</th>
              <th className="px-4 py-2">Uploaded by</th>
              <th className="px-4 py-2">Date</th>
            </tr>
          </thead>
          <tbody>
            {documents.map((d) => (
              <tr key={d.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                <td className="px-4 py-2">
                  {canDownload ? (
                    <a href={`/api/documents/${d.id}`} className="text-brand-700 hover:underline">
                      {d.fileName}
                    </a>
                  ) : (
                    <span className="text-slate-700">{d.fileName}</span>
                  )}
                </td>
                <td className="px-4 py-2 text-slate-600">{d.category.replaceAll('_', ' ')}</td>
                <td className="px-4 py-2 text-slate-600">{formatSize(d.sizeBytes)}</td>
                <td className="px-4 py-2 text-slate-600">
                  {d.uploadedBy.firstName} {d.uploadedBy.lastName}
                </td>
                <td className="px-4 py-2 text-slate-600">{d.createdAt.toLocaleDateString()}</td>
              </tr>
            ))}
            {documents.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                  No documents yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {canUpload && (
        <form action={uploadDocument} className="mt-6 flex max-w-xl items-end gap-3">
          {clientId && <input type="hidden" name="clientId" value={clientId} />}
          {matterId && <input type="hidden" name="matterId" value={matterId} />}
          <input type="hidden" name="redirectPath" value={redirectPath} />
          <div>
            <label className="block text-xs font-medium text-slate-700" htmlFor="category">Category</label>
            <select id="category" name="category" className="mt-1 rounded-md border border-slate-300 px-3 py-2 text-sm">
              <option value="DEMAND_LETTER">Demand letter</option>
              <option value="LIEN">Lien</option>
              <option value="PLEADING">Pleading</option>
              <option value="CORRESPONDENCE">Correspondence</option>
              <option value="LEDGER_EXPORT">Ledger export</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-xs font-medium text-slate-700" htmlFor="file">File</label>
            <input id="file" name="file" type="file" required className="mt-1 w-full text-sm" />
          </div>
          <button type="submit" className="rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700">
            Upload
          </button>
        </form>
      )}
    </div>
  )
}
