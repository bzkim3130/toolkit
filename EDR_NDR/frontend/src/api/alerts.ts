import { apiClient } from './client'
import type {
  AlertDetail,
  AlertListParams,
  AlertStatsSummary,
  AlertSummary,
  AlertUpdatePayload,
} from '../types/alert'
import type { PagedResponse } from '../types/common'

export async function listAlerts(params: AlertListParams): Promise<PagedResponse<AlertSummary>> {
  const { data } = await apiClient.get<PagedResponse<AlertSummary>>('/alerts', {
    params: {
      ...params,
      severity: params.severity?.length ? params.severity.join(',') : undefined,
      status: params.status?.length ? params.status.join(',') : undefined,
    },
  })
  return data
}

export async function getAlertStats(): Promise<AlertStatsSummary> {
  const { data } = await apiClient.get<AlertStatsSummary>('/alerts/stats/summary')
  return data
}

export async function getAlert(id: string): Promise<AlertDetail> {
  const { data } = await apiClient.get<AlertDetail>(`/alerts/${id}`)
  return data
}

export async function updateAlert(id: string, payload: AlertUpdatePayload): Promise<AlertDetail> {
  const { data } = await apiClient.patch<AlertDetail>(`/alerts/${id}`, payload)
  return data
}
