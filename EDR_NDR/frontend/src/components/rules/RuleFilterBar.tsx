import type { ReactNode } from 'react'
import { Plus, Search } from 'lucide-react'
import { RULE_TYPE_LABEL, SEVERITY_LABEL, type RuleTypeValue } from '../../lib/labels'
import type { Severity } from '../../types/alert'

const ALL_SEVERITIES: Severity[] = ['critical', 'high', 'medium', 'low', 'info']
const ALL_TYPES: RuleTypeValue[] = ['signature', 'threshold', 'correlation']

interface Props {
  q: string
  onQChange: (v: string) => void
  severity: Severity | undefined
  onSeverityChange: (v: Severity | undefined) => void
  ruleType: RuleTypeValue | undefined
  onRuleTypeChange: (v: RuleTypeValue | undefined) => void
  enabled: boolean | undefined
  onEnabledChange: (v: boolean | undefined) => void
  onCreate: () => void
}

export function RuleFilterBar({
  q,
  onQChange,
  severity,
  onSeverityChange,
  ruleType,
  onRuleTypeChange,
  enabled,
  onEnabledChange,
  onCreate,
}: Props) {
  return (
    <div className="flex flex-col gap-3 border-b border-slate-800 p-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            value={q}
            onChange={(e) => onQChange(e.target.value)}
            placeholder="룰 이름/설명 검색..."
            className="w-full rounded-md border border-slate-700 bg-slate-900 py-2 pl-9 pr-3 text-sm text-slate-100 placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none"
          />
        </div>
        <button
          onClick={onCreate}
          className="flex items-center gap-1.5 rounded-md border border-cyan-600 bg-cyan-500/10 px-3 py-2 text-sm font-medium text-cyan-300 hover:bg-cyan-500/20"
        >
          <Plus className="h-4 w-4" />
          새 룰
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <FilterGroup label="심각도">
          {ALL_SEVERITIES.map((s) => (
            <Chip key={s} active={severity === s} onClick={() => onSeverityChange(severity === s ? undefined : s)}>
              {SEVERITY_LABEL[s]}
            </Chip>
          ))}
        </FilterGroup>

        <FilterGroup label="유형">
          {ALL_TYPES.map((t) => (
            <Chip key={t} active={ruleType === t} onClick={() => onRuleTypeChange(ruleType === t ? undefined : t)}>
              {RULE_TYPE_LABEL[t]}
            </Chip>
          ))}
        </FilterGroup>

        <FilterGroup label="상태">
          <Chip active={enabled === true} onClick={() => onEnabledChange(enabled === true ? undefined : true)}>
            활성
          </Chip>
          <Chip active={enabled === false} onClick={() => onEnabledChange(enabled === false ? undefined : false)}>
            비활성
          </Chip>
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
