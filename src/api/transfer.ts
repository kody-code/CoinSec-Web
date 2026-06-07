import request from './request'
import type { ApiResult, Transfer, PageResult } from '@/types'

export interface TransferQuery {
  page?: number
  size?: number
  startDate?: string
  endDate?: string
}

export function getTransfers(params: TransferQuery) {
  return request.get<ApiResult<PageResult<Transfer>>>('/transfers', { params })
}

export function createTransfer(data: {
  fromAccountId: number
  toAccountId: number
  amount: number
  remark?: string
  transferTime?: string
}) {
  return request.post<ApiResult<{ transferId: number }>>('/transfers', data)
}

export function deleteTransfer(id: number) {
  return request.delete<ApiResult<null>>(`/transfers/${id}`)
}

export function deleteTransferByRecord(params: {
  accountId: number
  amount: number
  recordTime: string
  type: string
}) {
  return request.delete<ApiResult<null>>('/transfers/by-record', { params })
}
