import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { ChartTooltip } from './ChartTooltip'
import { SEVERITY_HEX, SEVERITY_LABEL } from '../../lib/labels'
import type { Severity } from '../../types/alert'

const ORDER: Severity[] = ['critical', 'high', 'medium', 'low', 'info']

export function SeverityBarChart({ bySeverity }: { bySeverity: Record<string, number> }) {
  const data = ORDER.map((sev) => ({ severity: sev, label: SEVERITY_LABEL[sev], count: bySeverity[sev] ?? 0 }))

  return (
    <div className="rounded-lg border border-slate-800 p-4">
      <h3 className="mb-3 text-sm font-semibold text-slate-200">심각도별 알림 분포</h3>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid stroke="#262920" vertical={false} />
          <XAxis dataKey="label" tick={{ fill: '#7d8271', fontSize: 11 }} axisLine={{ stroke: '#262920' }} tickLine={false} />
          <YAxis tick={{ fill: '#7d8271', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} width={28} />
          <Tooltip content={<ChartTooltip />} cursor={{ fill: '#262920' }} />
          <Bar dataKey="count" name="알림 수" radius={[4, 4, 0, 0]} maxBarSize={48}>
            {data.map((d) => (
              <Cell key={d.severity} fill={SEVERITY_HEX[d.severity]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
