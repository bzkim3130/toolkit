import { useEffect, useState, type ReactNode } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { X, FlaskConical, Trash2 } from 'lucide-react'
import { createRule, deleteRule, getRule, testRule, updateRule } from '../../api/rules'
import { RULE_TYPE_LABEL, SEVERITY_LABEL, type RuleTypeValue } from '../../lib/labels'
import { formatDateTime } from '../../lib/format'
import type { Severity } from '../../types/alert'
import type { RuleCreatePayload, RuleTestResult } from '../../types/rule'

const ALL_SEVERITIES: Severity[] = ['critical', 'high', 'medium', 'low', 'info']
const ALL_TYPES: RuleTypeValue[] = ['signature', 'threshold', 'correlation']

const EMPTY_FORM: RuleCreatePayload = {
  name: '',
  description: '',
  rule_type: 'signature',
  severity: 'medium',
  logic: '',
  mitre_technique: '',
  enabled: true,
}

interface Props {
  ruleId: string | null // null = create mode
  onClose: () => void
}

export function RuleFormDrawer({ ruleId, onClose }: Props) {
  const queryClient = useQueryClient()
  const isEditing = ruleId !== null

  const { data: existing } = useQuery({
    queryKey: ['rule', ruleId],
    queryFn: () => getRule(ruleId!),
    enabled: isEditing,
  })

  const [form, setForm] = useState<RuleCreatePayload>(EMPTY_FORM)
  const [testResult, setTestResult] = useState<RuleTestResult | null>(null)

  useEffect(() => {
    if (existing) {
      setForm({
        name: existing.name,
        description: existing.description,
        rule_type: existing.rule_type,
        severity: existing.severity,
        logic: existing.logic,
        mitre_technique: existing.mitre_technique ?? '',
        enabled: existing.enabled,
      })
    }
  }, [existing])

  function patch(p: Partial<RuleCreatePayload>) {
    setForm((f) => ({ ...f, ...p }))
  }

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload = { ...form, mitre_technique: form.mitre_technique || null }
      return isEditing ? updateRule(ruleId!, payload) : createRule(payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rules'] })
      onClose()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => deleteRule(ruleId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rules'] })
      onClose()
    },
  })

  const testMutation = useMutation({
    mutationFn: () => testRule(ruleId!),
    onSuccess: setTestResult,
  })

  return (
    <div className="flex h-full w-[460px] shrink-0 flex-col border-l border-slate-800 bg-slate-950">
      <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
        <h2 className="text-sm font-semibold text-slate-200">{isEditing ? '룰 수정' : '새 룰 만들기'}</h2>
        <button onClick={onClose} className="rounded p-1 text-slate-500 hover:bg-slate-800 hover:text-slate-200">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 text-sm">
        <Field label="이름">
          <input
            value={form.name}
            onChange={(e) => patch({ name: e.target.value })}
            className="input"
            placeholder="예: 인코딩된 PowerShell 명령 실행 탐지"
          />
        </Field>

        <Field label="설명">
          <textarea
            value={form.description}
            onChange={(e) => patch({ description: e.target.value })}
            rows={2}
            className="input resize-none"
          />
        </Field>

        <div className="mb-3 grid grid-cols-2 gap-3">
          <Field label="유형">
            <select value={form.rule_type} onChange={(e) => patch({ rule_type: e.target.value as RuleTypeValue })} className="input">
              {ALL_TYPES.map((t) => (
                <option key={t} value={t}>
                  {RULE_TYPE_LABEL[t]}
                </option>
              ))}
            </select>
          </Field>
          <Field label="심각도">
            <select value={form.severity} onChange={(e) => patch({ severity: e.target.value as Severity })} className="input">
              {ALL_SEVERITIES.map((s) => (
                <option key={s} value={s}>
                  {SEVERITY_LABEL[s]}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <Field label="MITRE ATT&CK 기법 (선택)">
          <input
            value={form.mitre_technique ?? ''}
            onChange={(e) => patch({ mitre_technique: e.target.value })}
            placeholder="예: T1059.001"
            className="input font-mono"
          />
        </Field>

        <Field label="탐지 로직">
          <textarea
            value={form.logic}
            onChange={(e) => patch({ logic: e.target.value })}
            rows={4}
            placeholder="예: process_name == 'powershell.exe' AND command_line CONTAINS '-enc'"
            className="input resize-none font-mono text-xs"
          />
        </Field>

        <label className="mb-4 flex items-center gap-2 text-slate-300">
          <input type="checkbox" checked={form.enabled} onChange={(e) => patch({ enabled: e.target.checked })} />
          활성화
        </label>

        <div className="mb-4 flex gap-2">
          <button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending || !form.name || !form.logic}
            className="flex-1 rounded-md border border-cyan-600 bg-cyan-500/10 px-3 py-2 font-medium text-cyan-300 hover:bg-cyan-500/20 disabled:opacity-50"
          >
            {saveMutation.isPending ? '저장 중...' : '저장'}
          </button>
          {isEditing && (
            <button
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending}
              className="flex items-center gap-1.5 rounded-md border border-red-700 px-3 py-2 font-medium text-red-400 hover:bg-red-500/10 disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4" />
              삭제
            </button>
          )}
        </div>

        {isEditing && (
          <div className="border-t border-slate-800 pt-4">
            <button
              onClick={() => testMutation.mutate()}
              disabled={testMutation.isPending}
              className="mb-3 flex w-full items-center justify-center gap-1.5 rounded-md border border-slate-700 px-3 py-2 font-medium text-slate-300 hover:bg-slate-900 disabled:opacity-50"
            >
              <FlaskConical className="h-4 w-4" />
              {testMutation.isPending ? '실행 중...' : '테스트 실행'}
            </button>

            {testResult && (
              <div className="rounded-md border border-slate-800 p-3">
                <div className="mb-2 flex items-center justify-between text-xs">
                  <span className="text-slate-300">
                    매칭 <span className="font-semibold text-cyan-400">{testResult.matched_count}</span>건
                  </span>
                  <span className="text-slate-600">
                    {testResult.method === 'heuristic'
                      ? '규칙 매칭'
                      : testResult.method === 'literal_match'
                        ? '로직 내 문자열 매칭'
                        : '매칭 방식 없음'}
                  </span>
                </div>
                <ol className="space-y-1.5">
                  {testResult.sample_matches.map((m) => (
                    <li key={m.id} className="rounded border border-slate-800 p-2 text-xs">
                      <div className="mb-0.5 text-slate-500">{formatDateTime(m.timestamp)}</div>
                      <div className="truncate font-mono text-slate-300">{m.summary}</div>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="mb-3">
      <label className="mb-1 block text-xs font-medium text-slate-500">{label}</label>
      {children}
    </div>
  )
}
