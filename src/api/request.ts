import axios from 'axios'
import type { ApiResult } from '@/types'
import { ElMessage } from 'element-plus'
import router from '@/router'

let onUnauthorized: (() => void) | null = null

export function onAuthUnauthorized(callback: () => void) {
  onUnauthorized = callback
}

const request = axios.create({
  baseURL: '/api',
  timeout: 15000,
})

request.interceptors.request.use((config) => {
  const token = localStorage.getItem('satoken')
  if (token) {
    config.headers['satoken'] = token
  }
  return config
})

function handleUnauthorized(msg?: string) {
  localStorage.removeItem('satoken')
  onUnauthorized?.()
  const isLoginPage = router.currentRoute.value.path === '/login'
  if (!isLoginPage) {
    ElMessage.error(msg || '未登录或 token 已过期')
    router.push('/login')
  }
}

request.interceptors.response.use(
  (response) => {
    const data: ApiResult<unknown> = response.data
    if (data.code === 401) {
      handleUnauthorized(data.msg || '未登录或 token 已过期')
      return Promise.reject(new Error(data.msg))
    }
    if (data.code !== 200) {
      ElMessage.error(data.msg || '请求失败')
      return Promise.reject(new Error(data.msg))
    }
    return response
  },
  (error) => {
    if (error.response?.status === 401) {
      handleUnauthorized()
      return Promise.reject(error)
    }
    ElMessage.error(error.message || '网络错误')
    return Promise.reject(error)
  },
)

export default request