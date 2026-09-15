import { DetectionRatio } from './DetectionRatio'
import { VendorChips } from './VendorChips'
import type { VTUrlResult } from '../../types/virustotal'

export function UrlResultCard({ result }: { result: VTUrlResult }) {
  return (
    <div className="rounded-md border border-slate-800 p-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="truncate font-mono text-sm text-slate-200">{result.url}</div>
        {result.cached && <span className="shrink-0 rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-500">캐시됨</span>}
      </div>

      {result.status === 'queued' || result.total_engines == null ? (
        <p className="text-sm text-amber-400">분석 대기열에 제출되었습니다. 잠시 후 다시 조회해 주세요.</p>
      ) : (
        <>
          <DetectionRatio malicious={result.malicious_count ?? 0} total={result.total_engines} />
          <div className="mt-3">
            <div className="mb-1.5 text-xs font-medium text-slate-500">탐지한 보안 엔진</div>
            <VendorChips vendors={result.malicious_vendors} />
          </div>
        </>
      )}
    </div>
  )
}
