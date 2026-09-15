export function DetectionRatio({ malicious, total }: { malicious: number; total: number }) {
  const ratio = total > 0 ? malicious / total : 0
  const color =
    malicious === 0 ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10'
    : ratio >= 0.2 ? 'text-red-400 border-red-500/30 bg-red-500/10'
    : 'text-amber-400 border-amber-500/30 bg-amber-500/10'

  return (
    <div className={`inline-flex items-center gap-2 rounded-md border px-3 py-1.5 ${color}`}>
      <span className="text-xl font-bold tabular-nums">{malicious}</span>
      <span className="text-sm text-slate-500">/ {total} 엔진 탐지</span>
    </div>
  )
}
