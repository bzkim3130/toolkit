export function RiskScore({ value }: { value: number }) {
  const color = value >= 70 ? 'bg-red-500' : value >= 40 ? 'bg-amber-500' : 'bg-emerald-500'
  const text = value >= 70 ? 'text-red-400' : value >= 40 ? 'text-amber-400' : 'text-emerald-400'

  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-800">
        <div className={`h-full ${color}`} style={{ width: `${value}%` }} />
      </div>
      <span className={`text-xs tabular-nums ${text}`}>{value}</span>
    </div>
  )
}
