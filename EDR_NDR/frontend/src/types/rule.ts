import type { Severity } from './alert'

export type RuleType = 'signature' | 'threshold' | 'correlation'

export interface Rule {
  id: string
  name: string
  description: string
  rule_type: RuleType
  severity: Severity
  logic: string
  mitre_technique: string | null
  enabled: boolean
  hit_count: number
  created_by: string
  created_at: string
  updated_at: string
}

export interface RuleCreatePayload {
  name: string
  description: string
  rule_type: RuleType
  severity: Severity
  logic: string
  mitre_technique: string | null
  enabled: boolean
}

export type RuleUpdatePayload = Partial<RuleCreatePayload>

export interface RuleListParams {
  q?: string
  severity?: Severity
  rule_type?: RuleType
  enabled?: boolean
  page?: number
  page_size?: number
}

export interface RuleTestResult {
  matched_count: number
  method: string
  sample_matches: { id: string; timestamp: string; summary: string }[]
}
