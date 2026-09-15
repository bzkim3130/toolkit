import { useEffect, useState, type ReactNode } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getSettings, updateSettings } from '../api/settings'
import { SecretField } from '../components/settings/SecretField'
import { TestConnectionButton } from '../components/settings/TestConnectionButton'
import type { SettingsUpdatePayload } from '../types/settings'

function Section({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <section className="mb-6 rounded-lg border border-slate-800 p-4">
      <h2 className="text-sm font-semibold text-slate-100">{title}</h2>
      <p className="mb-4 text-xs text-slate-500">{description}</p>
      <div className="space-y-3">{children}</div>
    </section>
  )
}

function TextField({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-slate-500">{label}</label>
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="input" />
    </div>
  )
}

export function SettingsPage() {
  const queryClient = useQueryClient()
  const { data } = useQuery({ queryKey: ['settings'], queryFn: getSettings })

  const [llmEndpoint, setLlmEndpoint] = useState('')
  const [llmModel, setLlmModel] = useState('')
  const [llmKey, setLlmKey] = useState('')

  const [edrUrl, setEdrUrl] = useState('')
  const [edrToken, setEdrToken] = useState('')

  const [ndrUrl, setNdrUrl] = useState('')
  const [ndrToken, setNdrToken] = useState('')

  const [vtKey, setVtKey] = useState('')

  useEffect(() => {
    if (!data) return
    setLlmEndpoint(data.llm_endpoint ?? '')
    setLlmModel(data.llm_model ?? '')
    setEdrUrl(data.edr_api_url ?? '')
    setNdrUrl(data.ndr_api_url ?? '')
  }, [data])

  const saveMutation = useMutation({
    mutationFn: (payload: SettingsUpdatePayload) => updateSettings(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['settings'] }),
  })

  function saveLlm() {
    saveMutation.mutate({ llm_endpoint: llmEndpoint, llm_model: llmModel, ...(llmKey ? { llm_api_key: llmKey } : {}) })
    setLlmKey('')
  }
  function saveEdr() {
    saveMutation.mutate({ edr_api_url: edrUrl, ...(edrToken ? { edr_api_token: edrToken } : {}) })
    setEdrToken('')
  }
  function saveNdr() {
    saveMutation.mutate({ ndr_api_url: ndrUrl, ...(ndrToken ? { ndr_api_token: ndrToken } : {}) })
    setNdrToken('')
  }
  function saveVt() {
    if (!vtKey) return
    saveMutation.mutate({ virustotal_api_key: vtKey })
    setVtKey('')
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="border-b border-slate-800 px-6 py-4">
        <h1 className="text-lg font-semibold text-slate-100">설정</h1>
        <p className="text-sm text-slate-500">
          외부 연동 정보를 등록합니다. 비밀 값은 저장 시 Windows DPAPI로 암호화되어 이 PC의 현재 사용자 계정에만 묶여 로컬에 저장되며, 프론트엔드에는 항상 마스킹된 형태로만 노출됩니다.
        </p>
      </div>

      <div className="mx-auto max-w-2xl px-6 py-5">
        <Section title="LLM" description="사고 분석(Event Search) 결과 생성에 사용할 LLM 엔드포인트입니다. 미설정 시 규칙 기반 분석으로 자동 대체됩니다.">
          <TextField label="Endpoint URL" value={llmEndpoint} onChange={setLlmEndpoint} placeholder="https://api.example.com/v1/chat/completions" />
          <TextField label="모델명" value={llmModel} onChange={setLlmModel} placeholder="gpt-4o-mini" />
          <SecretField label="API 키" masked={data?.llm_api_key_masked ?? null} value={llmKey} onChange={setLlmKey} />
          <div className="flex items-center justify-between pt-1">
            <TestConnectionButton target="llm" />
            <button onClick={saveLlm} disabled={saveMutation.isPending} className="rounded-md border border-cyan-600 bg-cyan-500/10 px-3 py-1.5 text-xs font-medium text-cyan-300 hover:bg-cyan-500/20 disabled:opacity-50">
              저장
            </button>
          </div>
        </Section>

        <Section title="EDR API" description="EDR 콘솔 API 정보입니다 (이 대시보드는 실제 EDR과 연동하지 않으며, 저장/연결 테스트만 지원합니다).">
          <TextField label="API URL" value={edrUrl} onChange={setEdrUrl} placeholder="https://edr.example.com/api" />
          <SecretField label="API 토큰" masked={data?.edr_api_token_masked ?? null} value={edrToken} onChange={setEdrToken} />
          <div className="flex items-center justify-between pt-1">
            <TestConnectionButton target="edr" />
            <button onClick={saveEdr} disabled={saveMutation.isPending} className="rounded-md border border-cyan-600 bg-cyan-500/10 px-3 py-1.5 text-xs font-medium text-cyan-300 hover:bg-cyan-500/20 disabled:opacity-50">
              저장
            </button>
          </div>
        </Section>

        <Section title="NDR API" description="NDR 콘솔 API 정보입니다 (이 대시보드는 실제 NDR과 연동하지 않으며, 저장/연결 테스트만 지원합니다).">
          <TextField label="API URL" value={ndrUrl} onChange={setNdrUrl} placeholder="https://ndr.example.com/api" />
          <SecretField label="API 토큰" masked={data?.ndr_api_token_masked ?? null} value={ndrToken} onChange={setNdrToken} />
          <div className="flex items-center justify-between pt-1">
            <TestConnectionButton target="ndr" />
            <button onClick={saveNdr} disabled={saveMutation.isPending} className="rounded-md border border-cyan-600 bg-cyan-500/10 px-3 py-1.5 text-xs font-medium text-cyan-300 hover:bg-cyan-500/20 disabled:opacity-50">
              저장
            </button>
          </div>
        </Section>

        <Section title="VirusTotal" description="Threat Intel 페이지에서 사용하는 실제 VirusTotal API 키입니다.">
          <SecretField label="API 키" masked={data?.virustotal_api_key_masked ?? null} value={vtKey} onChange={setVtKey} />
          {data?.virustotal_key_source === 'env' && (
            <p className="text-[11px] text-amber-400">현재 서버 .env 파일의 키를 기본값으로 사용 중입니다. 여기서 저장하면 암호화된 값이 우선 적용됩니다.</p>
          )}
          <div className="flex items-center justify-between pt-1">
            <TestConnectionButton target="virustotal" />
            <button onClick={saveVt} disabled={saveMutation.isPending || !vtKey} className="rounded-md border border-cyan-600 bg-cyan-500/10 px-3 py-1.5 text-xs font-medium text-cyan-300 hover:bg-cyan-500/20 disabled:opacity-50">
              저장
            </button>
          </div>
        </Section>
      </div>
    </div>
  )
}
