import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { X, Search } from 'lucide-react'
import { getAlert, updateAlert } from '../../api/alerts'
import { SeverityBadge } from './SeverityBadge'
import { StatusPill } from './StatusPill'
import { formatDateTime } from '../../lib/format'
import { ALERT_STATUS_LABEL, AGENT_STATUS_LABEL, AGENT_STATUS_COLOR } from '../../lib/labels'
import { Badge } from '../common/Badge'
import type { AlertStatus } from '../../types/alert'

const STATUS_OPTIONS: AlertStatus[] = ['new', 'investigating', 'resolved', 'false_positive', 'closed']

export function AlertDetailDrawer({ alertId, onClose }: { alertId: string; onClose: () => void }) {
  const queryClient = useQueryClient()

  const { data: alert, isLoading } = useQuery({
    queryKey: ['alert', alertId],
    queryFn: () => getAlert(alertId),
  })

  const mutation = useMutation({
    mutationFn: (patch: Partial<{ status: AlertStatus; assignee: string }>) => updateAlert(alertId, patch),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alert', alertId] })
      queryClient.invalidateQueries({ queryKey: ['alerts'] })
      queryClient.invalidateQueries({ queryKey: ['alert-stats'] })
    },
  })

  return (
    <div className="flex h-full w-[420px] shrink-0 flex-col border-l border-slate-800 bg-slate-950">
      <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
        <h2 className="text-sm font-semibold text-slate-200">알림 상세</h2>
        <button onClick={onClose} className="rounded p-1 text-slate-500 hover:bg-slate-800 hover:text-slate-200">
          <X className="h-4 w-4" />
        </button>
      </div>

      {isLoading || !alert ? (
        <div className="p-6 text-sm text-slate-500">불러오는 중...</div>
      ) : (
        <div className="flex-1 overflow-y-auto p-4 text-sm">
          <div className="mb-3 flex items-center gap-2">
            <SeverityBadge severity={alert.severity} />
            <StatusPill status={alert.status} />
          </div>

          <h3 className="mb-1 text-base font-semibold text-slate-100">{alert.title}</h3>
          <p className="mb-3 text-slate-400">{alert.description}</p>

          <Link
            to={`/investigate?alertId=${alert.id}`}
            className="mb-4 flex items-center justify-center gap-1.5 rounded-md border border-cyan-600 bg-cyan-500/10 px-3 py-2 text-sm font-medium text-cyan-300 hover:bg-cyan-500/20"
          >
            <Search className="h-4 w-4" />
            사고 조사에서 열기 (±2시간 컨텍스트)
          </Link>

          <dl className="mb-4 grid grid-cols-2 gap-y-2 gap-x-3 rounded-md border border-slate-800 p-3">
            <Field label="소스" value={alert.source} />
            <Field label="MITRE ATT&CK" value={alert.mitre_technique ?? '—'} mono />
            <Field label="출발지 IP" value={alert.src_ip ?? '—'} mono />
            <Field label="목적지 IP" value={alert.dest_ip ?? '—'} mono />
            <Field label="발생 시각" value={formatDateTime(alert.created_at)} />
            <Field label="갱신 시각" value={formatDateTime(alert.updated_at)} />
          </dl>

          {alert.agent && (
            <div className="mb-4 rounded-md border border-slate-800 p-3">
              <div className="mb-1.5 text-xs font-medium text-slate-500">관련 에이전트</div>
              <div className="flex items-center justify-between">
                <span className="text-slate-200">{alert.agent.hostname}</span>
                <Badge className={AGENT_STATUS_COLOR[alert.agent.status]}>
                  {AGENT_STATUS_LABEL[alert.agent.status]}
                </Badge>
              </div>
              <div className="mt-0.5 font-mono text-xs text-slate-500">{alert.agent.ip_address}</div>
            </div>
          )}

          {alert.rule && (
            <div className="mb-4 rounded-md border border-slate-800 p-3">
              <div className="mb-1.5 text-xs font-medium text-slate-500">탐지 룰</div>
              <div className="text-slate-200">{alert.rule.name}</div>
              <div className="mt-0.5 text-xs text-slate-500">{alert.rule.rule_type}</div>
            </div>
          )}

          <div className="mb-4">
            <div className="mb-1.5 text-xs font-medium text-slate-500">담당자</div>
            <input
              defaultValue={alert.assignee ?? ''}
              placeholder="분석가 아이디 입력"
              onBlur={(e) => {
                const next = e.target.value.trim()
                if (next !== (alert.assignee ?? '')) mutation.mutate({ assignee: next })
              }}
              className="w-full rounded-md border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-slate-200 focus:border-cyan-500 focus:outline-none"
            />
          </div>

          <div>
            <div className="mb-1.5 text-xs font-medium text-slate-500">상태 변경</div>
            <div className="flex flex-wrap gap-1.5">
              {STATUS_OPTIONS.map((s) => (
                <button
                  key={s}
                  disabled={mutation.isPending}
                  onClick={() => mutation.mutate({ status: s })}
                  className={`rounded-full border px-2.5 py-1 text-xs font-medium transition-colors disabled:opacity-40 ${
                    alert.status === s
                      ? 'border-cyan-500 bg-cyan-500/15 text-cyan-300'
                      : 'border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-200'
                  }`}
                >
                  {ALERT_STATUS_LABEL[s]}
                </button>
              ))}
            </div>
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
