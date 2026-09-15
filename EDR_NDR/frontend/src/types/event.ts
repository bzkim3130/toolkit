import type { AgentRef } from './agent'
import type { EventTypeValue } from '../lib/labels'

export interface EventOut {
  id: string
  timestamp: string
  agent_id: string
  agent: AgentRef | null
  event_type: EventTypeValue
  process_name: string | null
  command_line: string | null
  parent_process: string | null
  user: string | null
  src_ip: string | null
  dest_ip: string | null
  dest_port: number | null
  protocol: string | null
  file_hash: string | null
  file_path: string | null
  raw: string
  summary: string
}

export interface EventContextResponse {
  anchor_event: EventOut
  before: EventOut[]
  after: EventOut[]
}

export interface EventSearchParams {
  start_time: string
  end_time: string
  agent_id?: string
  event_type?: EventTypeValue[]
  keyword?: string
  page?: number
  page_size?: number
}
