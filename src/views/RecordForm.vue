<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { createRecord, updateRecord } from '@/api/record'
import { getCategories } from '@/api/category'
import { getAccounts } from '@/api/account'
import CategoryIcon from '@/components/CategoryIcon.vue'
import { accountColorList } from '@/utils/colors'
import type { Category, Account, RecordItem } from '@/types'
import { ElMessage } from 'element-plus'
import ClockPicker from '@/components/ClockPicker.vue'
import DatePicker from '@/components/DatePicker.vue'

const router = useRouter()
const route = useRoute()
const isEdit = computed(() => !!route.params.id)
const existingRecord = ref<RecordItem | null>(null)

const categories = ref<Category[]>([])
const accounts = ref<Account[]>([])
const loading = ref(false)
const categorySearch = ref('')

function getDefaultDate() {
  const now = new Date()
  return now.toISOString().slice(0, 10)
}

function getDefaultTime() {
  const now = new Date()
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
}

const typeFilter = ref('expense')

const form = ref({
  type: 'expense' as string,
  categoryId: undefined as number | undefined,
  accountId: undefined as number | undefined,
  amount: undefined as string | undefined,
  remark: '',
  recordDate: getDefaultDate(),
  recordTimeStr: getDefaultTime(),
})

const showDatePicker = ref(false)
const showTimePicker = ref(false)

const filteredCategories = ref<Category[]>([])

function filterCategories() {
  const byType = categories.value.filter(c => c.type === typeFilter.value)
  if (!categorySearch.value) {
    filteredCategories.value = byType
  } else {
    const q = categorySearch.value.toLowerCase()
    filteredCategories.value = byType.filter(c => c.name.toLowerCase().includes(q))
  }
}

function selectType(type: string) {
  form.value.type = type
  form.value.categoryId = undefined
  typeFilter.value = type
  categorySearch.value = ''
  filterCategories()
}

async function handleSubmit() {
  if (!form.value.categoryId || !form.value.accountId || !form.value.amount) {
    ElMessage.warning('请填写完整信息')
    return
  }

  loading.value = true
  try {
    const payload = {
      categoryId: form.value.categoryId,
      accountId: form.value.accountId,
      type: form.value.type,
      amount: parseFloat(form.value.amount),
      remark: form.value.remark,
      recordTime: `${form.value.recordDate} ${form.value.recordTimeStr}:00`,
    }

    if (isEdit.value && existingRecord.value) {
      await updateRecord(existingRecord.value.recordId, payload)
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

onMounted(async () => {
  try {
    const [catRes, acctRes] = await Promise.all([getCategories(), getAccounts()])
    categories.value = catRes.data.data
    accounts.value = acctRes.data.data
    filterCategories()

    if (isEdit.value) {
      const record = window.history.state.record as RecordItem | undefined
      if (record) {
        existingRecord.value = record
        form.value.type = record.type
        form.value.categoryId = record.categoryId
        form.value.accountId = record.accountId
        form.value.amount = String(record.amount)
        form.value.remark = record.remark || ''
        if (record.recordTime) {
          const d = new Date(record.recordTime)
          form.value.recordDate = d.toISOString().slice(0, 10)
          form.value.recordTimeStr = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
        }
        typeFilter.value = record.type
        filterCategories()
      }
    }
  } catch {
    // 401 handled by interceptor redirect
  }
})
</script>

<template>
  <div class="form-page">
    <div class="form-header">
      <button class="back-btn" @click="router.back()">
        <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
          <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
        </svg>
      </button>
      <h2>{{ isEdit ? '编辑记录' : '记一笔' }}</h2>
    </div>

    <div class="type-selector">
      <button
        :class="['type-btn', { active: form.type === 'expense' }]"
        @click="selectType('expense')"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M12 5v14M5 12l7 7 7-7"/></svg>
        支出
      </button>
      <button
        :class="['type-btn', { active: form.type === 'income' }]"
        @click="selectType('income')"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M12 19V5M5 12l7-7 7 7"/></svg>
        收入
      </button>
    </div>

    <div class="amount-section">
      <input
        v-model="form.amount"
        type="number"
        step="0.01"
        placeholder="0.00"
        class="amount-input"
      />
      <span class="amount-unit">元</span>
    </div>

    <div class="form-card">
      <div class="form-label">分类</div>
      <input v-model="categorySearch" placeholder="搜索分类..." class="category-search" @input="filterCategories" />
      <div class="category-grid">
        <button
          v-for="cat in filteredCategories"
          :key="cat.categoryId"
          :class="['category-item', { active: form.categoryId === cat.categoryId }]"
          @click="form.categoryId = cat.categoryId"
        >
          <CategoryIcon :icon="cat.icon" :size="24" />
          <span>{{ cat.name }}</span>
        </button>
      </div>
    </div>

    <div class="form-card">
      <div class="form-label">账户</div>
      <div class="account-list">
        <button
          v-for="acct in accounts"
          :key="acct.accountId"
          :class="['account-item', { active: form.accountId === acct.accountId }]"
          @click="form.accountId = acct.accountId"
        >
          <div class="account-dot" :style="{ background: accountColorList[acct.accountId % 4] }" />
          <span>{{ acct.name }}</span>
        </button>
      </div>
    </div>

    <div class="form-card">
      <div class="form-label">备注</div>
      <input
        v-model="form.remark"
        placeholder="可选备注"
        class="form-input"
      />
    </div>

<div class="form-card">
      <div class="form-label">时间</div>
      <div class="datetime-row">
        <button class="datetime-trigger" @click="showDatePicker = true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          {{ form.recordDate }}
        </button>
        <button class="datetime-trigger" @click="showTimePicker = true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          {{ form.recordTimeStr }}
        </button>
      </div>
    </div>

    <DatePicker v-model="form.recordDate" v-model:visible="showDatePicker" />
    <ClockPicker v-model="form.recordTimeStr" v-model:visible="showTimePicker" />

    <button
      class="submit-btn"
      :disabled="loading"
      @click="handleSubmit"
    >
      {{ loading ? '保存中...' : (isEdit ? '保存修改' : '确认记账') }}
    </button>
  </div>
</template>

<style scoped>
.form-page {
  max-width: 720px;
  margin: 0 auto;
}

.form-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;
}

.form-header h2 {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.back-btn {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  border: 1px solid var(--border);
  background: #fff;
  color: var(--text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.back-btn:hover {
  border-color: var(--accent);
  color: var(--accent);
}

.type-selector {
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
}

.type-btn {
  flex: 1;
  padding: 10px;
  border-radius: 12px;
  border: 1px solid var(--border);
  background: #fff;
  font-size: 14px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  transition: all 0.2s;
  color: var(--text-secondary);
}

.type-btn.active {
  border-width: 2px;
}

.type-btn:first-child.active {
  border-color: var(--expense);
  color: var(--expense);
  background: var(--expense-bg);
}

.type-btn:last-child.active {
  border-color: var(--income);
  color: var(--income);
  background: var(--income-bg);
}

.amount-section {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-bottom: 32px;
}

.amount-input {
  font-size: 48px;
  font-weight: 700;
  border: none;
  outline: none;
  width: 240px;
  text-align: right;
  font-family: inherit;
  color: var(--text-primary);
  background: transparent;
}

.amount-input::placeholder {
  color: var(--text-hint);
}

.amount-unit {
  font-size: 20px;
  color: var(--text-secondary);
  font-weight: 500;
}

.form-card {
  background: #fff;
  border-radius: 16px;
  padding: 16px 18px;
  margin-bottom: 12px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
}

.form-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 12px;
}

.category-search {
  width: 100%;
  padding: 8px 14px;
  border-radius: 10px;
  border: 1px solid var(--border);
  font-size: 13px;
  font-family: inherit;
  outline: none;
  transition: border-color 0.2s;
  background: var(--bg);
  margin-bottom: 10px;
  color: var(--text-primary);
}

.category-search:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-glow);
  background: #fff;
}

.category-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}

.category-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 12px 8px;
  border-radius: 12px;
  border: 1px solid transparent;
  background: var(--bg);
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
  font-size: 12px;
  color: var(--text-secondary);
}

