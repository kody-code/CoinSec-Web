<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { RouterView, useRouter, useRoute } from 'vue-router'
import { App } from '@capacitor/app'
import { hasPin, verifyPin, onLockRequested, setupActivityTracking, triggerLock, getBiometricEnabled, isBiometricAvailable, biometricUnlock } from '@/utils/pin'

const router = useRouter()
const route = useRoute()
let backListener: { remove: () => void } | null = null

const locked = ref(false)
const pinDigits = ref(['', '', '', ''])
const pinError = ref(false)
const pinInputs = ref<(HTMLInputElement | null)[]>([])
const bioAvailable = ref(false)
let lockBusy = false
let bioJustUnlocked = false

function onPinInput(idx: number) {
  if (pinDigits.value[idx] && idx < 3) {
    pinInputs.value[idx + 1]?.focus()
  }
  if (pinDigits.value.every(d => d)) {
    doUnlock()
  }
}

function onPinKeydown(e: KeyboardEvent, idx: number) {
  if (e.key === 'Backspace' && !pinDigits.value[idx] && idx > 0) {
    pinInputs.value[idx - 1]?.focus()
  }
}

async function tryBiometric() {
  const ok = await biometricUnlock()
  if (ok) {
    bioJustUnlocked = true
    locked.value = false
    pinDigits.value = ['', '', '', '']
    pinError.value = false
    setTimeout(() => { bioJustUnlocked = false }, 1000)
  }
}

async function doUnlock() {
  const pin = pinDigits.value.join('')
  if (pin.length < 4) return
  const ok = await verifyPin(pin)
  if (ok) {
    locked.value = false
    pinDigits.value = ['', '', '', '']
    pinError.value = false
  } else {
    pinError.value = true
    pinDigits.value = ['', '', '', '']
    pinInputs.value[0]?.focus()
  }
}

async function showLock() {
  if (lockBusy) return
  lockBusy = true
  locked.value = true
  pinDigits.value = ['', '', '', '']
  pinError.value = false
  bioAvailable.value = await isBiometricAvailable()
  if (getBiometricEnabled() && bioAvailable.value) {
    await tryBiometric()
  }
  if (locked.value) nextTick(() => pinInputs.value[0]?.focus())
  lockBusy = false
}

onMounted(async () => {
  backListener = await App.addListener('backButton', () => {
    if (locked.value) return
    if (route.name && route.name !== 'Dashboard') {
      router.replace('/dashboard')
    } else {
      App.exitApp()
    }
  })

  App.addListener('appStateChange', ({ isActive }) => {
    if (isActive && hasPin() && !locked.value && !lockBusy && !bioJustUnlocked) {
      showLock()
    }
  })

  if (hasPin()) showLock()
  onLockRequested(showLock)
  setupActivityTracking()
})

onUnmounted(() => {
  backListener?.remove()
})
</script>

<template>
  <RouterView />
  <Teleport to="body">
    <div v-if="locked" class="pin-lock-overlay" @touchstart.prevent>
      <div class="pin-lock-card">
        <div class="pin-lock-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="32" height="32"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
        </div>
        <h3 class="pin-lock-title">已锁定</h3>
        <p class="pin-lock-hint">输入 PIN 解锁</p>
        <div class="pin-box-row">
          <input
            v-for="i in 4" :key="i"
            ref="pinInputs"
            v-model="pinDigits[i - 1]"
            type="password"
            class="pin-digit-box"
            :class="{ error: pinError }"
            maxlength="1"
            @input="onPinInput(i - 1)"
            @keydown="onPinKeydown($event, i - 1)"
          />
        </div>
        <p v-if="pinError" class="pin-lock-error">PIN 错误，请重试</p>
        <button v-if="bioAvailable && getBiometricEnabled()" class="pin-bio-btn" @click="tryBiometric">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><path d="M12 2a5 5 0 00-5 5v2a5 5 0 0010 0V7a5 5 0 00-5-5z"/><path d="M5 13a7 7 0 0114 0v4a7 7 0 01-14 0v-4z"/></svg>
          指纹解锁
        </button>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.pin-lock-overlay {
  position: fixed;
  inset: 0;
  z-index: 99999;
  background: var(--bg, #f8fafc);
  display: flex;
  align-items: center;
  justify-content: center;
}
.pin-lock-card {
  text-align: center;
  padding: 40px;
}
.pin-lock-icon {
  color: var(--primary, #6366f1);
  margin-bottom: 16px;
}
.pin-lock-title {
  font-size: 22px;
  font-weight: 700;
  color: var(--text-primary, #1e293b);
  margin: 0 0 4px;
}
.pin-lock-hint {
  font-size: 14px;
  color: var(--text-secondary, #64748b);
  margin: 0 0 24px;
}
.pin-box-row {
  display: flex;
  gap: 12px;
  justify-content: center;
}
.pin-digit-box {
  width: 48px;
  height: 54px;
  text-align: center;
  font-size: 22px;
  font-weight: 600;
  border: 2px solid var(--border-light, #f1f5f9);
  border-radius: 12px;
  outline: none;
  background: var(--card-bg, #fff);
  color: var(--text-primary, #1e293b);
  transition: border-color 0.15s;
}
.pin-digit-box:focus {
  border-color: var(--primary, #6366f1);
}
.pin-digit-box.error {
  border-color: var(--expense, #ef4444);
}
.pin-lock-error {
  color: var(--expense, #ef4444);
  font-size: 13px;
  margin: 8px 0 0;
}
.pin-bio-btn {
  margin-top: 24px;
  padding: 10px 24px;
  border: 2px solid var(--border-light, #f1f5f9);
  border-radius: 12px;
  background: var(--card-bg, #fff);
  color: var(--text-primary, #1e293b);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  transition: border-color 0.15s, background 0.15s;
}
.pin-bio-btn:hover {
  border-color: var(--primary, #6366f1);
  background: var(--primary-bg, #eef2ff);
}
</style>
