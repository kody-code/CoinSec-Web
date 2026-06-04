import request from './request'
import type { ApiResult, RecordItem, Statistics, PageResult } from '@/types'

export interface RecordQuery {
  page?: number
  size?: number
  categoryId?: number
  type?: string
  startDate?: string
  endDate?: string
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
}) {
  return request.post<ApiResult<{ recordId: number }>>('/records', data)
}

export function getStatistics(startDate: string, endDate: string) {
  return request.get<ApiResult<Statistics>>('/records/statistics', {
    params: { startDate, endDate },
  })
}