.category-item:hover {
  background: var(--border-light);
}

.category-item.active {
  border-color: var(--accent);
  background: var(--accent-bg);
  color: var(--accent);
  font-weight: 600;
}

.account-list {
  display: flex;
  gap: 8px;
}

.account-item {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  border-radius: 10px;
  border: 1px solid var(--border);
  background: #fff;
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
  font-size: 14px;
  color: var(--text-primary);
}

.account-item:hover {
  border-color: var(--text-hint);
}

.account-item.active {
  border-color: var(--accent);
  background: var(--accent-bg);
  font-weight: 600;
}

.account-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.form-input {
  width: 100%;
  padding: 10px 0;
  border: none;
  border-bottom: 1px solid var(--border);
  outline: none;
  font-size: 14px;
  font-family: inherit;
  color: var(--text-primary);
  transition: border-color 0.2s;
}

.form-input:focus {
  border-color: var(--accent);
}

.form-input::placeholder {
  color: var(--text-hint);
}

.datetime-row {
  display: flex;
  gap: 10px;
}

.datetime-trigger {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  border-radius: 12px;
  border: 1px solid var(--border);
  background: #fff;
  font-family: inherit;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
  cursor: pointer;
  transition: all 0.2s;
  font-variant-numeric: tabular-nums;
}

.datetime-trigger:hover {
  border-color: var(--accent);
  background: var(--accent-bg);
}

.datetime-trigger svg {
  color: var(--accent);
  flex-shrink: 0;
}

.submit-btn {
  width: 100%;
  padding: 14px;
  border-radius: 14px;
  border: none;
  background: linear-gradient(135deg, var(--accent), var(--accent-purple));
  color: #fff;
  font-size: 16px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.2s;
  margin-top: 8px;
}

.submit-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 8px 20px var(--accent-glow);
}

.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .form-page { max-width: 100%; }
  .category-grid { grid-template-columns: repeat(4, 1fr); }
  .amount-input { font-size: 36px; width: 180px; }
  .account-list { flex-wrap: wrap; }
  .account-item { min-width: 0; flex: 1 1 calc(50% - 4px); }
}
</style>
