import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Sparkles } from 'lucide-react'
import { getAlert } from '../api/alerts'
import { searchEvents, analyzeByAlert } from '../api/events'
import { EventFilterBar } from '../components/events/EventFilterBar'
import { EventTable } from '../components/events/EventTable'
import { EventContextDrawer } from '../components/events/EventContextDrawer'
import { AnalysisResultCard } from '../components/events/AnalysisResultCard'
import { Pagination } from '../components/common/Pagination'
import { useDebouncedValue } from '../hooks/useDebouncedValue'
import { toUtcIso, parseBackendTimestamp } from '../lib/datetime'
import type { EventTypeValue } from '../lib/labels'
import type { EventOut } from '../types/event'
import type { AnalysisResult } from '../types/analysis'

const PAGE_SIZE = 30

function defaultRange() {
  const end = new Date()
  const start = new Date(end.getTime() - 24 * 3600_000)
  return { start, end }
}

export function InvestigatePage() {
  const [searchParams] = useSearchParams()
  const alertId = searchParams.get('alertId')

  const [{ start, end }, setRange] = useState(defaultRange)
  const [agentId, setAgentId] = useState<string | undefined>(() => searchParams.get('agentId') ?? undefined)
  const [keyword, setKeyword] = useState('')
  const [eventTypes, setEventTypes] = useState<EventTypeValue[]>([])
  const [page, setPage] = useState(1)
  const [selectedEvent, setSelectedEvent] = useState<EventOut | null>(null)
  const [alertAnalysis, setAlertAnalysis] = useState<AnalysisResult | null>(null)

  const debouncedKeyword = useDebouncedValue(keyword, 300)

  const { data: alert } = useQuery({
    queryKey: ['alert', alertId],
    queryFn: () => getAlert(alertId!),
    enabled: !!alertId,
  })

  const alertAnalyzeMutation = useMutation({
    mutationFn: (id: string) => analyzeByAlert(id),
    onSuccess: (result) => setAlertAnalysis(result),
  })

  // Deep link from an alert: center the window on it, scope to its agent, and
  // kick off the heuristic analysis immediately.
  useEffect(() => {
    if (!alert) return
    const anchor = parseBackendTimestamp(alert.created_at)
    setRange({ start: new Date(anchor.getTime() - 2 * 3600_000), end: new Date(anchor.getTime() + 2 * 3600_000) })
    setAgentId(alert.agent?.id)
    setPage(1)
    alertAnalyzeMutation.mutate(alert.id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [alert])

  const { data, isLoading } = useQuery({
    queryKey: ['events-search', { start: start.getTime(), end: end.getTime(), agentId, eventTypes, debouncedKeyword, page }],
    queryFn: () =>
      searchEvents({
        start_time: toUtcIso(start),
        end_time: toUtcIso(end),
        agent_id: agentId,
        event_type: eventTypes,
        keyword: debouncedKeyword || undefined,
        page,
        page_size: PAGE_SIZE,
      }),
    placeholderData: (prev) => prev,
  })

  return (
    <div className="flex h-full min-h-0">
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="border-b border-slate-800 px-6 py-4">
          <h1 className="text-lg font-semibold text-slate-100">사고 조사</h1>
          <p className="text-sm text-slate-500">시간 범위를 지정해 원시 이벤트를 검색하고, 이벤트를 선택해 앞뒤 컨텍스트와 분석 결과를 확인합니다.</p>
        </div>

        {alertId && (
          <div className="border-b border-slate-800 p-4">
            <div className="mb-2 text-xs text-slate-500">
              연관 알림: <span className="text-slate-300">{alert?.title ?? '불러오는 중...'}</span> 기준 ±2시간으로 조사
            </div>
            {alertAnalyzeMutation.isPending && <div className="text-sm text-slate-500">알림 기반 분석 실행 중...</div>}
            {alertAnalysis && <AnalysisResultCard result={alertAnalysis} />}
            {!alertAnalysis && !alertAnalyzeMutation.isPending && alert && (
              <button
                onClick={() => alertAnalyzeMutation.mutate(alert.id)}
                className="flex items-center gap-1.5 rounded-md border border-cyan-600 bg-cyan-500/10 px-3 py-2 text-sm font-medium text-cyan-300 hover:bg-cyan-500/20"
              >
                <Sparkles className="h-4 w-4" />
                알림 기반 분석 실행
              </button>
            )}
          </div>
        )}

        <EventFilterBar
          start={start}
          end={end}
          onRangeChange={(s, e) => {
            setRange({ start: s, end: e })
            setPage(1)
          }}
          keyword={keyword}
          onKeywordChange={(v) => {
            setKeyword(v)
            setPage(1)
          }}
          eventTypes={eventTypes}
          onEventTypesChange={(v) => {
            setEventTypes(v)
            setPage(1)
          }}
          agentId={agentId}
          onAgentChange={(v) => {
            setAgentId(v)
            setPage(1)
          }}
        />

        <div className={`min-h-0 flex-1 overflow-y-auto ${isLoading ? 'opacity-60' : ''}`}>
          <EventTable events={data?.items ?? []} isLoading={isLoading && !data} onSelect={setSelectedEvent} />
        </div>

        <Pagination page={page} pageSize={PAGE_SIZE} total={data?.total ?? 0} onPageChange={setPage} />
      </div>

      {selectedEvent && <EventContextDrawer eventId={selectedEvent.id} onClose={() => setSelectedEvent(null)} />}
    </div>
  )
}
