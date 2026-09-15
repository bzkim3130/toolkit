import { Badge } from '../common/Badge'
import { VERDICT_COLOR, VERDICT_LABEL } from '../../lib/labels'
import type { AnalysisResult } from '../../types/analysis'

export function AnalysisResultCard({ result }: { result: AnalysisResult }) {
  return (
    <div className="rounded-md border border-slate-800 bg-slate-900/40 p-3">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge className={VERDICT_COLOR[result.verdict]}>{VERDICT_LABEL[result.verdict]}</Badge>
          <span className="text-xs text-slate-500">이벤트 {result.event_count}건 분석</span>
        </div>
        <span className="text-[11px] text-slate-600">
          {result.generated_by === 'heuristic' ? '규칙 기반 분석' : 'AI 분석'}
        </span>
      </div>

      <pre className="mb-3 whitespace-pre-wrap font-sans text-sm leading-relaxed text-slate-300">{result.summary}</pre>

      {result.mitre_techniques.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-1.5">
          {result.mitre_techniques.map((t) => (
            <span key={t} className="rounded border border-slate-700 px-1.5 py-0.5 font-mono text-[11px] text-slate-400">
              {t}
            </span>
          ))}
        </div>
      )}

      <div>
        <div className="mb-1 text-xs font-medium text-slate-500">권장 조치</div>
        <ul className="list-inside list-disc space-y-0.5 text-sm text-slate-300">
          {result.recommended_actions.map((a, i) => (
            <li key={i}>{a}</li>
          ))}
        </ul>
      </div>
    </div>
  )
}
