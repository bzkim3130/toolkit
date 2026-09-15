export interface SettingsOut {
  llm_endpoint: string | null
  llm_model: string | null
  llm_api_key_masked: string | null
  edr_api_url: string | null
  edr_api_token_masked: string | null
  ndr_api_url: string | null
  ndr_api_token_masked: string | null
  virustotal_api_key_masked: string | null
  virustotal_key_source: 'settings' | 'env' | 'none'
}

export interface SettingsUpdatePayload {
  llm_endpoint?: string
  llm_model?: string
  llm_api_key?: string
  edr_api_url?: string
  edr_api_token?: string
  ndr_api_url?: string
  ndr_api_token?: string
  virustotal_api_key?: string
}

export type ConnectionTarget = 'llm' | 'edr' | 'ndr' | 'virustotal'

export interface TestConnectionResult {
  ok: boolean
  message: string
}
