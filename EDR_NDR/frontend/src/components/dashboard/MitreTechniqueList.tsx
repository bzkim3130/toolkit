import { ACCENT_HEX } from '../../lib/labels'
import type { MitreCount } from '../../types/dashboard'

export function MitreTechniqueList({ techniques }: { techniques: MitreCount[] }) {
  const max = Math.max(1, ...techniques.map((t) => t.count))

  return (
    <div className="rounded-lg border border-slate-800 p-4">
      <h3 className="mb-3 text-sm font-semibold text-slate-200">상위 MITRE ATT&amp;CK 기법</h3>
      {techniques.length === 0 ? (
        <p className="text-sm text-slate-500">데이터가 없습니다.</p>
      ) : (
        <ul className="space-y-2.5">
          {techniques.map((t) => (
            <li key={t.technique} className="flex items-center gap-3">
              <span className="w-20 shrink-0 font-mono text-xs text-slate-400">{t.technique}</span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${(t.count / max) * 100}%`, backgroundColor: ACCENT_HEX }}
                />
              </div>
              <span className="w-8 shrink-0 text-right text-xs tabular-nums text-slate-300">{t.count}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
