import { useQuery } from '@tanstack/react-query'
import { getAlertStats } from '../../api/alerts'
import { SEVERITY_LABEL } from '../../lib/labels'
import type { Severity } from '../../types/alert'

const SEVERITY_ORDER: Severity[] = ['critical', 'high', 'medium', 'low', 'info']

const CARD_ACCENT: Record<Severity, string> = {
  critical: 'text-red-400',
  high: 'text-orange-400',
  medium: 'text-amber-400',
  low: 'text-sky-400',
  info: 'text-slate-400',
}

export function AlertStatsCards() {
  const { data } = useQuery({ queryKey: ['alert-stats'], queryFn: getAlertStats })

  return (
    <div className="grid grid-cols-3 gap-3 p-4 sm:grid-cols-6">
      <StatCard label="열린 알림" value={data?.total_open} className="text-cyan-400" />
      {SEVERITY_ORDER.map((sev) => (
        <StatCard key={sev} label={SEVERITY_LABEL[sev]} value={data?.by_severity[sev]} className={CARD_ACCENT[sev]} />
      ))}
    </div>
  )
}

function StatCard({ label, value, className }: { label: string; value: number | undefined; className: string }) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-3">
      <div className="text-xs text-slate-500">{label}</div>
      <div className={`mt-1 text-xl font-semibold tabular-nums ${className}`}>{value ?? '—'}</div>
    </div>
  )
}
