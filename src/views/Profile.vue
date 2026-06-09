<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { updateNickname, updatePassword, uploadAvatar, setDefaultAccounts } from '@/api/user'
import { getAccounts } from '@/api/account'
import { formatMoney } from '@/utils/format'
import { getApiBaseUrl } from '@/api/base'
import { Capacitor } from '@capacitor/core'
import type { Account } from '@/types'
import { ElMessage, ElMessageBox } from 'element-plus'
import { hasPin, setPin, clearPin, getConfiguredTimeout, setConfiguredTimeout, getBiometricEnabled, setBiometricEnabled, isBiometricAvailable, triggerLock } from '@/utils/pin'

const auth = useAuthStore()
const nickVal = ref('')
const nickEditing = ref(false)
const nickInput = ref<HTMLInputElement>()
const pwForm = ref({ oldPassword: '', newPassword: '', confirmPassword: '' })
const pwDialogVisible = ref(false)
const nickLoading = ref(false)
const pwLoading = ref(false)

const uploading = ref(false)
const avatarFailed = ref(false)
const avatarInput = ref<HTMLInputElement>()

function avatarSrc(): string | null {
  const url = auth.user?.avatar
  if (!url) return null
  if (url.startsWith('http://') || url.startsWith('https://')) return url
  const path = url.startsWith('/') ? url : '/' + url
  if (!Capacitor.isNativePlatform()) {
    return path
  }
  const apiBase = getApiBaseUrl()
  const origin = apiBase.replace(/\/api$/, '')
  return origin + path
}

function onAvatarError() {
  avatarFailed.value = true
}

const accounts = ref<Account[]>([])
const defaultExpenseId = ref(0)
const defaultIncomeId = ref(0)

const pinEnabled = ref(hasPin())
const pinDialogVisible = ref(false)
const pinDigits = ref(['', '', '', ''])
const pinConfirmDigits = ref(['', '', '', ''])
const pinStep = ref<'set' | 'confirm'>('set')
const pinInputs = ref<(HTMLInputElement | null)[]>([])
const pinConfirmInputs = ref<(HTMLInputElement | null)[]>([])
const pinTimeout = ref(getConfiguredTimeout())
const bioEnabled = ref(getBiometricEnabled())
const bioAvailable = ref(false)

onMounted(async () => {
  bioAvailable.value = await isBiometricAvailable()
})

function onPinInput(idx: number, digits: string[], nextRefs: (HTMLInputElement | null)[]) {
  if (digits[idx] && idx < 3) {
    nextRefs[idx + 1]?.focus()
  }
}

function onPinKeydown(e: KeyboardEvent, idx: number, digits: string[], prevRefs: (HTMLInputElement | null)[]) {
  if (e.key === 'Backspace' && !digits[idx] && idx > 0) {
    prevRefs[idx - 1]?.focus()
  }
}

function resetPinForm() {
  pinDigits.value = ['', '', '', '']
  pinConfirmDigits.value = ['', '', '', '']
  pinStep.value = 'set'
}

function nextPinStep() {
  if (pinDigits.value.some(d => !d)) {
    ElMessage.warning('请输入完整 PIN')
    return
  }
  pinStep.value = 'confirm'
  nextTick(() => (document.querySelector<HTMLInputElement>('.pin-confirm-box')?.focus()))
}

async function handleSetPin() {
  if (pinConfirmDigits.value.some(d => !d)) {
    ElMessage.warning('请确认 PIN')
    return
  }
  const pin = pinDigits.value.join('')
  const confirm = pinConfirmDigits.value.join('')
  if (pin !== confirm) {
    ElMessage.warning('两次输入不一致')
    pinConfirmDigits.value = ['', '', '', '']
    pinStep.value = 'set'
    return
  }
  await setPin(pin)
  pinEnabled.value = true
  pinDialogVisible.value = false
  resetPinForm()
  ElMessage.success('PIN 已设置')
}

