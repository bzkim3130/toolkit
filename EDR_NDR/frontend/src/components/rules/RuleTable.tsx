import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toggleRule } from '../../api/rules'
import { SeverityBadge } from '../alerts/SeverityBadge'
import { RULE_TYPE_LABEL } from '../../lib/labels'
import { formatRelative } from '../../lib/format'
import type { Rule } from '../../types/rule'

interface Props {
  rules: Rule[]
  isLoading: boolean
  onSelect: (id: string) => void
}

export function RuleTable({ rules, isLoading, onSelect }: Props) {
  const queryClient = useQueryClient()
  const toggleMutation = useMutation({
    mutationFn: toggleRule,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['rules'] }),
  })

  if (isLoading) {
    return <div className="p-8 text-center text-sm text-slate-500">불러오는 중...</div>
  }

  if (rules.length === 0) {
    return <div className="p-8 text-center text-sm text-slate-500">조건에 맞는 룰이 없습니다.</div>
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-slate-800 text-xs text-slate-500">
          <tr>
            <th className="px-4 py-2 font-medium">상태</th>
            <th className="px-4 py-2 font-medium">이름</th>
            <th className="px-4 py-2 font-medium">심각도</th>
            <th className="px-4 py-2 font-medium">유형</th>
            <th className="px-4 py-2 font-medium">MITRE</th>
            <th className="px-4 py-2 font-medium">누적 탐지</th>
            <th className="px-4 py-2 font-medium">수정</th>
          </tr>
        </thead>
        <tbody>
          {rules.map((rule) => (
            <tr key={rule.id} className="border-b border-slate-900 hover:bg-slate-900/60">
              <td className="px-4 py-2.5" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => toggleMutation.mutate(rule.id)}
                  disabled={toggleMutation.isPending}
                  className={`relative h-5 w-9 rounded-full transition-colors disabled:opacity-50 ${
                    rule.enabled ? 'bg-cyan-500' : 'bg-slate-700'
                  }`}
                  title={rule.enabled ? '활성 (클릭하여 비활성화)' : '비활성 (클릭하여 활성화)'}
                >
                  <span
                    className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${
                      rule.enabled ? 'translate-x-4' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </td>
              <td onClick={() => onSelect(rule.id)} className="max-w-sm cursor-pointer truncate px-4 py-2.5 text-slate-200">
                {rule.name}
              </td>
              <td onClick={() => onSelect(rule.id)} className="cursor-pointer px-4 py-2.5">
                <SeverityBadge severity={rule.severity} />
              </td>
              <td onClick={() => onSelect(rule.id)} className="cursor-pointer px-4 py-2.5 text-slate-400">
                {RULE_TYPE_LABEL[rule.rule_type]}
              </td>
              <td onClick={() => onSelect(rule.id)} className="cursor-pointer px-4 py-2.5 font-mono text-xs text-slate-500">
                {rule.mitre_technique ?? '—'}
              </td>
              <td onClick={() => onSelect(rule.id)} className="cursor-pointer px-4 py-2.5 text-slate-400">
                {rule.hit_count.toLocaleString()}
              </td>
              <td onClick={() => onSelect(rule.id)} className="cursor-pointer px-4 py-2.5 whitespace-nowrap text-slate-500">
                {formatRelative(rule.updated_at)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
