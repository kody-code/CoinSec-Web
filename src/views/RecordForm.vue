<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { createRecord, updateRecord } from '@/api/record'
import { getCategories } from '@/api/category'
import { getAccounts } from '@/api/account'
import CategoryIcon from '@/components/CategoryIcon.vue'
import AccountIcon from '@/components/AccountIcon.vue'
import { formatMoney, getLocalDateString } from '@/utils/format'
import type { Category, Account, RecordItem } from '@/types'
import { ElMessage } from 'element-plus'
import { isNativeApp } from '@/utils/platform'

const router = useRouter()
const route = useRoute()
const isEdit = computed(() => !!route.params.id)
const existingRecord = ref<RecordItem | null>(null)
const isNative = isNativeApp()

const categories = ref<Category[]>([])
const accounts = ref<Account[]>([])
const loading = ref(false)

const typeFilter = ref('expense')

function getDefaultAccountId(type: string): number {
  const auth = useAuthStore()
  if (type === 'expense') return auth.user?.defaultExpenseAccountId || 0
  return auth.user?.defaultIncomeAccountId || 0
}

const form = ref({
  type: 'expense' as string,
  categoryId: undefined as number | undefined,
  accountId: undefined as number | undefined,
  amount: '',
  remark: '',
  recordDate: getLocalDateString(),
  recordTimeStr: `${String(new Date().getHours()).padStart(2, '0')}:${String(new Date().getMinutes()).padStart(2, '0')}`,
})

const showAccountPicker = ref(false)
const showAllAccounts = ref(false)

const filteredCategories = ref<Category[]>([])

const hasDefaultAccount = computed(() => getDefaultAccountId(form.value.type) > 0)

const selectedAccount = computed(() => {
  if (!form.value.accountId) return null
  return accounts.value.find(a => a.accountId === form.value.accountId)
})

function selectType(type: string) {
  showAllAccounts.value = false
  if (form.value.type !== type) form.value.amount = ''
  form.value.categoryId = undefined
  typeFilter.value = type
  form.value.type = type
  filteredCategories.value = categories.value.filter(c => c.type === type)
  const defaultId = getDefaultAccountId(type)
  if (defaultId && accounts.value.some(a => a.accountId === defaultId)) {
    form.value.accountId = defaultId
  }
}

function selectCategory(catId: number) {
  form.value.categoryId = form.value.categoryId === catId ? undefined : catId
}

function selectAccount(acctId: number) {
  form.value.accountId = acctId
  showAccountPicker.value = false
}

const currentDefaultId = computed(() => getDefaultAccountId(form.value.type))

async function handleSubmit() {
  const amount = parseFloat(form.value.amount || '0')
  if (!form.value.categoryId || !form.value.accountId || isNaN(amount) || amount === 0) {
    ElMessage.warning('请填写完整信息')
    return
  }

  loading.value = true
  try {
    const payload = {
      categoryId: form.value.categoryId,
      accountId: form.value.accountId,
      type: form.value.type,
      amount,
      remark: form.value.remark,
      recordTime: `${form.value.recordDate} ${form.value.recordTimeStr}:00`,
    }

    if (isEdit.value && existingRecord.value) {
      await updateRecord(existingRecord.value.recordId, payload)
      sessionStorage.removeItem('editingRecord')
      ElMessage.success('修改成功')
    } else {
      await createRecord(payload)
      ElMessage.success('记账成功')
    }
    router.push('/records')
  } finally {
    loading.value = false
  }
}

// --- Calendar picker ---
const showCalendar = ref(false)
const calYear = ref(new Date().getFullYear())
const calMonth = ref(new Date().getMonth())

const weekdays = ['日', '一', '二', '三', '四', '五', '六']

const calDays = computed(() => {
  const first = new Date(calYear.value, calMonth.value, 1)
  const startDow = first.getDay()
  const daysInMonth = new Date(calYear.value, calMonth.value + 1, 0).getDate()
  const prevDays = new Date(calYear.value, calMonth.value, 0).getDate()
  const cells: { day: number; inMonth: boolean; dateStr: string }[] = []
  for (let i = startDow - 1; i >= 0; i--) {
    cells.push({ day: prevDays - i, inMonth: false, dateStr: '' })
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const m = String(calMonth.value + 1).padStart(2, '0')
    const ds = String(d).padStart(2, '0')
    cells.push({ day: d, inMonth: true, dateStr: `${calYear.value}-${m}-${ds}` })
  }
  while (cells.length < 42) cells.push({ day: cells.length - daysInMonth - startDow + 1, inMonth: false, dateStr: '' })
  return cells
})

