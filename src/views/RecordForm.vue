<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { createRecord } from '@/api/record'
import { getCategories } from '@/api/category'
import { getAccounts } from '@/api/account'
import CategoryIcon from '@/components/CategoryIcon.vue'
import type { Category, Account } from '@/types'
import { ElMessage } from 'element-plus'

const router = useRouter()
const categories = ref<Category[]>([])
const accounts = ref<Account[]>([])
const loading = ref(false)

const typeFilter = ref('expense')

const form = ref({
  type: 'expense' as string,
  categoryId: undefined as number | undefined,
  accountId: undefined as number | undefined,
  amount: undefined as string | undefined,
  remark: '',
  recordTime: '',
})

const filteredCategories = ref<Category[]>([])

function filterCategories() {
  filteredCategories.value = categories.value.filter(c => c.type === typeFilter.value)
}

function selectType(type: string) {
  form.value.type = type
  form.value.categoryId = undefined
  typeFilter.value = type
  filterCategories()
}

async function handleSubmit() {
  if (!form.value.categoryId || !form.value.accountId || !form.value.amount) {
    ElMessage.warning('请填写完整信息')
    return
  }

  loading.value = true
  try {
    await createRecord({
      categoryId: form.value.categoryId,
      accountId: form.value.accountId,
      type: form.value.type,
      amount: parseFloat(form.value.amount),
      remark: form.value.remark,
      recordTime: form.value.recordTime ? form.value.recordTime + ':00' : undefined,
    })
    ElMessage.success('记账成功')
    router.push('/records')
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  const [catRes, acctRes] = await Promise.all([getCategories(), getAccounts()])
  categories.value = catRes.data.data
  accounts.value = acctRes.data.data
  filterCategories()
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
      <h2>记一笔</h2>
    </div>

    <div class="type-selector">
      <button
        :class="['type-btn', { active: form.type === 'expense' }]"
        @click="selectType('expense')"
      >
        <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
        </svg>
        支出
      </button>
      <button
        :class="['type-btn', { active: form.type === 'income' }]"
        @click="selectType('income')"
      >
        <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
        </svg>
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
          <div class="account-dot" :style="{ background: ['#6366f1','#10b981','#f59e0b','#ef4444'][acct.accountId % 4] }" />
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

    <button
      class="submit-btn"
      :disabled="loading"
      @click="handleSubmit"
    >
      {{ loading ? '保存中...' : '确认记账' }}
    </button>
  </div>
</template>

<style scoped>
.form-page {
  max-width: 480px;
  margin: 0 auto;
  padding-bottom: 40px;
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
  border: 1px solid #e2e8f0;
  background: #fff;
  color: #64748b;
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
  border: 1px solid #e2e8f0;
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
  color: #64748b;
}

.type-btn.active {
  border-width: 2px;
}

.type-btn:first-child.active {
  border-color: #ef4444;
  color: #ef4444;
  background: #fef2f2;
}

.type-btn:last-child.active {
  border-color: #10b981;
  color: #10b981;
  background: #ecfdf5;
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
  color: #cbd5e1;
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
  background: #f8f9fc;
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
  font-size: 12px;
  color: var(--text-secondary);
}

.category-item:hover {
  background: #f1f5f9;
}

.category-item.active {
  border-color: var(--accent);
  background: #eef2ff;
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
  border: 1px solid #e2e8f0;
  background: #fff;
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
  font-size: 14px;
  color: var(--text-primary);
}

.account-item:hover {
  border-color: #cbd5e1;
}

.account-item.active {
  border-color: var(--accent);
  background: #eef2ff;
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
  border-bottom: 1px solid #e2e8f0;
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
  color: #cbd5e1;
}

.submit-btn {
  width: 100%;
  padding: 14px;
  border-radius: 14px;
  border: none;
  background: linear-gradient(135deg, var(--accent), #a855f7);
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
</style>
