import request from './request'
import type { ApiResult, Account } from '@/types'

export function getAccounts() {
  return request.get<ApiResult<Account[]>>('/accounts')
}

export function createAccount(data: { name: string; icon?: string; balance?: number }) {
  return request.post<ApiResult<{ accountId: number }>>('/accounts', data)
}

export function updateAccount(id: number, data: { name?: string; icon?: string; status?: number }) {
  return request.put<ApiResult<null>>(`/accounts/${id}`, data)
}

export function deleteAccount(id: number) {
  return request.delete<ApiResult<null>>(`/accounts/${id}`)
}