async function handleRemovePin() {
  try {
    await ElMessageBox.confirm('确定关闭应用锁？', '提示')
    clearPin()
    pinEnabled.value = false
    ElMessage.success('PIN 已关闭')
  } catch { /* cancel */ }
}

function handleTimeoutChange(val: number) {
  setConfiguredTimeout(val)
  ElMessage.success(`闲置超时已设为 ${val} 分钟`)
}

async function handleBioToggle(val: boolean) {
  if (val && !bioAvailable.value) {
    ElMessage.warning('设备不支持生物识别')
    return
  }
  setBiometricEnabled(val)
  bioEnabled.value = val
  ElMessage.success(val ? '生物识别已开启' : '生物识别已关闭')
}


function triggerUpload() {
  avatarInput.value?.click()
}

async function handleAvatarChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return

  const maxSize = 5 * 1024 * 1024
  if (file.size > maxSize) {
    ElMessage.warning('图片不能超过 5MB')
    return
  }

  uploading.value = true
  avatarFailed.value = false
  try {
    const fd = new FormData()
    fd.append('file', file)
    await uploadAvatar(fd)
    await auth.fetchUser()
    ElMessage.success('头像已更新')
  } catch {
    ElMessage.error('头像上传失败')
  } finally {
    uploading.value = false
    if (avatarInput.value) avatarInput.value.value = ''
  }
}

function loadDefaults() {
  defaultExpenseId.value = auth.user?.defaultExpenseAccountId || 0
  defaultIncomeId.value = auth.user?.defaultIncomeAccountId || 0
}

async function saveDefault() {
  const payload = {
    defaultExpenseAccountId: defaultExpenseId.value || null,
    defaultIncomeAccountId: defaultIncomeId.value || null,
  }
  try {
    await setDefaultAccounts(payload)
    await auth.fetchUser()
    ElMessage.success('默认账户已更新')
  } catch {
    ElMessage.error('保存失败')
  }
}

function startEditNick() {
  if (auth.user) nickVal.value = auth.user.nickname || ''
  nickEditing.value = true
  nextTick(() => nickInput.value?.focus())
}

async function saveNickname() {
  if (!nickVal.value) { ElMessage.warning('请输入昵称'); return }
  nickLoading.value = true
  try {
    await updateNickname({ nickname: nickVal.value })
    await auth.fetchUser()
    ElMessage.success('昵称已更新')
    nickEditing.value = false
  } finally { nickLoading.value = false }
}

function cancelEditNick() {
  nickEditing.value = false
  if (auth.user) nickVal.value = auth.user.nickname || ''
}

async function savePassword() {
  if (!pwForm.value.oldPassword || !pwForm.value.newPassword) { ElMessage.warning('请填写完整'); return }
  if (pwForm.value.newPassword !== pwForm.value.confirmPassword) { ElMessage.warning('两次密码不一致'); return }
  pwLoading.value = true
  try {
    await updatePassword({ oldPassword: pwForm.value.oldPassword, newPassword: pwForm.value.newPassword })
    ElMessage.success('密码已修改')
    pwDialogVisible.value = false
    pwForm.value = { oldPassword: '', newPassword: '', confirmPassword: '' }
  } finally { pwLoading.value = false }
}

onMounted(async () => {
  if (auth.user) nickVal.value = auth.user.nickname || ''
  loadDefaults()
  try {
    const res = await getAccounts()
    accounts.value = res.data.data
  } catch { /* 401 */ }
})
</script>

