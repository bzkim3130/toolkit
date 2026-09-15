import { AgentStatusBadge } from './AgentStatusBadge'
import { RiskScore } from './RiskScore'
import { formatRelative } from '../../lib/format'
import type { Agent } from '../../types/agent'

interface Props {
  agents: Agent[]
  isLoading: boolean
  selectedId: string | null
  onSelect: (id: string) => void
}

export function AgentTable({ agents, isLoading, selectedId, onSelect }: Props) {
  if (isLoading) {
    return <div className="p-8 text-center text-sm text-slate-500">불러오는 중...</div>
  }

  if (agents.length === 0) {
    return <div className="p-8 text-center text-sm text-slate-500">조건에 맞는 에이전트가 없습니다.</div>
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-slate-800 text-xs text-slate-500">
          <tr>
            <th className="px-4 py-2 font-medium">호스트명</th>
            <th className="px-4 py-2 font-medium">상태</th>
            <th className="px-4 py-2 font-medium">OS</th>
            <th className="px-4 py-2 font-medium">그룹</th>
            <th className="px-4 py-2 font-medium">IP</th>
            <th className="px-4 py-2 font-medium">위험도</th>
            <th className="px-4 py-2 font-medium">마지막 접속</th>
          </tr>
        </thead>
        <tbody>
          {agents.map((agent) => (
            <tr
              key={agent.id}
              onClick={() => onSelect(agent.id)}
              className={`cursor-pointer border-b border-slate-900 hover:bg-slate-900/60 ${
                selectedId === agent.id ? 'bg-slate-900' : ''
              }`}
            >
              <td className="px-4 py-2.5 font-medium text-slate-200">{agent.hostname}</td>
              <td className="px-4 py-2.5">
                <AgentStatusBadge status={agent.status} />
              </td>
              <td className="px-4 py-2.5 text-slate-400">
                {agent.os} <span className="text-slate-600">{agent.os_version}</span>
              </td>
              <td className="px-4 py-2.5 text-slate-400">{agent.group_tag}</td>
              <td className="px-4 py-2.5 font-mono text-xs text-slate-500">{agent.ip_address}</td>
              <td className="px-4 py-2.5">
                <RiskScore value={agent.risk_score} />
              </td>
              <td className="px-4 py-2.5 whitespace-nowrap text-slate-500">{formatRelative(agent.last_seen)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
