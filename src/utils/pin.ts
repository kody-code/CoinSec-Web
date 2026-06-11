import { NativeBiometric } from '@capgo/capacitor-native-biometric'
import { Capacitor } from '@capacitor/core'

const STORAGE_KEY = 'app-pin-hash'
const TIMEOUT_KEY = 'app-pin-timeout'
const BIOMETRIC_KEY = 'app-pin-biometric'
const DEFAULT_TIMEOUT = 5

export function getConfiguredTimeout(): number {
  return Number(localStorage.getItem(TIMEOUT_KEY)) || DEFAULT_TIMEOUT
}

export function setConfiguredTimeout(minutes: number) {
  localStorage.setItem(TIMEOUT_KEY, String(minutes))
}

export function hasPin(): boolean {
  return !!localStorage.getItem(STORAGE_KEY)
}

async function hashPin(pin: string): Promise<string> {
  const enc = new TextEncoder().encode(pin)
  const buf = await crypto.subtle.digest('SHA-256', enc)
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
}

export async function setPin(pin: string): Promise<void> {
  localStorage.setItem(STORAGE_KEY, await hashPin(pin))
}

export async function verifyPin(pin: string): Promise<boolean> {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (!stored) return true
  return stored === await hashPin(pin)
}

export function clearPin() {
  localStorage.removeItem(STORAGE_KEY)
  localStorage.removeItem(BIOMETRIC_KEY)
}

export function getBiometricEnabled(): boolean {
  return localStorage.getItem(BIOMETRIC_KEY) === 'true'
}

export function setBiometricEnabled(enabled: boolean) {
  if (enabled) localStorage.setItem(BIOMETRIC_KEY, 'true')
  else localStorage.removeItem(BIOMETRIC_KEY)
}

export async function isBiometricAvailable(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return false
  try {
    const res = await NativeBiometric.isAvailable({ useFallback: false })
    return res.isAvailable
  } catch {
    return false
  }
}

export async function biometricUnlock(): Promise<boolean> {
  try {
    await NativeBiometric.verifyIdentity({
      reason: '解锁 CoinSec',
      title: '生物识别验证',
      subtitle: '使用指纹或面容解锁',
      negativeButtonText: '使用 PIN',
    })
    return true
  } catch {
    return false
  }
}

let lastActivity = Date.now()
let lockCallback: (() => void) | null = null

export function onLockRequested(cb: () => void) {
  lockCallback = cb
}

export function triggerLock() {
  lastActivity = Date.now()
  lockCallback?.()
}

export function touchActivity() {
  lastActivity = Date.now()
}

export function checkLock() {
  const minutes = getConfiguredTimeout()
  if (minutes <= 0 || !hasPin()) return
  const elapsed = (Date.now() - lastActivity) / 1000 / 60
  if (elapsed >= minutes) {
    lastActivity = Date.now()
    lockCallback?.()
  }
}

export function setupActivityTracking() {
  const events = ['mousemove', 'keydown', 'touchstart', 'scroll']
  events.forEach(ev => window.addEventListener(ev, touchActivity, { passive: true }))

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      checkLock()
    }
  })
}
