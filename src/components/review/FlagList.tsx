import type { ReviewFlag } from '@/lib/documents/blocks'

const SEVERITY: Record<string, { label: string; cls: string }> = {
  warning: { label: 'Warning', cls: 'border-red-200 bg-red-50 text-red-900' },
  caution: { label: 'Caution', cls: 'border-amber-200 bg-amber-50 text-amber-900' },
  info: { label: 'Note', cls: 'border-blue-200 bg-blue-50 text-blue-900' },
}

export function FlagList({ flags }: { flags: ReviewFlag[] }) {
  if (!flags || flags.length === 0) {
    return <p className="text-sm text-gray-500">No issues flagged.</p>
  }
  // Warnings first, then cautions, then info.
  const order: Record<string, number> = { warning: 0, caution: 1, info: 2 }
  const sorted = [...flags].sort((a, b) => (order[a.severity] ?? 3) - (order[b.severity] ?? 3))

  return (
    <ul className="space-y-2">
      {sorted.map((f, i) => {
        const sev = SEVERITY[f.severity] ?? SEVERITY.info!
        return (
          <li key={`${f.code}-${i}`} className={`rounded-md border p-3 text-sm ${sev.cls}`}>
            <div className="flex items-center gap-2">
              <span className="rounded bg-white/60 px-1.5 py-0.5 text-xs font-semibold uppercase">{sev.label}</span>
              <span className="text-xs font-medium opacity-70">{f.code}</span>
            </div>
            <p className="mt-1">{f.message}</p>
            {f.authority && <p className="mt-1 text-xs opacity-70">Authority: {f.authority}</p>}
          </li>
        )
      })}
    </ul>
  )
}
