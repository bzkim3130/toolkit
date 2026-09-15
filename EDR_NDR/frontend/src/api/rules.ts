import { apiClient } from './client'
import type { PagedResponse } from '../types/common'
import type { Rule, RuleCreatePayload, RuleListParams, RuleTestResult, RuleUpdatePayload } from '../types/rule'

export async function listRules(params: RuleListParams): Promise<PagedResponse<Rule>> {
  const { data } = await apiClient.get<PagedResponse<Rule>>('/rules', { params })
  return data
}

export async function getRule(id: string): Promise<Rule> {
  const { data } = await apiClient.get<Rule>(`/rules/${id}`)
  return data
}

export async function createRule(payload: RuleCreatePayload): Promise<Rule> {
  const { data } = await apiClient.post<Rule>('/rules', payload)
  return data
}

export async function updateRule(id: string, payload: RuleUpdatePayload): Promise<Rule> {
  const { data } = await apiClient.put<Rule>(`/rules/${id}`, payload)
  return data
}

export async function deleteRule(id: string): Promise<void> {
  await apiClient.delete(`/rules/${id}`)
}

export async function toggleRule(id: string): Promise<Rule> {
  const { data } = await apiClient.patch<Rule>(`/rules/${id}/toggle`)
  return data
}

export async function testRule(id: string): Promise<RuleTestResult> {
  const { data } = await apiClient.post<RuleTestResult>(`/rules/${id}/test`)
  return data
}
