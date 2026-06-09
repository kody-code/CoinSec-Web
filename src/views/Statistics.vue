<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { getStatistics } from '@/api/record'
import { formatMoney, getLocalDateString } from '@/utils/format'
import { colors } from '@/utils/colors'
import StatCard from '@/components/StatCard.vue'
import LoadingSkeleton from '@/components/LoadingSkeleton.vue'
import EmptyState from '@/components/EmptyState.vue'
import type { Statistics } from '@/types'
import { Doughnut, Bar } from 'vue-chartjs'
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
} from 'chart.js'

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement)

const stats = ref<Statistics | null>(null)
const loading = ref(false)

const today = new Date()
const monthStart = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`
const todayStr = getLocalDateString(today)

const dateRange = ref([monthStart, todayStr])

const presets = [
  { label: '本月', get: () => {
    const d = new Date()
    const s = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
    return [s, getLocalDateString(d)]
  }},
  { label: '上月', get: () => {
    const d = new Date()
    d.setMonth(d.getMonth() - 1)
    const s = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
    const e = getLocalDateString(new Date(d.getFullYear(), d.getMonth() + 1, 0))
    return [s, e]
  }},
  { label: '近3月', get: () => {
    const d = new Date()
    d.setMonth(d.getMonth() - 2)
    const s = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
    return [s, getLocalDateString()]
  }},
  { label: '今年', get: () => {
    const y = new Date().getFullYear()
    return [`${y}-01-01`, getLocalDateString()]
  }},
]

function setPreset(preset: typeof presets[0]) {
  const [s, e] = preset.get()
  dateRange.value = [s, e]
}

const donutData = computed(() => {
  if (!stats.value) return null
  const income = stats.value.totalIncome
  const expense = stats.value.totalExpense
  return {
    labels: ['收入', '支出'],
    datasets: [{
      data: [income, expense],
      backgroundColor: [colors.income, colors.expense],
      borderWidth: 0,
      hoverOffset: 8,
    }],
  }
})

const donutOptions = {
  cutout: '72%',
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: {
        label: (ctx: any) => `${ctx.label}: ${formatMoney(ctx.raw)}`,
      },
    },
  },
  responsive: true,
  maintainAspectRatio: false,
}

const barData = computed(() => {
  if (!stats.value?.categoryStats?.length) return null
  const sorted = [...stats.value.categoryStats].sort((a, b) => b.total - a.total)
  const top = sorted.slice(0, 8)
  return {
    labels: top.map(c => c.categoryName),
    datasets: [{
      label: '金额',
      data: top.map(c => c.total),
      backgroundColor: top.map(c => c.type === 'expense' ? colors.expense : colors.income),
      borderRadius: 6,
      borderSkipped: false,
    }],
  }
})

const barOptions = {
  indexAxis: 'y' as const,
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: {
        label: (ctx: any) => formatMoney(ctx.raw),
      },
    },
  },
  scales: {
    x: {
      grid: { display: false },
      ticks: {
        callback: (v: any) => formatMoney(v),
        font: { size: 11 },
      },
    },
    y: {
      grid: { display: false },
      ticks: { font: { size: 12 } },
    },
  },
  responsive: true,
  maintainAspectRatio: false,
}

async function fetchStats() {
  loading.value = true
  try {
    const res = await getStatistics(dateRange.value[0], dateRange.value[1])
    stats.value = res.data.data
  } catch {
    // 401 handled by interceptor redirect
  } finally {
    loading.value = false
  }
}

function applyDate() {
  fetchStats()
}

onMounted(fetchStats)
</script>

<template>
  <div class="stats-page">
    <div class="date-section">
      <div class="presets">
        <button
          v-for="p in presets"
          :key="p.label"
          class="preset-btn"
          :class="{ active: dateRange[0] === p.get()[0] && dateRange[1] === p.get()[1] }"
          @click="setPreset(p); applyDate()"
        >
          {{ p.label }}
        </button>
      </div>
      <div class="date-pickers">
        <input v-model="dateRange[0]" type="date" class="date-input" @change="applyDate" />
        <span class="date-sep">→</span>
        <input v-model="dateRange[1]" type="date" class="date-input" @change="applyDate" />
      </div>
    </div>

    <div v-if="loading" class="loading-wrap">
      <LoadingSkeleton :rows="1" />
    </div>

    <template v-else-if="stats">
      <div class="summary-row">
        <StatCard label="收入" :value="formatMoney(stats.totalIncome)" icon="up" variant="income" />
        <StatCard label="支出" :value="formatMoney(stats.totalExpense)" icon="down" variant="expense" />
        <StatCard label="结余" :value="formatMoney(stats.totalIncome - stats.totalExpense)" icon="balance" variant="balance" />
      </div>

      <div class="chart-grid">
        <div class="card">
          <h3 class="card-title">收支占比</h3>
          <div class="donut-wrapper">
            <div v-if="donutData" class="donut-container">
              <Doughnut :data="donutData" :options="donutOptions" />
              <div class="donut-center">
                <span class="donut-center-label">总收支</span>
                <span class="donut-center-value">{{ formatMoney(stats.totalIncome + stats.totalExpense) }}</span>
              </div>
            </div>
            <div class="donut-legend">
              <div class="legend-item">
                <span class="legend-dot income" />
                <span>收入</span>
                <span class="legend-val">{{ formatMoney(stats.totalIncome) }}</span>
              </div>
              <div class="legend-item">
                <span class="legend-dot expense" />
                <span>支出</span>
                <span class="legend-val">{{ formatMoney(stats.totalExpense) }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="card">
          <h3 class="card-title">分类排行</h3>
          <div class="bar-wrapper">
            <div v-if="barData" class="bar-container">
              <Bar :data="barData" :options="barOptions" />
            </div>
            <EmptyState v-else text="暂无分类数据" icon="category" />
          </div>
        </div>
      </div>

      <div class="card">
        <h3 class="card-title">分类明细</h3>
        <EmptyState v-if="!stats.categoryStats?.length" text="暂无数据" />
        <div v-for="cat in stats.categoryStats" :key="cat.categoryId" class="detail-row">
          <div class="detail-left">
            <span :class="['detail-dot', cat.type]" />
            <span class="detail-name">{{ cat.categoryName }}</span>
            <span class="detail-count">{{ cat.count }}笔</span>
          </div>
          <div class="detail-bar-wrap">
            <div class="detail-bar-bg">
              <div
                class="detail-bar-fill"
                :class="cat.type"
                :style="{ width: (cat.total / Math.max(cat.type === 'expense' ? stats.totalExpense : stats.totalIncome, 0.01) * 100) + '%' }"
              />
            </div>
          </div>
          <div class="detail-right">
            <span class="detail-amount">{{ formatMoney(cat.total) }}</span>
            <span class="detail-percent">{{ (cat.total / Math.max(cat.type === 'expense' ? stats.totalExpense : stats.totalIncome, 0.01) * 100).toFixed(1) }}%</span>
          </div>
        </div>
      </div>
    </template>

    <EmptyState v-else text="暂无数据" />
  </div>
</template>

<style scoped>
.date-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  gap: 16px;
  flex-wrap: wrap;
}

.presets {
  display: flex;
  gap: 6px;
}

.preset-btn {
  padding: 6px 16px;
  border-radius: 100px;
  border: 1px solid var(--border);
  background: #fff;
  font-size: 13px;
  font-weight: 500;
  font-family: inherit;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s;
}

.preset-btn:hover {
  border-color: var(--text-hint);
  color: var(--text-dark);
}

.preset-btn.active {
  background: var(--sidebar-bg);
  border-color: var(--sidebar-bg);
  color: #fff;
}

.date-pickers {
  display: flex;
  align-items: center;
  gap: 8px;
}

.date-input {
  padding: 6px 12px;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: #fff;
  font-size: 13px;
  font-family: inherit;
  color: var(--text-dark);
  outline: none;
  transition: border-color 0.2s;
}

.date-input:focus {
  border-color: var(--accent);
}

.date-sep {
  color: var(--text-hint);
  font-size: 14px;
}

.loading-wrap {
  margin-bottom: 20px;
}

.summary-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 20px;
}

.chart-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 16px;
}

.card {
  background: #fff;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
}

.card-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 16px;
}

.donut-wrapper {
  display: flex;
  align-items: center;
  gap: 24px;
}

.donut-container {
  position: relative;
  width: 160px;
  height: 160px;
  flex-shrink: 0;
}

.donut-center {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

.donut-center-label {
  font-size: 11px;
  color: var(--text-secondary);
  font-weight: 500;
}

.donut-center-value {
  font-size: 13px;
  font-weight: 700;
  color: var(--text-primary);
  margin-top: 2px;
}

.donut-legend {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: var(--text-primary);
  font-weight: 500;
}

.legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.legend-dot.income { background: var(--income); }
.legend-dot.expense { background: var(--expense); }

.legend-val {
  margin-left: auto;
  font-weight: 600;
  color: var(--text-primary);
  font-variant-numeric: tabular-nums;
}

.bar-wrapper {
  height: 260px;
}

.bar-container {
  height: 100%;
  width: 100%;
}

.detail-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 0;
  border-bottom: 1px solid var(--border-light);
}

.detail-row:last-child {
  border-bottom: none;
}

.detail-left {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 140px;
}

.detail-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.detail-dot.income { background: var(--income); }
.detail-dot.expense { background: var(--expense); }

.detail-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
}

.detail-count {
  font-size: 12px;
  color: var(--text-secondary);
}

.detail-bar-wrap { flex: 1; }
.detail-bar-bg { height: 8px; background: var(--border-light); border-radius: 4px; overflow: hidden; }
.detail-bar-fill { height: 100%; border-radius: 4px; min-width: 4px; transition: width 0.5s ease; }
.detail-bar-fill.income { background: var(--income); }
.detail-bar-fill.expense { background: var(--expense); }

.detail-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  min-width: 100px;
}

.detail-amount {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.detail-percent {
  font-size: 12px;
  color: var(--text-secondary);
}

@media (max-width: 768px) {
  .date-section { flex-direction: column; gap: 12px; }
  .presets { flex-wrap: wrap; }
  .summary-row { grid-template-columns: 1fr; }
  .chart-grid { grid-template-columns: 1fr; }
  .card { padding: 16px; }
}
</style>