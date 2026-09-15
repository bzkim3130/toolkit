import { DetectionRatio } from './DetectionRatio'
import { VendorChips } from './VendorChips'
import { formatDateTime } from '../../lib/format'
import type { VTDomainResult } from '../../types/virustotal'

export function DomainResultCard({ result }: { result: VTDomainResult }) {
  return (
    <div className="rounded-md border border-slate-800 p-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="font-mono text-sm text-slate-200">{result.domain}</div>
        {result.cached && <span className="shrink-0 rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-500">캐시됨</span>}
      </div>

      <DetectionRatio malicious={result.malicious_count} total={result.total_engines} />

      <dl className="my-3 grid grid-cols-2 gap-y-1.5 text-sm">
        <dt className="text-slate-500">등록일</dt>
        <dd className="text-slate-300">{result.creation_date ? formatDateTime(result.creation_date) : '—'}</dd>
        <dt className="text-slate-500">평판 점수</dt>
        <dd className="text-slate-300">{result.reputation ?? '—'}</dd>
      </dl>

      {result.categories.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-1.5">
          {result.categories.map((c) => (
            <span key={c} className="rounded border border-slate-700 px-1.5 py-0.5 text-xs text-slate-400">
              {c}
            </span>
          ))}
        </div>
      )}

      <div>
        <div className="mb-1.5 text-xs font-medium text-slate-500">탐지한 보안 엔진</div>
        <VendorChips vendors={result.malicious_vendors} />
      </div>
    </div>
  )
}
