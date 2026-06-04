<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getAccounts } from '@/api/account'
import { getRecords } from '@/api/record'
import { getStatistics } from '@/api/record'
import type { Account, RecordItem, Statistics } from '@/types'
import { ElSkeleton } from 'element-plus'

const router = useRouter()

const accounts = ref<Account[]>([])
const recentRecords = ref<RecordItem[]>([])
const stats = ref<Statistics | null>(null)
const loading = ref(true)

function formatMoney(val: number) {
  return '¥' + val.toLocaleString('zh-CN', { minimumFractionDigits: 2 })
}

function formatDate(dateStr: string) {
  return dateStr.slice(5, 16)
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
  <div v-if="loading">
    <el-skeleton :rows="5" animated />
  </div>
  <div v-else class="dashboard">
    <div class="stat-row">
      <div class="stat-card income">
        <div class="stat-label">本月收入</div>
        <div class="stat-value">{{ stats ? formatMoney(stats.totalIncome) : '¥0' }}</div>
      </div>
      <div class="stat-card expense">
        <div class="stat-label">本月支出</div>
        <div class="stat-value">{{ stats ? formatMoney(stats.totalExpense) : '¥0' }}</div>
      </div>
      <div class="stat-card balance">
        <div class="stat-label">结余</div>
        <div class="stat-value">
          {{ stats ? formatMoney(stats.totalIncome - stats.totalExpense) : '¥0' }}
        </div>
      </div>
    </div>

    <el-card class="section-card">
      <template #header>
        <div class="card-header">
          <span>账户概览</span>
        </div>
      </template>
      <div v-if="accounts.length === 0" class="empty-text">暂无账户</div>
      <div
        v-for="acct in accounts"
        :key="acct.accountId"
        class="account-item"
      >
        <span class="account-name">{{ acct.name }}</span>
        <span class="account-balance">{{ formatMoney(acct.balance) }}</span>
      </div>
    </el-card>

    <el-card class="section-card">
      <template #header>
        <div class="card-header">
          <span>最近记录</span>
          <el-button text type="primary" @click="router.push('/records')">查看全部</el-button>
        </div>
      </template>
      <div v-if="recentRecords.length === 0" class="empty-text">暂无记录</div>
      <div
        v-for="record in recentRecords"
        :key="record.recordId"
        class="record-item"
      >
        <div class="record-left">
          <span class="record-category">{{ record.categoryName }}</span>
          <span class="record-time">{{ formatDate(record.recordTime) }}</span>
        </div>
        <span :class="['record-amount', record.type]">
          {{ record.type === 'expense' ? '-' : '+' }}{{ formatMoney(record.amount) }}
        </span>
      </div>
    </el-card>
  </div>
</template>

<style scoped>
.dashboard {
  max-width: 800px;
  margin: 0 auto;
}

.stat-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 20px;
}

.stat-card {
  padding: 20px;
  border-radius: 12px;
  color: #fff;
}

.stat-card.income {
  background: linear-gradient(135deg, #43e97b, #38f9d7);
}

.stat-card.expense {
  background: linear-gradient(135deg, #fa709a, #fee140);
}

.stat-card.balance {
  background: linear-gradient(135deg, #667eea, #764ba2);
}

.stat-label {
  font-size: 13px;
  opacity: 0.85;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
}

.section-card {
  margin-bottom: 16px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.account-item {
  display: flex;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
}

.account-item:last-child {
  border-bottom: none;
}

.account-name {
  font-size: 15px;
}

.account-balance {
  font-weight: 600;
  color: #333;
}

.record-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
}

.record-item:last-child {
  border-bottom: none;
}

.record-left {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.record-category {
  font-size: 15px;
}

.record-time {
  font-size: 12px;
  color: #999;
}

.record-amount {
  font-weight: 600;
  font-size: 16px;
}

.record-amount.expense {
  color: #f56c6c;
}

.record-amount.income {
  color: #67c23a;
}

.empty-text {
  text-align: center;
  color: #999;
  padding: 20px;
}
</style>
