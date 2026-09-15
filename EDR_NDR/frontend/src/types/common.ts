export interface PagedResponse<T> {
  items: T[]
  total: number
  page: number
  page_size: number
}