const calTitle = computed(() => `${calYear.value}年${calMonth.value + 1}月`)

function prevMonth() {
  if (calMonth.value === 0) { calMonth.value = 11; calYear.value-- }
  else calMonth.value--
}
function nextMonth() {
  if (calMonth.value === 11) { calMonth.value = 0; calYear.value++ }
  else calMonth.value++
}
function selectCalDay(cell: { day: number; inMonth: boolean; dateStr: string }) {
  if (!cell.inMonth) return
  form.value.recordDate = cell.dateStr
  showCalendar.value = false
}
function openCalendar() {
  const [y, m] = form.value.recordDate.split('-').map(Number)
  calYear.value = y
  calMonth.value = m - 1
  showCalendar.value = true
}

// --- Time picker (clock dial, 24h) ---
const showTimePicker = ref(false)
const tpHour = ref(0)
const tpMinute = ref(0)
const tpPhase = ref<'hour' | 'minute'>('hour')

const innerHours = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
const outerHours = [0, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23]
const clockMinutes = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55]

function openTimePicker() {
  const [h, m] = form.value.recordTimeStr.split(':').map(Number)
  tpHour.value = h
  tpMinute.value = m
  tpPhase.value = 'hour'
  showTimePicker.value = true
}
function selectHour(h: number) {
  tpHour.value = h
  tpPhase.value = 'minute'
}
function selectMinute(m: number) {
  tpMinute.value = m
}
function confirmTime() {
  form.value.recordTimeStr = `${String(tpHour.value).padStart(2, '0')}:${String(tpMinute.value).padStart(2, '0')}`
  showTimePicker.value = false
}
function clockHandAngle(): number {
  if (tpPhase.value === 'hour') {
    return ((tpHour.value % 12) * 30) - 90
  }
  return (tpMinute.value / 60) * 360 - 90
}
function clockPos(idx: number, r: number, size: number): Record<string, string> {
  const angle = (idx / 12) * 2 * Math.PI - Math.PI / 2
  const cx = 130, cy = 130
  const x = cx + r * Math.cos(angle) - size / 2
  const y = cy + r * Math.sin(angle) - size / 2
  return { left: `${x}px`, top: `${y}px` }
}

function handWidth(): string {
  return tpPhase.value === 'minute' ? '38.5%' : '43%'
}

// --- Num pad (native only) ---
const numKeys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', '⌫']
function onNumKey(key: string) {
  if (key === '⌫') {
    form.value.amount = form.value.amount.slice(0, -1)
    return
  }
  if (key === '.') {
    if (form.value.amount.includes('.')) return
    if (!form.value.amount) form.value.amount = '0'
  }
  if (key !== '.' && form.value.amount.includes('.') && form.value.amount.split('.')[1]?.length >= 2) return
  if (form.value.amount.length >= 12) return
  form.value.amount += key
}

onMounted(async () => {
  try {
    const [catRes, acctRes] = await Promise.all([getCategories(), getAccounts()])
    categories.value = catRes.data.data
    accounts.value = acctRes.data.data
    filteredCategories.value = categories.value.filter(c => c.type === 'expense')

    if (!isEdit.value) {
      const defaultId = getDefaultAccountId('expense')
      if (defaultId && accounts.value.some(a => a.accountId === defaultId)) {
        form.value.accountId = defaultId
      }
    }

    if (isEdit.value) {
      const record = (window.history.state?.record as RecordItem | undefined)
        || JSON.parse(sessionStorage.getItem('editingRecord') || 'null')
      if (record) {
        existingRecord.value = record
        form.value.type = record.type
        form.value.categoryId = record.categoryId
        form.value.accountId = record.accountId
        form.value.amount = String(record.amount)
        form.value.remark = record.remark || ''
        if (record.recordTime) {
          const d = new Date(record.recordTime)
          form.value.recordDate = getLocalDateString(d)
          form.value.recordTimeStr = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
        }
        typeFilter.value = record.type
        filteredCategories.value = categories.value.filter(c => c.type === record.type)
      }
    }
  } catch (e) {
    console.error('[RecordForm] Failed to load data:', e)
  }
})
</script>

