import { apiClient } from './client'
import type { EventContextResponse, EventOut, EventSearchParams } from '../types/event'
import type { AnalysisResult } from '../types/analysis'
import type { PagedResponse } from '../types/common'

export async function searchEvents(params: EventSearchParams): Promise<PagedResponse<EventOut>> {
  const { data } = await apiClient.get<PagedResponse<EventOut>>('/events/search', {
    params: {
      ...params,
      event_type: params.event_type?.length ? params.event_type.join(',') : undefined,
    },
  })
  return data
}

export async function getEventContext(eventId: string, windowMinutes: number): Promise<EventContextResponse> {
  const { data } = await apiClient.get<EventContextResponse>(`/events/${eventId}/context`, {
    params: { window_minutes: windowMinutes },
  })
  return data
}

export async function analyzeByAlert(alertId: string, regenerate = false): Promise<AnalysisResult> {
  const { data } = await apiClient.post<AnalysisResult>('/events/analyze', { alert_id: alertId, regenerate })
  return data
}

export async function analyzeByEventIds(eventIds: string[]): Promise<AnalysisResult> {
  const { data } = await apiClient.post<AnalysisResult>('/events/analyze', { event_ids: eventIds })
  return data
}
