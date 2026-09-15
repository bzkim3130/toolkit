import { isAxiosError } from 'axios'

export function getErrorMessage(error: unknown): string {
  if (isAxiosError(error)) {
    const detail = error.response?.data?.detail
    if (typeof detail === 'string') return detail
  }
  return '요청 처리 중 오류가 발생했습니다.'
}