<template>
  <div :class="['record-form', { 'record-form-native': isNative }]">
    <div class="rf-header">
      <button class="rf-back" @click="router.back()">
        <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>
      </button>
      <span class="rf-title">{{ isEdit ? '编辑记录' : '记一笔' }}</span>
      <div style="width: 20px" />
    </div>

    <div class="rf-type">
      <button :class="['rf-type-btn', { active: form.type === 'expense' }]" @click="selectType('expense')">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="16" height="16"><path d="M12 5v14M5 12l7 7 7-7"/></svg>
        支出
      </button>
      <button :class="['rf-type-btn', { active: form.type === 'income' }]" @click="selectType('income')">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="16" height="16"><path d="M12 19V5M5 12l7-7 7 7"/></svg>
        收入
      </button>
    </div>

    <div class="rf-categories">
      <button
        v-for="cat in filteredCategories"
        :key="cat.categoryId"
        :class="['rf-cat-item', { active: form.categoryId === cat.categoryId }]"
        @click="selectCategory(cat.categoryId)"
      >
        <CategoryIcon :icon="cat.icon" :size="isNative ? 18 : 22" />
        <span>{{ cat.name }}</span>
      </button>
    </div>

    <div class="rf-amount-row">
      <span class="rf-amount-symbol">¥</span>
      <input
        v-if="!isNative"
        v-model="form.amount"
        type="number"
        step="0.01"
        placeholder="0.00"
        class="rf-amount-input"
        autofocus
      />
      <div v-else class="rf-amount-display">{{ form.amount || '0.00' }}</div>
    </div>

    <!-- Meta row: account, remark, date, time -->
    <div class="rf-meta-row">
      <button class="rf-meta-item" @click="showAccountPicker = true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
        <span>{{ selectedAccount?.name || '账户' }}</span>
      </button>
      <input v-model="form.remark" placeholder="备注" class="rf-meta-input" maxlength="20" />
      <button class="rf-meta-item rf-meta-date" @click="openCalendar">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
        <span>{{ form.recordDate.slice(5) }}</span>
      </button>
      <button class="rf-meta-item" @click="openTimePicker">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        <span>{{ form.recordTimeStr }}</span>
      </button>
    </div>

    <!-- Web: spacer + submit -->
    <template v-if="!isNative">
      <div class="rf-spacer" />
      <button class="rf-submit" :disabled="loading" @click="handleSubmit">
        {{ loading ? '保存中...' : '确认记账' }}
      </button>
    </template>

    <!-- Native: numpad with integrated submit -->
    <template v-else>
      <div class="rf-native-gap" />
      <div class="rf-numpad">
        <button v-for="k in numKeys" :key="k" :class="['rf-numpad-key', { 'rf-numpad-dot': k === '.', 'rf-numpad-del': k === '⌫' }]" @click="onNumKey(k)">
          <template v-if="k !== '⌫'">{{ k }}</template>
          <svg v-else viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M21 4h-9.17c-.53 0-1.04.21-1.42.59L2.59 12.41c-.78.78-.78 2.05 0 2.83l7.17 7.17c.38.38.89.59 1.42.59H21c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H12l-7-7 7-7h9v14zm-8.5-7L15 8.5l1.41 1.41L13.91 12.5l2.5 2.59L15 16.5z"/></svg>
        </button>
        <button class="rf-numpad-submit" :disabled="loading" @click="handleSubmit">
          {{ loading ? '...' : '确认' }}
        </button>
      </div>
    </template>

    <!-- Account picker modal -->
    <Teleport to="body">
      <div v-if="showAccountPicker" class="pk-overlay" @click="showAccountPicker = false">
        <div class="pk-account" @click.stop>
          <div class="pk-account-header">选择账户</div>
          <div class="pk-account-list">
            <button
              v-for="acct in accounts"
              :key="acct.accountId"
              :class="['pk-account-item', { active: form.accountId === acct.accountId }]"
              @click="selectAccount(acct.accountId)"
            >
              <span class="pk-account-icon">
                <AccountIcon :icon="acct.icon || ''" :size="24" />
              </span>
              <div class="pk-account-info">
                <span class="pk-account-name">{{ acct.name }}</span>
                <span class="pk-account-balance">{{ formatMoney(acct.balance) }}</span>
              </div>
              <svg v-if="form.accountId === acct.accountId" viewBox="0 0 24 24" fill="var(--accent)" width="20" height="20"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Calendar picker modal -->
    <Teleport to="body">
      <div v-if="showCalendar" class="pk-overlay" @click="showCalendar = false">
        <div class="pk-calendar" @click.stop>
          <div class="pk-cal-header">
            <button class="pk-cal-arrow" @click="prevMonth">
              <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/></svg>
            </button>
            <span class="pk-cal-title">{{ calTitle }}</span>
            <button class="pk-cal-arrow" @click="nextMonth">
              <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12z"/></svg>
            </button>
          </div>
          <div class="pk-cal-weekdays">
            <span v-for="wd in weekdays" :key="wd" class="pk-cal-wd">{{ wd }}</span>
          </div>
          <div class="pk-cal-grid">
            <button
              v-for="(cell, idx) in calDays"
              :key="idx"
              :class="['pk-cal-day', { selected: cell.dateStr === form.recordDate, today: cell.inMonth && cell.dateStr === getLocalDateString() }]"
              :disabled="!cell.inMonth"
              @click="selectCalDay(cell)"
            >{{ cell.day }}</button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Time picker modal -->
    <Teleport to="body">
      <div v-if="showTimePicker" class="pk-overlay" @click="showTimePicker = false">
        <div class="pk-clock" @click.stop>
          <div class="pk-clock-display">
            <input
              :class="['pk-clock-input', { active: tpPhase === 'hour' }]"
              :value="String(tpHour).padStart(2, '0')"
              type="tel" maxlength="2"
              inputmode="numeric"
              @focus="tpPhase = 'hour'; ($event.target as HTMLInputElement).select()"
              @input="const v = ($event.target as HTMLInputElement).value.replace(/\D/g, '').slice(0, 2); tpHour = Math.min(23, Math.max(0, parseInt(v) || 0))"
              @wheel="tpHour = Math.min(23, Math.max(0, tpHour + (($event as WheelEvent).deltaY < 0 ? 1 : -1)))"
            />
            <span class="pk-clock-display-colon">:</span>
            <input
              :class="['pk-clock-input', { active: tpPhase === 'minute' }]"
              :value="String(tpMinute).padStart(2, '0')"
              type="tel" maxlength="2"
              inputmode="numeric"
              @focus="tpPhase = 'minute'; ($event.target as HTMLInputElement).select()"
              @input="const v = ($event.target as HTMLInputElement).value.replace(/\D/g, '').slice(0, 2); tpMinute = Math.min(59, Math.max(0, parseInt(v) || 0))"
              @wheel="tpMinute = Math.min(59, Math.max(0, tpMinute + (($event as WheelEvent).deltaY < 0 ? 5 : -5)))"
            />
          </div>
          <div class="pk-clock-dial">
            <div class="pk-clock-hand" :style="{ transform: `rotate(${clockHandAngle()}deg)`, width: handWidth() }">
              <div class="pk-clock-hand-line" />
            </div>
            <template v-if="tpPhase === 'hour'">
              <button v-for="(h, i) in innerHours" :key="'ih'+h"
                :class="['pk-clock-num', 'pk-clock-inner', { selected: tpHour === h }]"
                :style="clockPos(i, 72, 36)"
                @click="selectHour(h)"
              >{{ h }}</button>
              <button v-for="(h, i) in outerHours" :key="'oh'+h"
                :class="['pk-clock-num', 'pk-clock-outer', { selected: tpHour === h }]"
                :style="clockPos(i, 112, 32)"
                @click="selectHour(h)"
              >{{ h }}</button>
            </template>
            <template v-else>
              <button v-for="(m, i) in clockMinutes" :key="'m'+m"
                :class="['pk-clock-num', { selected: tpMinute === m }]"
                :style="clockPos(i, 100, 36)"
                @click="selectMinute(m)"
              >{{ m === 0 ? '00' : m }}</button>
            </template>
            <div class="pk-clock-center-dot" />
          </div>
          <div class="pk-clock-actions">
            <button class="pk-clock-cancel" @click="showTimePicker = false">取消</button>
            <button class="pk-clock-ok" @click="confirmTime">确定</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.record-form {
  display: flex;
  flex-direction: column;
  height: 100%;
  max-width: 600px;
  margin: 0 auto;
  background: var(--bg);
}
.record-form-native {
  max-width: 100%;
  padding: 0;
  padding-top: 28px;
}

