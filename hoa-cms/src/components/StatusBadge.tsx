const COLORS: Record<string, string> = {
  ACTIVE: 'bg-emerald-50 text-emerald-700',
  OPEN: 'bg-emerald-50 text-emerald-700',
  INACTIVE: 'bg-slate-100 text-slate-600',
  FORMER: 'bg-slate-100 text-slate-600',
  ON_HOLD: 'bg-amber-50 text-amber-700',
  CLOSED: 'bg-slate-100 text-slate-600',
}

export function StatusBadge({ status }: { status: string }) {
  const color = COLORS[status] ?? 'bg-slate-100 text-slate-600'
  return (
    <span className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${color}`}>
      {status.replaceAll('_', ' ')}
    </span>
  )
}
