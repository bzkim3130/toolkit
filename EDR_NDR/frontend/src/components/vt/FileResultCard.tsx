import { DetectionRatio } from './DetectionRatio'
import { VendorChips } from './VendorChips'
import { formatDateTime } from '../../lib/format'
import type { VTFileResult } from '../../types/virustotal'

export function FileResultCard({ result }: { result: VTFileResult }) {
  return (
    <div className="rounded-md border border-slate-800 p-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate font-mono text-sm text-slate-200">{result.hash}</div>
          {result.meaningful_name && <div className="text-xs text-slate-500">{result.meaningful_name}</div>}
        </div>
        {result.cached && <span className="shrink-0 rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-500">캐시됨</span>}
      </div>

      <DetectionRatio malicious={result.malicious_count} total={result.total_engines} />

      <dl className="my-3 grid grid-cols-2 gap-y-1.5 text-sm">
        <dt className="text-slate-500">파일 유형</dt>
        <dd className="text-slate-300">{result.file_type ?? '—'}</dd>
        <dt className="text-slate-500">최초 발견</dt>
        <dd className="text-slate-300">{result.first_seen ? formatDateTime(result.first_seen) : '—'}</dd>
      </dl>

      <div>
        <div className="mb-1.5 text-xs font-medium text-slate-500">탐지한 보안 엔진</div>
        <VendorChips vendors={result.malicious_vendors} />
      </div>
    </div>
  )
}
