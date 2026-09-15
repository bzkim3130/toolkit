import type { AlertStatus, Severity } from '../types/alert'
import type { AgentStatus } from '../types/agent'

export const SEVERITY_LABEL: Record<Severity, string> = {
  critical: '심각',
  high: '높음',
  medium: '중간',
  low: '낮음',
  info: '정보',
}

export const SEVERITY_COLOR: Record<Severity, string> = {
  critical: 'bg-red-500/15 text-red-400 border-red-500/30',
  high: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
  medium: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  low: 'bg-sky-500/15 text-sky-400 border-sky-500/30',
  info: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
}

export const ALERT_STATUS_LABEL: Record<AlertStatus, string> = {
  new: '신규',
  investigating: '조사중',
  resolved: '해결됨',
  false_positive: '오탐',
  closed: '종료',
}

export const ALERT_STATUS_COLOR: Record<AlertStatus, string> = {
  new: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
  investigating: 'bg-violet-500/15 text-violet-400 border-violet-500/30',
  resolved: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  false_positive: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
  closed: 'bg-slate-600/15 text-slate-500 border-slate-600/30',
}

export const AGENT_STATUS_LABEL: Record<AgentStatus, string> = {
  online: '온라인',
  offline: '오프라인',
  isolated: '격리됨',
}

export const AGENT_STATUS_COLOR: Record<AgentStatus, string> = {
  online: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  offline: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
  isolated: 'bg-red-500/15 text-red-400 border-red-500/30',
}

export type EventTypeValue =
  | 'process_create'
  | 'network_connection'
  | 'file_write'
  | 'registry_modify'
  | 'dns_query'
  | 'login'

export const EVENT_TYPE_LABEL: Record<EventTypeValue, string> = {
  process_create: '프로세스 생성',
  network_connection: '네트워크 연결',
  file_write: '파일 쓰기',
  registry_modify: '레지스트리 변경',
  dns_query: 'DNS 질의',
  login: '로그인',
}

export type Verdict = 'likely_malicious' | 'suspicious' | 'likely_benign'

export const VERDICT_LABEL: Record<Verdict, string> = {
  likely_malicious: '악성 가능성 높음',
  suspicious: '의심스러움',
  likely_benign: '정상 활동 가능성',
}

export const VERDICT_COLOR: Record<Verdict, string> = {
  likely_malicious: 'bg-red-500/15 text-red-400 border-red-500/30',
  suspicious: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
  likely_benign: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
}

// Hex equivalents of the Tailwind classes above, for chart fills (SVG can't take Tailwind class names).
export const SEVERITY_HEX: Record<Severity, string> = {
  critical: '#f87171', // red-400
  high: '#fb923c', // orange-400
  medium: '#fbbf24', // amber-400
  low: '#38bdf8', // sky-400
  info: '#94a3b8', // slate-400
}

export const AGENT_STATUS_HEX: Record<AgentStatus, string> = {
  online: '#34d399', // emerald-400
  offline: '#94a3b8', // slate-400
  isolated: '#f87171', // red-400
}

export const ACCENT_HEX = '#22d3ee' // cyan-400, this app's single accent color

export type RuleTypeValue = 'signature' | 'threshold' | 'correlation'

export const RULE_TYPE_LABEL: Record<RuleTypeValue, string> = {
  signature: '시그니처',
  threshold: '임계값',
  correlation: '상관분석',
}
