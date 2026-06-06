import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getUserInfo } from '@/api/user'
import { logout as logoutApi } from '@/api/auth'
import type { UserInfo } from '@/types'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<UserInfo | null>(null)
  const isLoggedIn = ref(false)

  function setToken(token: string) {
    localStorage.setItem('satoken', token)
    isLoggedIn.value = true
  }

  function clearToken() {
    localStorage.removeItem('satoken')
    isLoggedIn.value = false
    user.value = null
  }

  async function fetchUser() {
    try {
      const res = await getUserInfo()
      user.value = res.data.data
      isLoggedIn.value = true
      return true
    } catch {
      return false
    }
  }

  async function logout() {
    try {
      await logoutApi()
    } catch {
      // ignore logout API errors, clear local state anyway
    }
    clearToken()
  }

  function checkLogin() {
    const token = localStorage.getItem('satoken')
    if (token) {
      isLoggedIn.value = true
      return true
    }
    return false
  }

  return { user, isLoggedIn, setToken, clearToken, fetchUser, logout, checkLogin }
})