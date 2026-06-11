import request from './request'
import type { ApiResult, Tag } from '@/types'

export function getTags() {
  return request.get<ApiResult<Tag[]>>('/tags')
}

export function createTag(data: { name: string; color: string }) {
  return request.post<ApiResult<{ tagId: number }>>('/tags', data)
}

export function updateTag(id: number, data: { name?: string; color?: string }) {
  return request.put<ApiResult<null>>(`/tags/${id}`, data)
}

export function deleteTag(id: number) {
  return request.delete<ApiResult<null>>(`/tags/${id}`)
}