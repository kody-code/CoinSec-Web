import request from './request'
import type { ApiResult, Category } from '@/types'

export function getCategories(type?: string) {
  const params = type ? { type } : {}
  return request.get<ApiResult<Category[]>>('/categories', { params })
}

export function createCategory(data: { name: string; type: string; icon: string; sort?: number }) {
  return request.post<ApiResult<{ categoryId: number }>>('/categories', data)
}

export function updateCategory(id: number, data: { name?: string; icon?: string; sort?: number }) {
  return request.put<ApiResult<null>>(`/categories/${id}`, data)
}

export function deleteCategory(id: number) {
  return request.delete<ApiResult<null>>(`/categories/${id}`)
}
