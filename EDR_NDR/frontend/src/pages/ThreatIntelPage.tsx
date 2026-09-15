import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Search } from 'lucide-react'
import { lookupDomain, lookupFile, lookupIp, lookupUrl } from '../api/virustotal'
import { QuotaBadge } from '../components/vt/QuotaBadge'
import { FileResultCard } from '../components/vt/FileResultCard'
import { IpResultCard } from '../components/vt/IpResultCard'
import { DomainResultCard } from '../components/vt/DomainResultCard'
import { UrlResultCard } from '../components/vt/UrlResultCard'
import { getErrorMessage } from '../lib/apiError'
import type { VTDomainResult, VTFileResult, VTIpResult, VTUrlResult } from '../types/virustotal'

type Tab = 'file' | 'ip' | 'domain' | 'url'

const TABS: { key: Tab; label: string; placeholder: string }[] = [
  { key: 'file', label: '파일 해시', placeholder: 'MD5 / SHA1 / SHA256' },
  { key: 'ip', label: 'IP', placeholder: '8.8.8.8' },
  { key: 'domain', label: '도메인', placeholder: 'example.com' },
  { key: 'url', label: 'URL', placeholder: 'https://example.com/path' },
]

export function ThreatIntelPage() {
  const [tab, setTab] = useState<Tab>('file')
  const [value, setValue] = useState('')

  const mutation = useMutation({
    mutationFn: async () => {
      const input = value.trim()
      switch (tab) {
        case 'file':
          return { tab: 'file' as const, data: await lookupFile(input) }
        case 'ip':
          return { tab: 'ip' as const, data: await lookupIp(input) }
        case 'domain':
          return { tab: 'domain' as const, data: await lookupDomain(input) }
        case 'url':
          return { tab: 'url' as const, data: await lookupUrl(input) }
      }
    },
  })

  function switchTab(next: Tab) {
    setTab(next)
    setValue('')
    mutation.reset()
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
        <div>
          <h1 className="text-lg font-semibold text-slate-100">Threat Intel</h1>
          <p className="text-sm text-slate-500">파일 해시, IP, 도메인, URL을 VirusTotal로 조회합니다.</p>
        </div>
        <QuotaBadge />
      </div>

      <div className="border-b border-slate-800 px-6 pt-3">
        <div className="flex gap-1">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => switchTab(t.key)}
              className={`rounded-t-md border-b-2 px-3 py-2 text-sm font-medium ${
                tab === t.key ? 'border-cyan-500 text-cyan-300' : 'border-transparent text-slate-500 hover:text-slate-300'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-5">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (value.trim()) mutation.mutate()
          }}
          className="mb-5 flex gap-2"
        >
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={TABS.find((t) => t.key === tab)?.placeholder}
              className="input pl-9"
            />
          </div>
          <button
            type="submit"
            disabled={mutation.isPending || !value.trim()}
            className="rounded-md border border-cyan-600 bg-cyan-500/10 px-4 py-2 text-sm font-medium text-cyan-300 hover:bg-cyan-500/20 disabled:opacity-50"
          >
            {mutation.isPending ? '조회 중...' : '조회'}
          </button>
        </form>

        {mutation.isError && (
          <div className="mb-4 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
            {getErrorMessage(mutation.error)}
          </div>
        )}

        {mutation.data?.tab === 'file' && <FileResultCard result={mutation.data.data as VTFileResult} />}
        {mutation.data?.tab === 'ip' && <IpResultCard result={mutation.data.data as VTIpResult} />}
        {mutation.data?.tab === 'domain' && <DomainResultCard result={mutation.data.data as VTDomainResult} />}
        {mutation.data?.tab === 'url' && <UrlResultCard result={mutation.data.data as VTUrlResult} />}
      </div>
    </div>
  )
}