<template>
  <div class="profile-page">
    <div class="profile-hero">
      <div class="profile-avatar-large" :class="{ uploading }" @click="triggerUpload">
        <img v-if="avatarSrc() && !avatarFailed" :src="avatarSrc()!" class="avatar-img" @error="onAvatarError" />
        <span v-else class="avatar-initial">{{ auth.user?.nickname?.charAt(0) || 'U' }}</span>
        <div class="avatar-overlay">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
            <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/>
            <circle cx="12" cy="13" r="4"/>
          </svg>
        </div>
        <div v-if="uploading" class="avatar-loading">
          <div class="spinner"></div>
        </div>
      </div>
      <input ref="avatarInput" type="file" accept="image/*" style="display:none" @change="handleAvatarChange" />
      <div class="profile-info">
        <div v-if="nickEditing" class="nick-edit-inline">
          <input
            ref="nickInput"
            v-model="nickVal"
            class="nick-input"
            maxlength="20"
            @keyup.enter="saveNickname"
            @keyup.escape="cancelEditNick"
            @blur="saveNickname"
          />
        </div>
        <h2 v-else>
          {{ auth.user?.nickname || '用户' }}
          <button class="nick-edit-btn" @click="startEditNick">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M17 3a2.85 2.85 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
          </button>
        </h2>
        <p class="profile-username">@{{ auth.user?.username }}</p>
      </div>
    </div>

    <div class="profile-card clickable" @click="pwDialogVisible = true; pwForm = { oldPassword: '', newPassword: '', confirmPassword: '' }">
      <div class="card-icon-row">
        <div class="card-icon-wrap password">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
        </div>
        <div class="card-content">
          <span class="card-label">密码</span>
          <span class="card-value">••••••••</span>
        </div>
      </div>
    </div>

    <el-dialog v-model="pwDialogVisible" title="修改密码" width="360px">
      <div class="pw-dialog-body">
        <input v-model="pwForm.oldPassword" type="password" placeholder="原密码" class="field-input" />
        <input v-model="pwForm.newPassword" type="password" placeholder="新密码" class="field-input" />
        <input v-model="pwForm.confirmPassword" type="password" placeholder="确认新密码" class="field-input" />
      </div>
      <template #footer>
        <el-button @click="pwDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="pwLoading" @click="savePassword">确认修改</el-button>
      </template>
    </el-dialog>

    <div class="profile-card">
      <div class="card-icon-row">
        <div class="card-icon-wrap lock">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
        </div>
        <div class="card-content">
          <span class="card-label">应用锁</span>
          <span class="card-value">{{ pinEnabled ? '已开启' : '已关闭' }}</span>
        </div>
        <div class="card-actions">
          <button class="card-action-btn" @click="pinDialogVisible = true; resetPinForm()">
            {{ pinEnabled ? '修改' : '设置' }}
          </button>
          <button v-if="pinEnabled" class="card-action-btn" @click="triggerLock">锁定</button>
          <button v-if="pinEnabled" class="card-action-btn danger" @click="handleRemovePin">关闭</button>
        </div>
      </div>
      <div class="pref-row" style="margin-top:8px">
        <div class="pref-field">
          <label class="pref-label">闲置自动锁定</label>
          <el-select v-model="pinTimeout" @change="handleTimeoutChange" style="width: 100%">
            <el-option :value="1" label="1 分钟" />
            <el-option :value="5" label="5 分钟" />
            <el-option :value="15" label="15 分钟" />
            <el-option :value="30" label="30 分钟" />
          </el-select>
        </div>
      </div>
      <div v-if="pinEnabled" class="pref-row" style="margin-top:8px">
        <div class="pref-field">
          <label class="pref-label">生物识别解锁</label>
          <el-switch
            :model-value="bioEnabled"
            :disabled="!bioAvailable"
            @update:model-value="handleBioToggle"
          />
        </div>
      </div>
    </div>

    <el-dialog v-model="pinDialogVisible" title="设置应用锁 PIN" width="360px" @closed="resetPinForm">
      <div class="pin-dialog-body">
        <p class="pin-dialog-label">{{ pinStep === 'set' ? '设置 PIN' : '再次输入确认' }}</p>
        <div class="pin-box-row">
          <input
            v-for="i in 4" :key="'pin-' + i"
            ref="pinInputs"
            v-model="pinDigits[i - 1]"
            type="password"
            class="pin-digit-box"
            maxlength="1"
            :class="{ 'pin-confirm-box': pinStep === 'confirm' }"
            @input="onPinInput(i - 1, pinDigits, pinInputs)"
            @keydown="onPinKeydown($event, i - 1, pinDigits, pinInputs)"
          />
        </div>
        <div v-if="pinStep === 'confirm'" class="pin-box-row" style="margin-top:16px">
          <input
            v-for="i in 4" :key="'cnf-' + i"
            ref="pinConfirmInputs"
            v-model="pinConfirmDigits[i - 1]"
            type="password"
            class="pin-digit-box"
            maxlength="1"
            @input="onPinInput(i - 1, pinConfirmDigits, pinConfirmInputs)"
            @keydown="onPinKeydown($event, i - 1, pinConfirmDigits, pinConfirmInputs)"
          />
        </div>
      </div>
      <template #footer>
        <el-button @click="pinDialogVisible = false; resetPinForm()">取消</el-button>
        <el-button v-if="pinStep === 'set'" type="primary" @click="nextPinStep">下一步</el-button>
        <el-button v-else type="primary" @click="handleSetPin">确认</el-button>
      </template>
    </el-dialog>

    <div class="profile-card">
      <div class="card-icon-row">
        <div class="card-icon-wrap preference">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>
        </div>
        <div class="card-content">
          <span class="card-label">默认账户</span>
          <span class="card-value">记账时自动选中的账户</span>
        </div>
      </div>
      <div class="pref-row">
        <div class="pref-field">
          <label class="pref-label">默认支出账户</label>
          <el-select v-model="defaultExpenseId" @change="saveDefault()" placeholder="不设置" style="width: 100%">
            <el-option :value="0" label="不设置" />
            <el-option v-for="acct in accounts" :key="acct.accountId" :value="acct.accountId" :label="`${acct.name} (${formatMoney(acct.balance)})`" />
          </el-select>
        </div>
        <div class="pref-field">
          <label class="pref-label">默认收入账户</label>
          <el-select v-model="defaultIncomeId" @change="saveDefault()" placeholder="不设置" style="width: 100%">
            <el-option :value="0" label="不设置" />
            <el-option v-for="acct in accounts" :key="acct.accountId" :value="acct.accountId" :label="`${acct.name} (${formatMoney(acct.balance)})`" />
          </el-select>
        </div>
      </div>
    </div>

    <div class="profile-card info-card">
      <div class="info-row">
        <span class="info-label">用户名</span>
        <span class="info-value">{{ auth.user?.username }}</span>
      </div>
      <div class="info-row">
        <span class="info-label">注册时间</span>
        <span class="info-value">{{ auth.user?.createTime ? new Date(auth.user.createTime).toLocaleDateString('zh-CN') : '—' }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.profile-page {
  max-width: 640px;
  margin: 0 auto;
}

.profile-hero {
  display: flex;
  align-items: center;
  gap: 18px;
  margin-bottom: 24px;
  padding: 24px;
  background: linear-gradient(135deg, var(--accent-dark), var(--accent-deep), var(--accent-purple));
  border-radius: 20px;
  color: #fff;
  position: relative;
  overflow: hidden;
}

.profile-hero::after {
  content: '';
  position: absolute;
  top: -30px;
  right: -20px;
  width: 120px;
  height: 120px;
  background: rgba(255,255,255,0.06);
  border-radius: 50%;
}

.profile-avatar-large {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: rgba(255,255,255,0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 26px;
  font-weight: 700;
  flex-shrink: 0;
  backdrop-filter: blur(4px);
  border: 2px solid rgba(255,255,255,0.1);
  position: relative;
  z-index: 1;
  cursor: pointer;
  overflow: hidden;
  transition: opacity 0.2s;
}

.profile-avatar-large:hover .avatar-overlay {
  opacity: 1;
}

.profile-avatar-large.uploading {
  opacity: 0.6;
  pointer-events: none;
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
}

.avatar-initial {
  position: relative;
  z-index: 1;
}

.avatar-overlay {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: rgba(0,0,0,0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  opacity: 0;
  transition: opacity 0.2s;
  z-index: 2;
}

.avatar-loading {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 3;
}

.spinner {
  width: 22px;
  height: 22px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.profile-info h2 {
  font-size: 20px;
  font-weight: 600;
  margin: 0;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  position: relative;
  z-index: 1;
}

.nick-edit-btn {
  background: none;
  border: none;
  color: var(--text-hint);
  cursor: pointer;
  padding: 4px;
  border-radius: 6px;
  display: inline-flex;
  align-items: center;
  transition: color 0.15s, background 0.15s;
}
.nick-edit-btn:hover {
  color: var(--text-primary);
  background: var(--bg);
}

.nick-edit-inline {
  width: 100%;
}
.nick-input {
  width: 100%;
  font-size: 20px;
  font-weight: 600;
  border: 2px solid var(--primary);
  border-radius: 8px;
  padding: 6px 10px;
  outline: none;
  background: transparent;
  color: var(--text-primary);
  box-sizing: border-box;
}

.profile-username {
  font-size: 14px;
  opacity: 0.7;
  margin: 4px 0 0;
  position: relative;
  z-index: 1;
}

.profile-card {
  background: #fff;
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 12px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
}

.card-icon-row {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 16px;
}

.card-icon-wrap {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.card-icon-wrap.password {
  background: var(--expense-bg);
  color: var(--expense);
}

.card-icon-wrap.lock {
  background: var(--accent-bg);
  color: var(--accent);
}

.card-icon-wrap.preference {
  background: var(--income-bg);
  color: var(--income);
}

.card-content {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.card-label {
  font-size: 12px;
  color: var(--text-secondary);
  font-weight: 500;
}

.card-value {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
}

.card-actions {
  display: flex;
  gap: 6px;
  margin-left: auto;
}
.card-action-btn {
  background: var(--bg);
  border: none;
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  color: var(--primary);
  cursor: pointer;
  transition: background 0.15s;
}
.card-action-btn:hover {
  background: var(--primary-bg);
}
.card-action-btn.danger {
  color: var(--expense);
}
.card-action-btn.danger:hover {
  background: var(--expense-bg);
}

.profile-card.clickable {
  cursor: pointer;
  transition: background 0.15s;
}
.profile-card.clickable:hover {
  background: var(--bg);
}

.pin-dialog-body {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px 0;
}
.pin-dialog-label {
  font-size: 14px;
  color: var(--text-secondary);
  margin: 0 0 16px;
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
  border: 2px solid var(--border-light);
  border-radius: 12px;
  outline: none;
  background: var(--card-bg);
  color: var(--text-primary);
  transition: border-color 0.15s;
}
.pin-digit-box:focus {
  border-color: var(--primary);
}

.pw-dialog-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.field-input {
  flex: 1;
  padding: 10px 14px;
  border-radius: 10px;
  border: 1px solid var(--border);
  font-size: 14px;
  font-family: inherit;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
  color: var(--text-primary);
  background: var(--bg);
}

.field-input:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-glow);
  background: #fff;
}

.save-btn {
  padding: 10px 22px;
  border-radius: 10px;
  border: none;
  background: linear-gradient(135deg, var(--accent), var(--accent-purple));
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.save-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px var(--accent-glow);
}

.save-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.info-card {
  margin-top: 4px;
}

.pref-row {
  display: flex;
  gap: 12px;
}

.pref-field {
  flex: 1;
}

.pref-label {
  display: block;
  font-size: 12px;
  font-weight: 500;
  color: var(--text-secondary);
  margin-bottom: 6px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 0;
}

.info-row + .info-row {
  border-top: 1px solid var(--border-light);
}

.info-label {
  font-size: 14px;
  color: var(--text-secondary);
}

.info-value {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
}

@media (max-width: 768px) {
  .profile-page { max-width: 100%; }
}
</style>