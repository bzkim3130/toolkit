import { apiClient } from './client'
import type { Agent, AgentDetail, AgentListParams, AgentRef } from '../types/agent'
import type { EventOut } from '../types/event'
import type { PagedResponse } from '../types/common'

export async function listAgentsLite(): Promise<PagedResponse<AgentRef>> {
  const { data } = await apiClient.get<PagedResponse<AgentRef>>('/agents', { params: { page_size: 200 } })
  return data
}

export async function listAgents(params: AgentListParams): Promise<PagedResponse<Agent>> {
  const { data } = await apiClient.get<PagedResponse<Agent>>('/agents', { params })
  return data
}

export async function getAgent(id: string): Promise<AgentDetail> {
  const { data } = await apiClient.get<AgentDetail>(`/agents/${id}`)
  return data
}

export async function getAgentEvents(id: string, page = 1, pageSize = 20): Promise<PagedResponse<EventOut>> {
  const { data } = await apiClient.get<PagedResponse<EventOut>>(`/agents/${id}/events`, {
    params: { page, page_size: pageSize },
  })
  return data
}

export async function isolateAgent(id: string): Promise<Agent> {
  const { data } = await apiClient.post<Agent>(`/agents/${id}/isolate`)
  return data
}

export async function unisolateAgent(id: string): Promise<Agent> {
  const { data } = await apiClient.post<Agent>(`/agents/${id}/unisolate`)
  return data
}
