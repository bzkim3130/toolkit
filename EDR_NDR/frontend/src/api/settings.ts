import { apiClient } from './client'
import type { ConnectionTarget, SettingsOut, SettingsUpdatePayload, TestConnectionResult } from '../types/settings'

export async function getSettings(): Promise<SettingsOut> {
  const { data } = await apiClient.get<SettingsOut>('/settings')
  return data
}

export async function updateSettings(payload: SettingsUpdatePayload): Promise<SettingsOut> {
  const { data } = await apiClient.put<SettingsOut>('/settings', payload)
  return data
}

export async function testConnection(target: ConnectionTarget): Promise<TestConnectionResult> {
  const { data } = await apiClient.post<TestConnectionResult>('/settings/test-connection', { target })
  return data
}