/* --- Header --- */
.rf-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px 6px;
  flex-shrink: 0;
}
.record-form-native .rf-header { padding: 8px 16px 4px; }
.rf-back {
  width: 36px; height: 36px; border-radius: 10px; border: none;
  background: var(--card-bg); color: var(--text-primary);
  cursor: pointer; display: flex; align-items: center; justify-content: center;
}
.record-form-native .rf-back { width: 34px; height: 34px; }
.rf-title { font-size: 17px; font-weight: 600; color: var(--text-primary); }
.record-form-native .rf-title { font-size: 16px; }

/* --- Type --- */
.rf-type {
  display: flex; gap: 10px; padding: 0 24px 0; flex-shrink: 0;
}
.record-form-native .rf-type { gap: 10px; padding: 4px 16px 0; }
.rf-type-btn {
  flex: 1; padding: 10px; border-radius: 10px; border: 1px solid var(--border);
  background: #fff; font-size: 14px; font-weight: 600; font-family: inherit;
  cursor: pointer; display: flex; align-items: center; justify-content: center;
  gap: 6px; color: var(--text-secondary); transition: all 0.15s;
}
.record-form-native .rf-type-btn { padding: 9px; font-size: 14px; }
.rf-type-btn:first-child.active { border-color: var(--expense); color: var(--expense); background: var(--expense-bg); }
.rf-type-btn:last-child.active { border-color: var(--income); color: var(--income); background: var(--income-bg); }

