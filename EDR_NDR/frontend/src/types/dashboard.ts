export interface TrendPoint {
  date: string
  count: number
}

export interface MitreCount {
  technique: string
  count: number
}

export interface DashboardSummary {
  alerts_by_severity: Record<string, number>
  alerts_trend_7d: TrendPoint[]
  top_mitre_techniques: MitreCount[]
  agents_online: number
  agents_offline: number
  agents_isolated: number
  open_alerts: number
}
