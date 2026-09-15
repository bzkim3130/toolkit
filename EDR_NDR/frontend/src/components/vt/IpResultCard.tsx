import { DetectionRatio } from './DetectionRatio'
import { VendorChips } from './VendorChips'
import type { VTIpResult } from '../../types/virustotal'

export function IpResultCard({ result }: { result: VTIpResult }) {
  return (
    <div className="rounded-md border border-slate-800 p-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="font-mono text-sm text-slate-200">{result.ip}</div>
        {result.cached && <span className="shrink-0 rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-500">캐시됨</span>}
      </div>

      <DetectionRatio malicious={result.malicious_count} total={result.total_engines} />

      <dl className="my-3 grid grid-cols-2 gap-y-1.5 text-sm">
        <dt className="text-slate-500">국가</dt>
        <dd className="text-slate-300">{result.country ?? '—'}</dd>
        <dt className="text-slate-500">AS 소유자</dt>
        <dd className="text-slate-300">{result.as_owner ?? '—'}</dd>
        <dt className="text-slate-500">평판 점수</dt>
        <dd className="text-slate-300">{result.reputation ?? '—'}</dd>
      </dl>

      <div>
        <div className="mb-1.5 text-xs font-medium text-slate-500">탐지한 보안 엔진</div>
        <VendorChips vendors={result.malicious_vendors} />
      </div>
    </div>
  )
}
