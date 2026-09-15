import type { Verdict } from '../lib/labels'

export interface AnalysisResult {
  analysis_id: string
  alert_id: string | null
  event_count: number
  summary: string
  mitre_techniques: string[]
  verdict: Verdict
  recommended_actions: string[]
  generated_by: string
  created_at: string
}
