import request from './request'
import type { ApiResult, UserInfo } from '@/types'

export function getUserInfo() {
  return request.get<ApiResult<UserInfo>>('/user/info')
}

export function updateNickname(data: { nickname: string }) {
  return request.put<ApiResult<null>>('/user/nickname', data)
}

export function updatePassword(data: { oldPassword: string; newPassword: string }) {
  return request.put<ApiResult<null>>('/user/password', data)
}

export function uploadAvatar(file: FormData) {
  return request.post<ApiResult<{ avatarUrl: string }>>('/user/avatar', file)
}
