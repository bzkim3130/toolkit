import type { ReactNode } from 'react'

interface Props {
  label: string
  value: number | string
  accentClassName?: string
  icon?: ReactNode
}

export function StatTile({ label, value, accentClassName = 'text-slate-200', icon }: Props) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-slate-800 bg-slate-900/40 p-4">
      {icon && <div className={`shrink-0 ${accentClassName}`}>{icon}</div>}
      <div>
        <div className="text-xs text-slate-500">{label}</div>
        <div className={`mt-0.5 text-2xl font-semibold tabular-nums ${accentClassName}`}>{value}</div>
      </div>
    </div>
  )
}
