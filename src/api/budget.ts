import request from './request'
import type { ApiResult, Budget, BudgetOverview } from '@/types'

export function getBudgets() {
  return request.get<ApiResult<Budget[]>>('/budgets')
}

export function createBudget(data: {
  categoryId: number
  budgetAmount: number
  periodType: string
  periodYear: number
  periodMonth?: number
}) {
  return request.post<ApiResult<{ budgetId: number }>>('/budgets', data)
}

export function updateBudget(id: number, data: {
  categoryId?: number
  budgetAmount?: number
  periodType?: string
  periodYear?: number
  periodMonth?: number
}) {
  return request.put<ApiResult<null>>(`/budgets/${id}`, data)
}

export function deleteBudget(id: number) {
  return request.delete<ApiResult<null>>(`/budgets/${id}`)
}

export function getBudgetOverview(periodType: string, periodYear: number, periodMonth?: number) {
  const params: Record<string, unknown> = { periodType, periodYear }
  if (periodMonth !== undefined && periodMonth !== null) params.periodMonth = periodMonth
  return request.get<ApiResult<BudgetOverview[]>>('/budgets/overview', { params })
}