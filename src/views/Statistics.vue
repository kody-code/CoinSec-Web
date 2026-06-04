<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getStatistics } from '@/api/record'
import type { Statistics } from '@/types'

const stats = ref<Statistics | null>(null)
const loading = ref(false)
const dateRange = ref([
  new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10),
  new Date().toISOString().slice(0, 10),
])

function formatMoney(val: number) {
  return '¥' + val.toLocaleString('zh-CN', { minimumFractionDigits: 2 })
}

function percent(val: number, total: number) {
  if (total === 0) return '0'
  return (val / total * 100).toFixed(1)
}

async function fetchStats() {
  loading.value = true
  try {
    const res = await getStatistics(dateRange.value[0], dateRange.value[1])
    stats.value = res.data.data
  } finally {
    loading.value = false
  }
}

onMounted(fetchStats)
</script>

<template>
  <div class="stats-page">
    <div class="date-nav">
      <input v-model="dateRange[0]" type="date" class="date-input" @change="fetchStats" />
      <span class="date-sep">→</span>
      <input v-model="dateRange[1]" type="date" class="date-input" @change="fetchStats" />
    </div>

    <div class="summary-row">
      <div class="summary-card income">
        <div class="summary-icon">
          <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
        </div>
        <div class="summary-body">
          <div class="summary-label">收入</div>
          <div class="summary-value">{{ stats ? formatMoney(stats.totalIncome) : '—' }}</div>
        </div>
      </div>
      <div class="summary-card expense">
        <div class="summary-icon">
          <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
        </div>
        <div class="summary-body">
          <div class="summary-label">支出</div>
          <div class="summary-value">{{ stats ? formatMoney(stats.totalExpense) : '—' }}</div>
        </div>
      </div>
    </div>

    <div class="stat-section">
      <h3 class="section-title">分类明细</h3>
      <div v-if="!stats?.categoryStats.length" class="empty">暂无数据</div>
      <div v-for="stat in stats?.categoryStats || []" :key="stat.categoryId" class="stat-row">
        <div class="stat-info">
          <span :class="['stat-type-dot', stat.type]" />
          <span class="stat-name">{{ stat.categoryName }}</span>
          <span class="stat-count">{{ stat.count }}笔</span>
        </div>
        <div class="stat-bar-wrap">
          <div class="stat-bar-bg">
            <div
              class="stat-bar-fill"
              :class="stat.type"
              :style="{ width: percent(stat.total, stat.type === 'expense' ? (stats?.totalExpense || 0) : (stats?.totalIncome || 0)) + '%' }"
            />
          </div>
        </div>
        <div class="stat-amount">
          <span class="stat-value">{{ formatMoney(stat.total) }}</span>
          <span class="stat-percent">{{ percent(stat.total, stat.type === 'expense' ? (stats?.totalExpense || 0) : (stats?.totalIncome || 0)) }}%</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.stats-page {
  max-width: 600px;
  margin: 0 auto;
}

.date-nav {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-bottom: 24px;
}

.date-input {
  padding: 8px 14px;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
  background: #fff;
  font-size: 13px;
  font-family: inherit;
  color: #334155;
  outline: none;
  transition: border-color 0.2s;
}

.date-input:focus {
  border-color: var(--accent);
}

.date-sep {
  color: #cbd5e1;
  font-size: 16px;
}

.summary-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 24px;
}

.summary-card {
  padding: 18px;
  border-radius: 16px;
  color: #fff;
  display: flex;
  align-items: center;
  gap: 14px;
}

.summary-card.income {
  background: linear-gradient(135deg, #10b981, #34d399);
}

.summary-card.expense {
  background: linear-gradient(135deg, #f59e0b, #fbbf24);
}

.summary-icon {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  background: rgba(255,255,255,0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.summary-label {
  font-size: 13px;
  opacity: 0.85;
  margin-bottom: 4px;
}

.summary-value {
  font-size: 22px;
  font-weight: 700;
  letter-spacing: -0.5px;
}

.stat-section {
  background: #fff;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
}

.section-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 16px;
}

.empty {
  text-align: center;
  color: var(--text-secondary);
  padding: 32px;
  font-size: 14px;
}

.stat-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 0;
  border-bottom: 1px solid #f1f5f9;
}

.stat-row:last-child {
  border-bottom: none;
}

.stat-info {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 120px;
}

.stat-type-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.stat-type-dot.income { background: #10b981; }
.stat-type-dot.expense { background: #ef4444; }

.stat-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
}

.stat-count {
  font-size: 12px;
  color: var(--text-secondary);
}

.stat-bar-wrap {
  flex: 1;
}

.stat-bar-bg {
  height: 8px;
  background: #f1f5f9;
  border-radius: 4px;
  overflow: hidden;
}

.stat-bar-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.5s ease;
  min-width: 4px;
}

.stat-bar-fill.income { background: #10b981; }
.stat-bar-fill.expense { background: #ef4444; }

.stat-amount {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  min-width: 100px;
}

.stat-value {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.stat-percent {
  font-size: 12px;
  color: var(--text-secondary);
}
</style>
