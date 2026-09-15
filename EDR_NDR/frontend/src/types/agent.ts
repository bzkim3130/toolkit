export type AgentStatus = 'online' | 'offline' | 'isolated'

export interface AgentRef {
  id: string
  hostname: string
  ip_address: string
  status: AgentStatus
}

export interface Agent {
  id: string
  hostname: string
  ip_address: string
  os: string
  os_version: string
  status: AgentStatus
  agent_version: string
  last_seen: string
  group_tag: string
  risk_score: number
}

export interface AgentDetail extends Agent {
  open_alert_count: number
  total_alert_count: number
}

export interface AgentListParams {
  q?: string
  status?: AgentStatus
  page?: number
  page_size?: number
}
