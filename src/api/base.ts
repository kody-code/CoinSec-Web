import { Capacitor } from '@capacitor/core'

export function getApiBaseUrl(): string {
  if (!Capacitor.isNativePlatform()) {
    return import.meta.env.VITE_API_BASE_URL || '/api'
  }
  return import.meta.env.VITE_NATIVE_API_URL || 'https://coinsec.site/api'
}
