import { apiClient } from './client'
import type { VTDomainResult, VTFileResult, VTIpResult, VTQuota, VTUrlResult } from '../types/virustotal'

export async function lookupFile(hash: string): Promise<VTFileResult> {
  const { data } = await apiClient.get<VTFileResult>(`/vt/file/${encodeURIComponent(hash)}`)
  return data
}

export async function lookupIp(ip: string): Promise<VTIpResult> {
  const { data } = await apiClient.get<VTIpResult>(`/vt/ip/${encodeURIComponent(ip)}`)
  return data
}

export async function lookupDomain(domain: string): Promise<VTDomainResult> {
  const { data } = await apiClient.get<VTDomainResult>(`/vt/domain/${encodeURIComponent(domain)}`)
  return data
}

export async function lookupUrl(url: string): Promise<VTUrlResult> {
  const { data } = await apiClient.post<VTUrlResult>('/vt/url', { url })
  return data
}

export async function getQuota(): Promise<VTQuota> {
  const { data } = await apiClient.get<VTQuota>('/vt/quota')
  return data
}
