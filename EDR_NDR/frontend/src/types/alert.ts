import type { AgentRef } from './agent'

export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info'
export type AlertStatus = 'new' | 'investigating' | 'resolved' | 'false_positive' | 'closed'
export type AlertSource = 'EDR' | 'NDR'

export interface AlertSummary {
  id: string
  title: string
  severity: Severity
  status: AlertStatus
  source: AlertSource
  agent: AgentRef | null
  src_ip: string | null
  dest_ip: string | null
  mitre_technique: string | null
  assignee: string | null
  created_at: string
  updated_at: string
}

export interface AlertDetail extends AlertSummary {
  description: string
  detection_rule_id: string | null
  rule: { id: string; name: string; rule_type: string; severity: Severity } | null
}

export interface AlertStatsSummary {
  by_severity: Record<string, number>
  by_status: Record<string, number>
  total_open: number
}

export interface AlertListParams {
  q?: string
  severity?: Severity[]
  status?: AlertStatus[]
  source?: AlertSource
  agent_id?: string
  sort?: string
  page?: number
  page_size?: number
}

export interface AlertUpdatePayload {
  status?: AlertStatus
  severity?: Severity
  assignee?: string
}
