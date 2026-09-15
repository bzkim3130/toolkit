import { useQuery } from '@tanstack/react-query'
import { Gauge } from 'lucide-react'
import { getQuota } from '../../api/virustotal'

export function QuotaBadge() {
  const { data, isError } = useQuery({ queryKey: ['vt-quota'], queryFn: getQuota, retry: false })

  if (isError) return null
  if (!data || data.daily_allowed == null) return null

  return (
    <div className="flex items-center gap-1.5 rounded-md border border-slate-800 px-2.5 py-1 text-xs text-slate-400">
      <Gauge className="h-3.5 w-3.5" />
      오늘 조회 {data.daily_used ?? 0} / {data.daily_allowed}
    </div>
  )
}
