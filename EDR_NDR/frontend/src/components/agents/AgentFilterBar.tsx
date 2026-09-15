import { Search } from 'lucide-react'
import { AGENT_STATUS_LABEL } from '../../lib/labels'
import type { AgentStatus } from '../../types/agent'

const ALL_STATUSES: AgentStatus[] = ['online', 'offline', 'isolated']

interface Props {
  q: string
  onQChange: (v: string) => void
  status: AgentStatus | undefined
  onStatusChange: (v: AgentStatus | undefined) => void
}

export function AgentFilterBar({ q, onQChange, status, onStatusChange }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-3 border-b border-slate-800 p-4">
      <div className="relative min-w-[220px] flex-1">
        <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-500" />
        <input
          value={q}
          onChange={(e) => onQChange(e.target.value)}
          placeholder="호스트명/IP 검색..."
          className="w-full rounded-md border border-slate-700 bg-slate-900 py-2 pl-9 pr-3 text-sm text-slate-100 placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none"
        />
      </div>

      <div className="flex items-center gap-1.5">
        {ALL_STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => onStatusChange(status === s ? undefined : s)}
            className={`rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
              status === s
                ? 'border-cyan-500 bg-cyan-500/15 text-cyan-300'
                : 'border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-200'
            }`}
          >
            {AGENT_STATUS_LABEL[s]}
          </button>
        ))}
      </div>
    </div>
  )
}
