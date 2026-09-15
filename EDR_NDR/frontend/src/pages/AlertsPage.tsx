import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { listAlerts } from '../api/alerts'
import { AlertStatsCards } from '../components/alerts/AlertStatsCards'
import { AlertFilterBar } from '../components/alerts/AlertFilterBar'
import { AlertTable } from '../components/alerts/AlertTable'
import { AlertDetailDrawer } from '../components/alerts/AlertDetailDrawer'
import { Pagination } from '../components/common/Pagination'
import { useDebouncedValue } from '../hooks/useDebouncedValue'
import type { AlertSource, AlertStatus, Severity } from '../types/alert'

const PAGE_SIZE = 20

export function AlertsPage() {
  const [q, setQ] = useState('')
  const [severity, setSeverity] = useState<Severity[]>([])
  const [status, setStatus] = useState<AlertStatus[]>([])
  const [source, setSource] = useState<AlertSource | undefined>(undefined)
  const [page, setPage] = useState(1)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const debouncedQ = useDebouncedValue(q, 300)

  const { data, isLoading, isPlaceholderData } = useQuery({
    queryKey: ['alerts', { q: debouncedQ, severity, status, source, page }],
    queryFn: () =>
      listAlerts({ q: debouncedQ || undefined, severity, status, source, page, page_size: PAGE_SIZE, sort: '-created_at' }),
    placeholderData: (prev) => prev,
  })

  function handleFilterChange(patch: Partial<{ q: string; severity: Severity[]; status: AlertStatus[]; source: AlertSource | undefined }>) {
    if ('q' in patch) setQ(patch.q ?? '')
    if ('severity' in patch) setSeverity(patch.severity ?? [])
    if ('status' in patch) setStatus(patch.status ?? [])
    if ('source' in patch) setSource(patch.source)
    setPage(1)
  }

  return (
    <div className="flex h-full min-h-0">
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="border-b border-slate-800 px-6 py-4">
          <h1 className="text-lg font-semibold text-slate-100">알림</h1>
          <p className="text-sm text-slate-500">EDR/NDR에서 수집된 보안 알림을 조회하고 상태를 관리합니다.</p>
        </div>

        <AlertStatsCards />

        <div className="flex min-h-0 flex-1 flex-col rounded-none border-slate-800">
          <AlertFilterBar q={q} severity={severity} status={status} source={source} onChange={handleFilterChange} />

          <div className={`min-h-0 flex-1 overflow-y-auto ${isPlaceholderData ? 'opacity-60' : ''}`}>
            <AlertTable
              alerts={data?.items ?? []}
              isLoading={isLoading}
              selectedId={selectedId}
              onSelect={setSelectedId}
            />
          </div>

          <Pagination page={page} pageSize={PAGE_SIZE} total={data?.total ?? 0} onPageChange={setPage} />
        </div>
      </div>

      {selectedId && <AlertDetailDrawer alertId={selectedId} onClose={() => setSelectedId(null)} />}
    </div>
  )
}
