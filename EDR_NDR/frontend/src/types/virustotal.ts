export interface VTFileResult {
  hash: string
  detection_ratio: string
  malicious_count: number
  total_engines: number
  malicious_vendors: string[]
  file_type: string | null
  meaningful_name: string | null
  first_seen: string | null
  cached: boolean
  checked_at: string
}

export interface VTIpResult {
  ip: string
  detection_ratio: string
  malicious_count: number
  total_engines: number
  malicious_vendors: string[]
  reputation: number | null
  country: string | null
  as_owner: string | null
  cached: boolean
  checked_at: string
}

export interface VTDomainResult {
  domain: string
  detection_ratio: string
  malicious_count: number
  total_engines: number
  malicious_vendors: string[]
  reputation: number | null
  categories: string[]
  creation_date: string | null
  cached: boolean
  checked_at: string
}

export interface VTUrlResult {
  url: string
  status: 'queued' | 'completed'
  detection_ratio: string | null
  malicious_count: number | null
  total_engines: number | null
  malicious_vendors: string[]
  cached: boolean
  checked_at: string
}

export interface VTQuota {
  hourly_used: number | null
  hourly_allowed: number | null
  daily_used: number | null
  daily_allowed: number | null
  monthly_used: number | null
  monthly_allowed: number | null
}
