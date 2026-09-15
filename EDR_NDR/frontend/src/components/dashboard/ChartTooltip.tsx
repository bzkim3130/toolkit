interface Payload {
  name?: string
  value?: number | string
  color?: string
}

interface Props {
  active?: boolean
  label?: string
  payload?: Payload[]
  labelFormatter?: (label: string) => string
}

export function ChartTooltip({ active, label, payload, labelFormatter }: Props) {
  if (!active || !payload?.length) return null

  return (
    <div className="rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-xs shadow-lg">
      {label && <div className="mb-1 font-medium text-slate-300">{labelFormatter ? labelFormatter(label) : label}</div>}
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-1.5 text-slate-400">
          {p.color && <span className="h-2 w-2 rounded-full" style={{ backgroundColor: p.color }} />}
          <span>{p.name ?? '값'}</span>
          <span className="font-medium text-slate-200">{p.value}</span>
        </div>
      ))}
    </div>
  )
}
