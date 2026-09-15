import { useQuery } from '@tanstack/react-query'
import { Bell, ShieldOff, Wifi, WifiOff } from 'lucide-react'
import { getDashboardSummary } from '../api/dashboard'
import { StatTile } from '../components/dashboard/StatTile'
import { AlertTrendChart } from '../components/dashboard/AlertTrendChart'
import { SeverityBarChart } from '../components/dashboard/SeverityBarChart'
import { MitreTechniqueList } from '../components/dashboard/MitreTechniqueList'

export function DashboardPage() {
  const { data, isLoading } = useQuery({ queryKey: ['dashboard-summary'], queryFn: getDashboardSummary })

  return (
    <div className="h-full overflow-y-auto">
      <div className="border-b border-slate-800 px-6 py-4">
        <h1 className="text-lg font-semibold text-slate-100">대시보드</h1>
        <p className="text-sm text-slate-500">현재 보안 상태 요약입니다.</p>
      </div>

      <div className="px-6 py-5">
        <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatTile label="열린 알림" value={isLoading ? '—' : data!.open_alerts} accentClassName="text-cyan-400" icon={<Bell className="h-5 w-5" />} />
          <StatTile label="온라인 에이전트" value={isLoading ? '—' : data!.agents_online} accentClassName="text-emerald-400" icon={<Wifi className="h-5 w-5" />} />
          <StatTile label="오프라인 에이전트" value={isLoading ? '—' : data!.agents_offline} accentClassName="text-slate-400" icon={<WifiOff className="h-5 w-5" />} />
          <StatTile label="격리된 에이전트" value={isLoading ? '—' : data!.agents_isolated} accentClassName="text-red-400" icon={<ShieldOff className="h-5 w-5" />} />
        </div>

        {!isLoading && data && (
          <>
            <div className="mb-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
              <AlertTrendChart data={data.alerts_trend_7d} />
              <SeverityBarChart bySeverity={data.alerts_by_severity} />
            </div>
            <MitreTechniqueList techniques={data.top_mitre_techniques} />
          </>
        )}
      </div>
    </div>
  )
}
