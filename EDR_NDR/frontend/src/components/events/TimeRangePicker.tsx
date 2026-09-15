import { fromLocalInputValue, toLocalInputValue } from '../../lib/datetime'

const PRESETS: { label: string; hours: number }[] = [
  { label: '1시간', hours: 1 },
  { label: '6시간', hours: 6 },
  { label: '24시간', hours: 24 },
  { label: '7일', hours: 24 * 7 },
]

interface Props {
  start: Date
  end: Date
  onChange: (start: Date, end: Date) => void
}

export function TimeRangePicker({ start, end, onChange }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <input
        type="datetime-local"
        value={toLocalInputValue(start)}
        onChange={(e) => e.target.value && onChange(fromLocalInputValue(e.target.value), end)}
        className="rounded-md border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-sm text-slate-200 focus:border-cyan-500 focus:outline-none"
      />
      <span className="text-slate-500">~</span>
      <input
        type="datetime-local"
        value={toLocalInputValue(end)}
        onChange={(e) => e.target.value && onChange(start, fromLocalInputValue(e.target.value))}
        className="rounded-md border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-sm text-slate-200 focus:border-cyan-500 focus:outline-none"
      />

      <div className="ml-1 flex items-center gap-1">
        {PRESETS.map((p) => (
          <button
            key={p.label}
            onClick={() => {
              const now = new Date()
              onChange(new Date(now.getTime() - p.hours * 3600_000), now)
            }}
            className="rounded-md border border-slate-700 px-2 py-1.5 text-xs text-slate-400 hover:border-slate-500 hover:text-slate-200"
          >
            최근 {p.label}
          </button>
        ))}
      </div>
    </div>
  )
}