/* --- Categories --- */
.rf-categories {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  padding: 10px 24px;
  flex-shrink: 0;
}
.record-form-native .rf-categories { gap: 6px; padding: 8px 16px; }
.rf-cat-item {
  display: flex; flex-direction: column; align-items: center; gap: 4px;
  padding: 8px 2px; border-radius: 10px; border: 1px solid transparent;
  background: var(--card-bg); cursor: pointer; transition: all 0.15s;
  font-family: inherit; font-size: 12px; color: var(--text-secondary);
  min-width: 0;
}
.record-form-native .rf-cat-item { padding: 6px 2px; font-size: 12px; }
.rf-cat-item:active { transform: scale(0.95); }
.rf-cat-item.active { border-color: var(--accent); background: var(--accent-bg); color: var(--accent); font-weight: 600; }

/* --- Amount --- */
.rf-amount-row {
  display: flex; align-items: center; justify-content: center; gap: 8px;
  padding: 10px 24px 4px; flex-shrink: 0;
}
.record-form-native .rf-amount-row { padding: 6px 16px 2px; }
.rf-amount-symbol { font-size: 28px; font-weight: 600; color: var(--text-primary); }
.record-form-native .rf-amount-symbol { font-size: 24px; }
.rf-amount-input {
  font-size: 42px; font-weight: 700; border: none; outline: none; width: 240px;
  text-align: right; font-family: inherit; color: var(--text-primary);
  background: transparent; font-variant-numeric: tabular-nums;
}
.rf-amount-input::placeholder { color: var(--text-hint); }
.rf-amount-input::-webkit-outer-spin-button,
.rf-amount-input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
.rf-amount-input[type=number] { -moz-appearance: textfield; }

.rf-amount-display {
  font-size: 32px; font-weight: 700; color: var(--text-primary);
  font-family: inherit; font-variant-numeric: tabular-nums;
  min-width: 120px; text-align: right; cursor: text;
}

/* --- Meta row --- */
.rf-meta-row {
  display: flex; gap: 8px; padding: 6px 24px; flex-shrink: 0;
  align-items: center;
}
.record-form-native .rf-meta-row { gap: 6px; padding: 6px 16px; }
.rf-meta-item {
  display: flex; align-items: center; gap: 6px;
  padding: 8px 10px; border-radius: 10px; border: 1px solid var(--border-light);
  background: var(--card-bg); font-size: 13px; font-weight: 500;
  color: var(--text-secondary); cursor: pointer; font-family: inherit;
  white-space: nowrap; transition: all 0.15s;
}
.record-form-native .rf-meta-item { padding: 7px 9px; font-size: 12px; }
.rf-meta-item svg { width: 14px; height: 14px; flex-shrink: 0; }
.rf-meta-date { min-width: 0; }
.rf-meta-input {
  flex: 1; min-width: 0; padding: 8px 10px; border-radius: 10px;
  border: 1px solid var(--border-light); background: var(--card-bg);
  font-size: 13px; font-family: inherit; color: var(--text-primary);
  outline: none;
}
.record-form-native .rf-meta-input { padding: 7px 9px; font-size: 12px; }
.rf-meta-input::placeholder { color: var(--text-hint); }

