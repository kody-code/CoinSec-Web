<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getAccounts } from '@/api/account'
import { getRecords, getStatistics } from '@/api/record'
import AccountIcon from '@/components/AccountIcon.vue'
import EmptyState from '@/components/EmptyState.vue'
import LoadingSkeleton from '@/components/LoadingSkeleton.vue'
import { formatMoney, formatDate, getLocalDateString } from '@/utils/format'
import type { Account, RecordItem, Statistics } from '@/types'

const route = useRoute()
const router = useRouter()
const accountId = computed(() => Number(route.params.id))

const account = ref<Account | null>(null)
const stats = ref<Statistics | null>(null)
const records = ref<RecordItem[]>([])
const loading = ref(false)
const recordsLoading = ref(false)

const now = new Date()
const thisMonthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
const today = getLocalDateString(now)

async function loadAccount() {
  try {
    const res = await getAccounts()
    account.value = res.data.data.find((a: Account) => a.accountId === accountId.value) || null
  } catch { /* 401 */ }
}

async function loadStats() {
  try {
    const res = await getStatistics(thisMonthStart, today, accountId.value)
    stats.value = res.data.data
  } catch { /* 401 */ }
}

async function loadRecords() {
  recordsLoading.value = true
  try {
    const res = await getRecords({ page: 1, size: 10, accountId: accountId.value })
    records.value = res.data.data.content
  } finally {
    recordsLoading.value = false
  }
}

onMounted(async () => {
  loading.value = true
  await Promise.all([loadAccount(), loadStats(), loadRecords()])
  loading.value = false
})
</script>

<template>
  <div class="detail-page">
    <div class="detail-header">
      <button class="back-btn" @click="router.push('/accounts')">
        <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>
      </button>
      <div class="header-info" v-if="account">
        <AccountIcon :icon="account.icon || 'wallet'" :size="40" />
        <div class="header-text">
          <h2>{{ account.name }}</h2>
          <span class="header-balance">{{ formatMoney(account.balance) }}</span>
        </div>
      </div>
      <LoadingSkeleton v-else-if="loading" />
    </div>

    <div class="stats-row" v-if="stats">
      <div class="stat-card income">
        <span class="stat-label">本月收入</span>
        <span class="stat-value">{{ formatMoney(stats.totalIncome) }}</span>
      </div>
      <div class="stat-card expense">
        <span class="stat-label">本月支出</span>
        <span class="stat-value">{{ formatMoney(stats.totalExpense) }}</span>
      </div>
    </div>

    <div class="section">
      <h3 class="section-title">最近记录</h3>
      <div class="records-list" v-loading="recordsLoading">
        <EmptyState v-if="records.length === 0 && !recordsLoading" text="该账户暂无记录" />
        <div v-for="record in records" :key="record.recordId" class="record-card">
          <div class="record-icon" :class="record.type">
            <span class="record-dot" />
          </div>
          <div class="record-body">
            <div class="record-top">
              <span class="record-category">{{ record.categoryName }}</span>
              <span :class="['record-amount', record.type]">
                {{ record.type === 'expense' ? '-' : '+' }}{{ formatMoney(record.amount) }}
              </span>
            </div>
            <div class="record-bottom">
              <span class="record-meta">{{ formatDate(record.recordTime) }}</span>
              <span v-if="record.remark" class="record-remark">{{ record.remark }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.detail-page {
  max-width: 720px;
  margin: 0 auto;
}

.detail-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
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
  flex-shrink: 0;
}

.back-btn:hover {
  border-color: var(--accent);
  color: var(--accent);
}

.header-info {
  display: flex;
  align-items: center;
  gap: 14px;
}

.header-text h2 {
  font-size: 20px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.header-balance {
  font-size: 14px;
  color: var(--text-secondary);
}

.stats-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 24px;
}

.stat-card {
  background: #fff;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.stat-label {
  font-size: 13px;
  color: var(--text-secondary);
  font-weight: 500;
}

.stat-value {
  font-size: 22px;
  font-weight: 700;
}

.stat-card.income .stat-value { color: var(--income); }
.stat-card.expense .stat-value { color: var(--expense); }

.section {
  margin-bottom: 24px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 12px;
}

.records-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.record-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 18px;
  background: #fff;
  border-radius: 14px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
  transition: all 0.2s;
}

.record-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.record-icon.expense {
  background: var(--expense-bg);
  color: var(--expense);
}

.record-icon.income {
  background: var(--income-bg);
  color: var(--income);
}

.record-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.record-icon.expense .record-dot { background: var(--expense); }
.record-icon.income .record-dot { background: var(--income); }

.record-body {
  flex: 1;
  min-width: 0;
}

.record-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.record-category {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.record-amount {
  font-weight: 700;
  font-size: 15px;
  letter-spacing: -0.3px;
}

.record-amount.expense { color: var(--expense); }
.record-amount.income { color: var(--income); }

.record-bottom {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.record-meta {
  font-size: 12px;
  color: var(--text-secondary);
}

.record-remark {
  font-size: 12px;
  color: var(--text-secondary);
  max-width: 160px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>