import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { listRules } from '../api/rules'
import { RuleFilterBar } from '../components/rules/RuleFilterBar'
import { RuleTable } from '../components/rules/RuleTable'
import { RuleFormDrawer } from '../components/rules/RuleFormDrawer'
import { Pagination } from '../components/common/Pagination'
import { useDebouncedValue } from '../hooks/useDebouncedValue'
import type { RuleTypeValue } from '../lib/labels'
import type { Severity } from '../types/alert'

const PAGE_SIZE = 20

export function RulesPage() {
  const [q, setQ] = useState('')
  const [severity, setSeverity] = useState<Severity | undefined>(undefined)
  const [ruleType, setRuleType] = useState<RuleTypeValue | undefined>(undefined)
  const [enabled, setEnabled] = useState<boolean | undefined>(undefined)
  const [page, setPage] = useState(1)
  const [drawer, setDrawer] = useState<{ mode: 'closed' } | { mode: 'create' } | { mode: 'edit'; id: string }>({
    mode: 'closed',
  })

  const debouncedQ = useDebouncedValue(q, 300)

  const { data, isLoading, isPlaceholderData } = useQuery({
    queryKey: ['rules', { q: debouncedQ, severity, ruleType, enabled, page }],
    queryFn: () => listRules({ q: debouncedQ || undefined, severity, rule_type: ruleType, enabled, page, page_size: PAGE_SIZE }),
    placeholderData: (prev) => prev,
  })

  return (
    <div className="flex h-full min-h-0">
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="border-b border-slate-800 px-6 py-4">
          <h1 className="text-lg font-semibold text-slate-100">탐지 룰</h1>
          <p className="text-sm text-slate-500">알림을 발생시키는 탐지 룰을 등록하고 관리합니다.</p>
        </div>

        <RuleFilterBar
          q={q}
          onQChange={(v) => {
            setQ(v)
            setPage(1)
          }}
          severity={severity}
          onSeverityChange={(v) => {
            setSeverity(v)
            setPage(1)
          }}
          ruleType={ruleType}
          onRuleTypeChange={(v) => {
            setRuleType(v)
            setPage(1)
          }}
          enabled={enabled}
          onEnabledChange={(v) => {
            setEnabled(v)
            setPage(1)
          }}
          onCreate={() => setDrawer({ mode: 'create' })}
        />

        <div className={`min-h-0 flex-1 overflow-y-auto ${isPlaceholderData ? 'opacity-60' : ''}`}>
          <RuleTable
            rules={data?.items ?? []}
            isLoading={isLoading}
            onSelect={(id) => setDrawer({ mode: 'edit', id })}
          />
        </div>

        <Pagination page={page} pageSize={PAGE_SIZE} total={data?.total ?? 0} onPageChange={setPage} />
      </div>

      {drawer.mode !== 'closed' && (
        <RuleFormDrawer
          ruleId={drawer.mode === 'edit' ? drawer.id : null}
          onClose={() => setDrawer({ mode: 'closed' })}
        />
      )}
    </div>
  )
}