/* --- Spacer & Submit (web) --- */
.rf-spacer { flex: 1; min-height: 8px; }
.rf-submit {
  margin: 12px 24px 24px; padding: 16px; border-radius: 14px; border: none;
  background: linear-gradient(135deg, var(--accent), var(--accent-purple));
  color: #fff; font-size: 17px; font-weight: 600; font-family: inherit;
  cursor: pointer; transition: all 0.2s; flex-shrink: 0;
}
.rf-submit:active { transform: scale(0.97); }
.rf-submit:disabled { opacity: 0.5; cursor: not-allowed; }

/* --- Numpad (native) --- */
.rf-numpad {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  padding: 4px 16px 16px;
  flex-shrink: 0;
}
.record-form-native .rf-numpad { margin-top: 8px; }

.rf-meta-spacer { flex: 1; min-height: 4px; }

.rf-native-gap { height: 10px; flex-shrink: 0; }
.rf-numpad-key {
  padding: 12px 0; border-radius: 10px; border: none;
  background: var(--card-bg); font-size: 20px; font-weight: 600;
  font-family: inherit; color: var(--text-primary); cursor: pointer;
  transition: all 0.1s; display: flex; align-items: center; justify-content: center;
}
.rf-numpad-key:active { background: var(--border); transform: scale(0.95); }
.rf-numpad-dot { font-size: 20px; }
.rf-numpad-del { color: var(--text-secondary); }
.rf-numpad-submit {
  grid-column: 1 / -1;
  padding: 10px; border-radius: 10px; border: none;
  background: linear-gradient(135deg, var(--accent), var(--accent-purple));
  color: #fff; font-size: 15px; font-weight: 600; font-family: inherit;
  cursor: pointer; transition: all 0.15s;
}
.rf-numpad-submit:active { transform: scale(0.97); }
.rf-numpad-submit:disabled { opacity: 0.5; cursor: not-allowed; }

/* --- Overlay --- */
.pk-overlay {
  position: fixed; inset: 0; z-index: 2000;
  background: rgba(0,0,0,0.4); display: flex; align-items: center;
  justify-content: center; backdrop-filter: blur(2px);
}

/* --- Calendar --- */
.pk-calendar {
  width: 340px; background: var(--card-bg); border-radius: 20px;
  padding: 20px; box-shadow: 0 20px 60px rgba(0,0,0,0.25);
}
.pk-cal-header {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 16px;
}
.pk-cal-arrow {
  width: 36px; height: 36px; border-radius: 10px; border: none;
  background: var(--bg); color: var(--text-primary);
  cursor: pointer; display: flex; align-items: center; justify-content: center;
  transition: background 0.15s;
}
.pk-cal-arrow:active { background: var(--border); }
.pk-cal-title { font-size: 17px; font-weight: 700; color: var(--text-primary); }
.pk-cal-weekdays {
  display: grid; grid-template-columns: repeat(7, 1fr); gap: 2px;
  margin-bottom: 6px; padding: 0 2px;
}
.pk-cal-wd {
  text-align: center; font-size: 12px; color: var(--text-hint);
  font-weight: 500; padding: 4px 0;
}
.pk-cal-grid {
  display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px;
}
.pk-cal-day {
  aspect-ratio: 1; border-radius: 10px; border: none;
  background: transparent; font-size: 14px; font-family: inherit;
  color: var(--text-primary); cursor: pointer; transition: all 0.12s;
  display: flex; align-items: center; justify-content: center;
}
.pk-cal-day:disabled { color: var(--text-hint); opacity: 0.4; cursor: default; }
.pk-cal-day:not(:disabled):active { transform: scale(0.9); }
.pk-cal-day.today { font-weight: 700; color: var(--accent); }
.pk-cal-day.selected {
  background: var(--accent); color: #fff; font-weight: 600;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
}

