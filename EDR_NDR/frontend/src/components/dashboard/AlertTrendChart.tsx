import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { ChartTooltip } from './ChartTooltip'
import { ACCENT_HEX } from '../../lib/labels'
import type { TrendPoint } from '../../types/dashboard'

function formatShortDate(iso: string): string {
  const [, m, d] = iso.split('-')
  return `${m}/${d}`
}

export function AlertTrendChart({ data }: { data: TrendPoint[] }) {
  const chartData = data.map((p) => ({ ...p, label: formatShortDate(p.date) }))

  return (
    <div className="rounded-lg border border-slate-800 p-4">
      <h3 className="mb-3 text-sm font-semibold text-slate-200">최근 7일 알림 추이</h3>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={chartData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
          <defs>
            <linearGradient id="alertTrendFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={ACCENT_HEX} stopOpacity={0.35} />
              <stop offset="100%" stopColor={ACCENT_HEX} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#262920" vertical={false} />
          <XAxis dataKey="label" tick={{ fill: '#7d8271', fontSize: 11 }} axisLine={{ stroke: '#262920' }} tickLine={false} />
          <YAxis tick={{ fill: '#7d8271', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} width={28} />
          <Tooltip content={<ChartTooltip />} cursor={{ stroke: '#3a3e32' }} />
          <Area
            type="monotone"
            dataKey="count"
            name="알림"
            stroke={ACCENT_HEX}
            strokeWidth={2}
            fill="url(#alertTrendFill)"
            dot={false}
            activeDot={{ r: 4, fill: ACCENT_HEX, stroke: '#0e100d', strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
