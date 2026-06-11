import request from './request'
import type { ApiResult, RecordItem, Statistics, PageResult } from '@/types'

export interface RecordQuery {
  page?: number
  size?: number
  type?: string
  categoryIds?: string
  startDate?: string
  endDate?: string
  accountId?: number
  tagIds?: string
  keyword?: string
}

export function getRecords(params: RecordQuery) {
  return request.get<ApiResult<PageResult<RecordItem>>>('/records', { params })
}

export function createRecord(data: {
  categoryId: number
  accountId: number
  type: string
  amount: number
  remark?: string
  recordTime?: string
  tagIds?: number[]
}) {
  return request.post<ApiResult<{ recordId: number }>>('/records', data)
}

export function updateRecord(id: number, data: {
  categoryId: number
  accountId: number
  type: string
  amount: number
  remark?: string
  recordTime?: string
  tagIds?: number[]
}) {
  return request.put<ApiResult<RecordItem>>(`/records/${id}`, data)
}

export function deleteRecord(id: number) {
  return request.delete<ApiResult<void>>(`/records/${id}`)
}

export function getStatistics(startDate: string, endDate: string, accountId?: number) {
  return request.get<ApiResult<Statistics>>('/records/statistics', {
    params: { startDate, endDate, accountId },
  })
}