/* --- Clock time picker --- */
.pk-clock {
  width: 300px; background: var(--card-bg); border-radius: 20px;
  padding: 24px 20px 20px; box-shadow: 0 20px 60px rgba(0,0,0,0.25);
}
.pk-clock-display {
  display: flex; align-items: center; justify-content: center; gap: 4px;
  margin-bottom: 16px;
}
.pk-clock-input {
  font-size: 42px; font-weight: 700; color: var(--text-hint);
  background: none; border: none; border-bottom: 2px solid transparent;
  outline: none; font-family: inherit; text-align: center;
  padding: 2px 8px; width: 80px; border-radius: 0;
  font-variant-numeric: tabular-nums;
  transition: color 0.2s, border-color 0.2s;
  -moz-appearance: textfield; appearance: textfield;
}
.pk-clock-input::-webkit-outer-spin-button,
.pk-clock-input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
.pk-clock-input.active { color: var(--accent); border-bottom-color: var(--accent); }
.pk-clock-display-colon {
  font-size: 38px; font-weight: 700; color: var(--text-primary);
  margin: 0 2px;
}

.pk-clock-dial {
  position: relative; width: 260px; height: 260px;
  margin: 0 auto 16px; border-radius: 50%;
  background: var(--bg);
}
.pk-clock-num {
  position: absolute; width: 36px; height: 36px; border-radius: 50%;
  border: none; background: transparent; font-size: 14px; font-weight: 600;
  font-family: inherit; color: var(--text-primary); cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: all 0.15s; z-index: 2; font-variant-numeric: tabular-nums;
}
.pk-clock-num.selected {
  background: var(--accent); color: #fff; z-index: 3;
}
.pk-clock-inner {
  width: 34px; height: 34px; font-size: 13px; color: var(--text-secondary);
}
.pk-clock-inner.selected { color: #fff; }
.pk-clock-outer {
  font-size: 13px;
}

.pk-clock-hand {
  position: absolute; left: 50%; bottom: 50%;
  width: 50%; height: 2px; transform-origin: left center;
  z-index: 1; pointer-events: none; transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}
.pk-clock-hand-line {
  width: 100%; height: 2px; background: var(--accent);
  border-radius: 1px;
}

.pk-clock-center-dot {
  position: absolute; left: 50%; top: 50%;
  width: 8px; height: 8px; border-radius: 50%;
  background: var(--accent); transform: translate(-50%, -50%); z-index: 5;
}

.pk-clock-actions {
  display: flex; justify-content: flex-end; gap: 12px;
}
.pk-clock-cancel {
  padding: 10px 24px; border-radius: 12px; border: none;
  background: var(--bg); color: var(--text-secondary); font-size: 15px;
  font-weight: 600; font-family: inherit; cursor: pointer; transition: all 0.15s;
}
.pk-clock-cancel:active { transform: scale(0.96); }
.pk-clock-ok {
  padding: 10px 24px; border-radius: 12px; border: none;
  background: var(--accent); color: #fff; font-size: 15px;
  font-weight: 600; font-family: inherit; cursor: pointer; transition: all 0.15s;
}
.pk-clock-ok:active { transform: scale(0.96); }

/* --- Account picker --- */
.pk-account {
  width: 340px; max-height: 70vh; background: var(--card-bg); border-radius: 20px;
  padding: 20px; box-shadow: 0 20px 60px rgba(0,0,0,0.25); overflow-y: auto;
}
.pk-account-header {
  font-size: 17px; font-weight: 700; color: var(--text-primary);
  text-align: center; margin-bottom: 16px;
}
.pk-account-list { display: flex; flex-direction: column; gap: 8px; }
.pk-account-item {
  display: flex; align-items: center; gap: 14px; padding: 14px;
  border-radius: 14px; border: 1.5px solid var(--border-light);
  background: var(--bg); font-family: inherit; cursor: pointer; transition: all 0.15s;
  color: var(--text-primary);
}
.pk-account-item:active { transform: scale(0.97); }
.pk-account-item.active { border-color: var(--accent); background: var(--accent-bg); }
.pk-account-icon {
  width: 40px; height: 40px; border-radius: 12px; display: flex;
  align-items: center; justify-content: center; flex-shrink: 0;
  background: var(--accent-bg); color: var(--accent);
}
.pk-account-info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
.pk-account-name { font-size: 15px; font-weight: 600; }
.pk-account-balance { font-size: 13px; color: var(--text-secondary); font-variant-numeric: tabular-nums; }
</style>