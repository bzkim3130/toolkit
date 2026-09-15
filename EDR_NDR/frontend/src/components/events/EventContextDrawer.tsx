import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { X, Sparkles } from 'lucide-react'
import { getEventContext, analyzeByEventIds } from '../../api/events'
import { EVENT_TYPE_LABEL } from '../../lib/labels'
import { formatDateTime } from '../../lib/format'
import { AnalysisResultCard } from './AnalysisResultCard'
import type { EventOut } from '../../types/event'
import type { AnalysisResult } from '../../types/analysis'

const WINDOW_OPTIONS = [30, 60, 120, 240] as const

export function EventContextDrawer({ eventId, onClose }: { eventId: string; onClose: () => void }) {
  const [windowMinutes, setWindowMinutes] = useState<number>(120)
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null)

  const { data: ctx, isLoading } = useQuery({
    queryKey: ['event-context', eventId, windowMinutes],
    queryFn: () => getEventContext(eventId, windowMinutes),
  })

  const analyzeMutation = useMutation({
    mutationFn: () => {
      const ids = [...(ctx?.before ?? []).map((e) => e.id), ctx!.anchor_event.id, ...(ctx?.after ?? []).map((e) => e.id)]
      return analyzeByEventIds(ids)
    },
    onSuccess: (result) => setAnalysis(result),
  })

  return (
    <div className="flex h-full w-[460px] shrink-0 flex-col border-l border-slate-800 bg-slate-950">
      <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
        <h2 className="text-sm font-semibold text-slate-200">이벤트 컨텍스트</h2>
        <button onClick={onClose} className="rounded p-1 text-slate-500 hover:bg-slate-800 hover:text-slate-200">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex items-center gap-2 border-b border-slate-800 px-4 py-2.5">
        <span className="text-xs text-slate-500">앞뒤 범위</span>
        {WINDOW_OPTIONS.map((m) => (
          <button
            key={m}
            onClick={() => setWindowMinutes(m)}
            className={`rounded-full border px-2.5 py-1 text-xs font-medium ${
              windowMinutes === m
                ? 'border-cyan-500 bg-cyan-500/15 text-cyan-300'
                : 'border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-200'
            }`}
          >
            ±{m >= 60 ? `${m / 60}시간` : `${m}분`}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">
        {isLoading || !ctx ? (
          <div className="p-6 text-sm text-slate-500">불러오는 중...</div>
        ) : (
          <div className="p-4">
            <button
              onClick={() => analyzeMutation.mutate()}
              disabled={analyzeMutation.isPending}
              className="mb-4 flex w-full items-center justify-center gap-1.5 rounded-md border border-cyan-600 bg-cyan-500/10 px-3 py-2 text-sm font-medium text-cyan-300 hover:bg-cyan-500/20 disabled:opacity-50"
            >
              <Sparkles className="h-4 w-4" />
              {analyzeMutation.isPending ? '분석 중...' : '이 구간 분석 실행'}
            </button>

            {analysis && <div className="mb-4">
              <AnalysisResultCard result={analysis} />
            </div>}

            <ol className="space-y-2">
              {ctx.before.map((e) => (
                <TimelineRow key={e.id} event={e} />
              ))}
              <TimelineRow event={ctx.anchor_event} isAnchor />
              {ctx.after.map((e) => (
                <TimelineRow key={e.id} event={e} />
              ))}
            </ol>
          </div>
        )}
      </div>
    </div>
  )
}

function TimelineRow({ event, isAnchor }: { event: EventOut; isAnchor?: boolean }) {
  return (
    <li className={`rounded-md border p-2.5 text-sm ${isAnchor ? 'border-cyan-500 bg-cyan-500/10' : 'border-slate-800'}`}>
      <div className="mb-0.5 flex items-center justify-between text-xs">
        <span className="text-slate-500">{formatDateTime(event.timestamp)}</span>
        <span className={isAnchor ? 'font-medium text-cyan-300' : 'text-slate-500'}>
          {EVENT_TYPE_LABEL[event.event_type]}
          {isAnchor ? ' · 기준 이벤트' : ''}
        </span>
      </div>
      <div className="font-mono text-xs text-slate-300">{event.summary}</div>
    </li>
  )
}
