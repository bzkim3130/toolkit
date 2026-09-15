import { SeverityBadge } from './SeverityBadge'
import { StatusPill } from './StatusPill'
import { formatRelative } from '../../lib/format'
import type { AlertSummary } from '../../types/alert'

interface Props {
  alerts: AlertSummary[]
  isLoading: boolean
  selectedId: string | null
  onSelect: (id: string) => void
}

export function AlertTable({ alerts, isLoading, selectedId, onSelect }: Props) {
  if (isLoading) {
    return <div className="p-8 text-center text-sm text-slate-500">불러오는 중...</div>
  }

  if (alerts.length === 0) {
    return <div className="p-8 text-center text-sm text-slate-500">조건에 맞는 알림이 없습니다.</div>
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-slate-800 text-xs text-slate-500">
          <tr>
            <th className="px-4 py-2 font-medium">심각도</th>
            <th className="px-4 py-2 font-medium">제목</th>
            <th className="px-4 py-2 font-medium">소스</th>
            <th className="px-4 py-2 font-medium">에이전트</th>
            <th className="px-4 py-2 font-medium">MITRE</th>
            <th className="px-4 py-2 font-medium">상태</th>
            <th className="px-4 py-2 font-medium">담당자</th>
            <th className="px-4 py-2 font-medium">발생</th>
          </tr>
        </thead>
        <tbody>
          {alerts.map((alert) => (
            <tr
              key={alert.id}
              onClick={() => onSelect(alert.id)}
              className={`cursor-pointer border-b border-slate-900 hover:bg-slate-900/60 ${
                selectedId === alert.id ? 'bg-slate-900' : ''
              }`}
            >
              <td className="px-4 py-2.5">
                <SeverityBadge severity={alert.severity} />
              </td>
              <td className="max-w-xs truncate px-4 py-2.5 text-slate-200">{alert.title}</td>
              <td className="px-4 py-2.5 text-slate-400">{alert.source}</td>
              <td className="px-4 py-2.5 text-slate-400">{alert.agent?.hostname ?? '—'}</td>
              <td className="px-4 py-2.5 font-mono text-xs text-slate-500">{alert.mitre_technique ?? '—'}</td>
              <td className="px-4 py-2.5">
                <StatusPill status={alert.status} />
              </td>
              <td className="px-4 py-2.5 text-slate-400">{alert.assignee ?? '미지정'}</td>
              <td className="px-4 py-2.5 whitespace-nowrap text-slate-500">{formatRelative(alert.created_at)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
