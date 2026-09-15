import type { ReactNode } from 'react'
import { Search } from 'lucide-react'
import { SEVERITY_LABEL, ALERT_STATUS_LABEL } from '../../lib/labels'
import type { AlertSource, AlertStatus, Severity } from '../../types/alert'

const ALL_SEVERITIES: Severity[] = ['critical', 'high', 'medium', 'low', 'info']
const ALL_STATUSES: AlertStatus[] = ['new', 'investigating', 'resolved', 'false_positive', 'closed']

function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value]
}

interface Props {
  q: string
  severity: Severity[]
  status: AlertStatus[]
  source: AlertSource | undefined
  onChange: (patch: Partial<{ q: string; severity: Severity[]; status: AlertStatus[]; source: AlertSource | undefined }>) => void
}

export function AlertFilterBar({ q, severity, status, source, onChange }: Props) {
  return (
    <div className="flex flex-col gap-3 border-b border-slate-800 p-4">
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-500" />
        <input
          value={q}
          onChange={(e) => onChange({ q: e.target.value })}
          placeholder="제목/설명 검색..."
          className="w-full rounded-md border border-slate-700 bg-slate-900 py-2 pl-9 pr-3 text-sm text-slate-100 placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none"
        />
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <FilterGroup label="심각도">
          {ALL_SEVERITIES.map((s) => (
            <Chip
              key={s}
              active={severity.includes(s)}
              onClick={() => onChange({ severity: toggle(severity, s) })}
            >
              {SEVERITY_LABEL[s]}
            </Chip>
          ))}
        </FilterGroup>

        <FilterGroup label="상태">
          {ALL_STATUSES.map((s) => (
            <Chip key={s} active={status.includes(s)} onClick={() => onChange({ status: toggle(status, s) })}>
              {ALERT_STATUS_LABEL[s]}
            </Chip>
          ))}
        </FilterGroup>

        <FilterGroup label="소스">
          {(['EDR', 'NDR'] as const).map((s) => (
            <Chip key={s} active={source === s} onClick={() => onChange({ source: source === s ? undefined : s })}>
              {s}
            </Chip>
          ))}
        </FilterGroup>
      </div>
    </div>
  )
}

function FilterGroup({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="mr-1 text-xs font-medium text-slate-500">{label}</span>
      {children}
    </div>
  )
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
        active
          ? 'border-cyan-500 bg-cyan-500/15 text-cyan-300'
          : 'border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-200'
      }`}
    >
      {children}
    </button>
  )
}
