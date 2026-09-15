import { Search } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { listAgentsLite } from '../../api/agents'
import { EVENT_TYPE_LABEL, type EventTypeValue } from '../../lib/labels'
import { TimeRangePicker } from './TimeRangePicker'

const ALL_TYPES = Object.keys(EVENT_TYPE_LABEL) as EventTypeValue[]

interface Props {
  start: Date
  end: Date
  onRangeChange: (start: Date, end: Date) => void
  keyword: string
  onKeywordChange: (v: string) => void
  eventTypes: EventTypeValue[]
  onEventTypesChange: (v: EventTypeValue[]) => void
  agentId: string | undefined
  onAgentChange: (v: string | undefined) => void
}

export function EventFilterBar({
  start,
  end,
  onRangeChange,
  keyword,
  onKeywordChange,
  eventTypes,
  onEventTypesChange,
  agentId,
  onAgentChange,
}: Props) {
  const { data: agents } = useQuery({ queryKey: ['agents-lite'], queryFn: listAgentsLite })

  function toggleType(t: EventTypeValue) {
    onEventTypesChange(eventTypes.includes(t) ? eventTypes.filter((x) => x !== t) : [...eventTypes, t])
  }

  return (
    <div className="flex flex-col gap-3 border-b border-slate-800 p-4">
      <div className="flex flex-wrap items-center gap-3">
        <TimeRangePicker start={start} end={end} onChange={onRangeChange} />

        <select
          value={agentId ?? ''}
          onChange={(e) => onAgentChange(e.target.value || undefined)}
          className="rounded-md border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-sm text-slate-200 focus:border-cyan-500 focus:outline-none"
        >
          <option value="">전체 에이전트</option>
          {agents?.items.map((a) => (
            <option key={a.id} value={a.id}>
              {a.hostname}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            value={keyword}
            onChange={(e) => onKeywordChange(e.target.value)}
            placeholder="프로세스명/명령줄/경로/도메인 검색..."
            className="w-full rounded-md border border-slate-700 bg-slate-900 py-2 pl-9 pr-3 text-sm text-slate-100 placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {ALL_TYPES.map((t) => (
            <button
              key={t}
              onClick={() => toggleType(t)}
              className={`rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
                eventTypes.includes(t)
                  ? 'border-cyan-500 bg-cyan-500/15 text-cyan-300'
                  : 'border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-200'
              }`}
            >
              {EVENT_TYPE_LABEL[t]}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
