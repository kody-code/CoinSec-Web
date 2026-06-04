import request from './request'
import type { ApiResult, AuthResponse } from '@/types'

export function login(data: { username: string; password: string }) {
  return request.post<ApiResult<AuthResponse>>('/auth/login', data)
}

export function setup(data: { username: string; password: string }) {
  return request.post<ApiResult<AuthResponse>>('/auth/setup', data)
}

export function logout() {
  return request.post<ApiResult<null>>('/auth/logout')
}
