import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { X, Search, ShieldOff, ShieldCheck } from 'lucide-react'
import { getAgent, getAgentEvents, isolateAgent, unisolateAgent } from '../../api/agents'
import { AgentStatusBadge } from './AgentStatusBadge'
import { RiskScore } from './RiskScore'
import { EVENT_TYPE_LABEL } from '../../lib/labels'
import { formatDateTime } from '../../lib/format'

export function AgentDetailDrawer({ agentId, onClose }: { agentId: string; onClose: () => void }) {
  const queryClient = useQueryClient()

  const { data: agent, isLoading } = useQuery({
    queryKey: ['agent', agentId],
    queryFn: () => getAgent(agentId),
  })

  const { data: events } = useQuery({
    queryKey: ['agent-events', agentId],
    queryFn: () => getAgentEvents(agentId, 1, 10),
  })

  const isolateMutation = useMutation({
    mutationFn: () => (agent?.status === 'isolated' ? unisolateAgent(agentId) : isolateAgent(agentId)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent', agentId] })
      queryClient.invalidateQueries({ queryKey: ['agents'] })
    },
  })

  return (
    <div className="flex h-full w-[420px] shrink-0 flex-col border-l border-slate-800 bg-slate-950">
      <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
        <h2 className="text-sm font-semibold text-slate-200">에이전트 상세</h2>
        <button onClick={onClose} className="rounded p-1 text-slate-500 hover:bg-slate-800 hover:text-slate-200">
          <X className="h-4 w-4" />
        </button>
      </div>

      {isLoading || !agent ? (
        <div className="p-6 text-sm text-slate-500">불러오는 중...</div>
      ) : (
        <div className="flex-1 overflow-y-auto p-4 text-sm">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-base font-semibold text-slate-100">{agent.hostname}</h3>
            <AgentStatusBadge status={agent.status} />
          </div>

          <dl className="mb-4 grid grid-cols-2 gap-y-2 gap-x-3 rounded-md border border-slate-800 p-3">
            <Field label="IP" value={agent.ip_address} mono />
            <Field label="그룹" value={agent.group_tag} />
            <Field label="OS" value={`${agent.os} ${agent.os_version}`} />
            <Field label="에이전트 버전" value={agent.agent_version} mono />
            <Field label="마지막 접속" value={formatDateTime(agent.last_seen)} />
            <div>
              <dt className="text-xs text-slate-500">위험도</dt>
              <dd className="mt-1">
                <RiskScore value={agent.risk_score} />
              </dd>
            </div>
          </dl>

          <div className="mb-4 grid grid-cols-2 gap-3">
            <div className="rounded-md border border-slate-800 p-3 text-center">
              <div className="text-xs text-slate-500">열린 알림</div>
              <div className="mt-1 text-lg font-semibold text-cyan-400">{agent.open_alert_count}</div>
            </div>
            <div className="rounded-md border border-slate-800 p-3 text-center">
              <div className="text-xs text-slate-500">전체 알림</div>
              <div className="mt-1 text-lg font-semibold text-slate-300">{agent.total_alert_count}</div>
            </div>
          </div>

          <button
            onClick={() => isolateMutation.mutate()}
            disabled={isolateMutation.isPending}
            className={`mb-2 flex w-full items-center justify-center gap-1.5 rounded-md border px-3 py-2 text-sm font-medium disabled:opacity-50 ${
              agent.status === 'isolated'
                ? 'border-emerald-600 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20'
                : 'border-red-600 bg-red-500/10 text-red-300 hover:bg-red-500/20'
            }`}
          >
            {agent.status === 'isolated' ? <ShieldCheck className="h-4 w-4" /> : <ShieldOff className="h-4 w-4" />}
            {isolateMutation.isPending
              ? '처리 중...'
              : agent.status === 'isolated'
                ? '격리 해제'
                : '네트워크 격리'}
          </button>

          <Link
            to={`/investigate?agentId=${agent.id}`}
            className="mb-4 flex items-center justify-center gap-1.5 rounded-md border border-slate-700 px-3 py-2 text-sm font-medium text-slate-300 hover:bg-slate-900"
          >
            <Search className="h-4 w-4" />
            사고 조사에서 이 에이전트 이벤트 보기
          </Link>

          <div>
            <div className="mb-1.5 text-xs font-medium text-slate-500">최근 이벤트</div>
            <ol className="space-y-1.5">
              {events?.items.map((e) => (
                <li key={e.id} className="rounded-md border border-slate-800 p-2 text-xs">
                  <div className="mb-0.5 flex items-center justify-between text-slate-500">
                    <span>{formatDateTime(e.timestamp)}</span>
                    <span>{EVENT_TYPE_LABEL[e.event_type]}</span>
                  </div>
                  <div className="truncate font-mono text-slate-300">{e.summary}</div>
                </li>
              ))}
              {events && events.items.length === 0 && <li className="text-slate-600">이벤트 없음</li>}
            </ol>
          </div>
        </div>
      )}
    </div>
  )
}

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd className={`text-slate-200 ${mono ? 'font-mono text-xs' : ''}`}>{value}</dd>
    </div>
  )
}
