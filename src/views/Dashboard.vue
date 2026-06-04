<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getAccounts } from '@/api/account'
import { getRecords } from '@/api/record'
import { getStatistics } from '@/api/record'
import type { Account, RecordItem, Statistics } from '@/types'

const router = useRouter()

const accounts = ref<Account[]>([])
const recentRecords = ref<RecordItem[]>([])
const stats = ref<Statistics | null>(null)
const loading = ref(true)

function formatMoney(val: number) {
  const prefix = val >= 0 ? '' : '-'
  return prefix + '¥' + Math.abs(val).toLocaleString('zh-CN', { minimumFractionDigits: 2 })
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  const month = d.getMonth() + 1
  const day = d.getDate()
  const hours = String(d.getHours()).padStart(2, '0')
  const mins = String(d.getMinutes()).padStart(2, '0')
  return `${month}月${day}日 ${hours}:${mins}`
}

onMounted(async () => {
  try {
    const now = new Date()
    const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
    const today = now.toISOString().slice(0, 10)

    const [acctRes, recRes, statRes] = await Promise.all([
      getAccounts(),
      getRecords({ page: 1, size: 5 }),
      getStatistics(monthStart, today),
    ])
    accounts.value = acctRes.data.data
    recentRecords.value = recRes.data.data.content
    stats.value = statRes.data.data
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="dashboard">
    <div class="stat-grid">
      <div class="stat-card gradient-income">
        <div class="stat-icon">
          <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
        </div>
        <div class="stat-content">
          <div class="stat-label">本月收入</div>
          <div class="stat-value">{{ stats ? formatMoney(stats.totalIncome) : '—' }}</div>
        </div>
      </div>

      <div class="stat-card gradient-expense">
        <div class="stat-icon">
          <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
        </div>
        <div class="stat-content">
          <div class="stat-label">本月支出</div>
          <div class="stat-value">{{ stats ? formatMoney(stats.totalExpense) : '—' }}</div>
        </div>
      </div>

      <div class="stat-card gradient-balance">
        <div class="stat-icon">
          <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
            <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>
          </svg>
        </div>
        <div class="stat-content">
          <div class="stat-label">结余</div>
          <div class="stat-value">
            {{ stats ? formatMoney(stats.totalIncome - stats.totalExpense) : '—' }}
          </div>
        </div>
      </div>
    </div>

    <div class="content-grid">
      <div class="section-card">
        <div class="section-header">
          <h3>账户概览</h3>
          <button class="section-more" @click="router.push('/accounts')">查看全部</button>
        </div>
        <div class="section-body">
          <div v-if="accounts.length === 0" class="empty-state">暂无账户</div>
          <div
            v-for="acct in accounts"
            :key="acct.accountId"
            class="account-row"
          >
            <div class="account-info">
              <div class="account-dot" :style="{ background: ['#6366f1','#10b981','#f59e0b','#ef4444'][acct.accountId % 4] }" />
              <span class="account-name">{{ acct.name }}</span>
            </div>
            <span class="account-balance">{{ formatMoney(acct.balance) }}</span>
          </div>
        </div>
      </div>

      <div class="section-card">
        <div class="section-header">
          <h3>最近记录</h3>
          <button class="section-more" @click="router.push('/records')">查看全部</button>
        </div>
        <div class="section-body">
          <div v-if="recentRecords.length === 0" class="empty-state">暂无记录</div>
          <div
            v-for="record in recentRecords"
            :key="record.recordId"
            class="record-row"
          >
            <div class="record-left">
              <div :class="['record-type-badge', record.type]">
                <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
                  <path v-if="record.type === 'expense'" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                  <path v-else d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
              </div>
              <div class="record-meta">
                <span class="record-category">{{ record.categoryName }}</span>
                <span class="record-time">{{ formatDate(record.recordTime) }}</span>
              </div>
            </div>
            <span :class="['record-amount', record.type]">
              {{ record.type === 'expense' ? '-' : '+' }}{{ formatMoney(record.amount) }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dashboard {
  max-width: 900px;
  margin: 0 auto;
}

.stat-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  padding: 20px;
  border-radius: 16px;
  color: #fff;
  display: flex;
  align-items: center;
  gap: 16px;
  position: relative;
  overflow: hidden;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 24px rgba(0,0,0,0.15);
}

.stat-card::before {
  content: '';
  position: absolute;
  top: -50%;
  right: -50%;
  width: 100%;
  height: 100%;
  background: rgba(255,255,255,0.1);
  border-radius: 50%;
  transform: scale(0);
  transition: transform 0.4s ease;
}

.stat-card:hover::before {
  transform: scale(1);
}

.gradient-income {
  background: linear-gradient(135deg, #10b981 0%, #34d399 100%);
}

.gradient-expense {
  background: linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%);
}

.gradient-balance {
  background: linear-gradient(135deg, #6366f1 0%, #818cf8 100%);
}

.stat-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: rgba(255,255,255,0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  backdrop-filter: blur(4px);
}

.stat-content {
  flex: 1;
}

.stat-label {
  font-size: 13px;
  opacity: 0.85;
  font-weight: 500;
  margin-bottom: 4px;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  letter-spacing: -0.5px;
}

.content-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.section-card {
  background: var(--card-bg);
  border-radius: var(--card-radius);
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
  overflow: hidden;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-light);
}

.section-header h3 {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
}

.section-more {
  background: none;
  border: none;
  font-size: 13px;
  color: var(--accent);
  cursor: pointer;
  font-weight: 500;
  transition: opacity 0.2s;
}

.section-more:hover {
  opacity: 0.7;
}

.section-body {
  padding: 4px 0;
}

.account-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
  transition: background 0.15s;
  cursor: pointer;
}

.account-row:hover {
  background: #f8f9fc;
}

.account-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.account-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.account-name {
  font-size: 14px;
  color: var(--text-primary);
  font-weight: 500;
}

.account-balance {
  font-weight: 600;
  color: var(--text-primary);
  font-size: 15px;
}

.record-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 20px;
  transition: background 0.15s;
  cursor: pointer;
}

.record-row:hover {
  background: #f8f9fc;
}

.record-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.record-type-badge {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.record-type-badge.expense {
  background: #fef2f2;
  color: var(--expense);
}

.record-type-badge.income {
  background: #ecfdf5;
  color: var(--income);
}

.record-meta {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.record-category {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
}

.record-time {
  font-size: 12px;
  color: var(--text-secondary);
}

.record-amount {
  font-weight: 600;
  font-size: 15px;
}

.record-amount.expense {
  color: var(--expense);
}

.record-amount.income {
  color: var(--income);
}

.empty-state {
  text-align: center;
  color: var(--text-secondary);
  padding: 32px;
  font-size: 14px;
}
</style>
