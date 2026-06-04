<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getStatistics } from '@/api/record'
import type { Statistics, CategoryStat } from '@/types'

const stats = ref<Statistics | null>(null)
const loading = ref(false)

const dateRange = ref<[string, string]>([
  new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10),
  new Date().toISOString().slice(0, 10),
])

function formatMoney(val: number) {
  return '¥' + val.toLocaleString('zh-CN', { minimumFractionDigits: 2 })
}

function percent(val: number, total: number) {
  if (total === 0) return '0%'
  return (val / total * 100).toFixed(1) + '%'
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
    <div class="page-header">
      <h2>收支统计</h2>
      <el-date-picker
        v-model="dateRange"
        type="daterange"
        range-separator="至"
        start-placeholder="开始"
        end-placeholder="结束"
        value-format="YYYY-MM-DD"
        @change="fetchStats"
      />
    </div>

    <div v-loading="loading" class="stats-content">
      <div class="summary-row">
        <div class="summary-card income">
          <div class="label">总收入</div>
          <div class="value">{{ stats ? formatMoney(stats.totalIncome) : '¥0' }}</div>
        </div>
        <div class="summary-card expense">
          <div class="label">总支出</div>
          <div class="value">{{ stats ? formatMoney(stats.totalExpense) : '¥0' }}</div>
        </div>
      </div>

      <el-card class="detail-card">
        <template #header>分类明细</template>
        <el-table :data="stats?.categoryStats || []" stripe>
          <el-table-column prop="categoryName" label="分类" />
          <el-table-column label="类型" width="80">
            <template #default="{ row }">
              <el-tag :type="row.type === 'expense' ? 'danger' : 'success'" size="small">
                {{ row.type === 'expense' ? '支出' : '收入' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="金额" width="140">
            <template #default="{ row }">{{ formatMoney(row.total) }}</template>
          </el-table-column>
          <el-table-column label="笔数" width="80" prop="count" />
          <el-table-column label="占比" width="120">
            <template #default="{ row }">
              <div class="percent-bar">
                <div
                  class="percent-fill"
                  :style="{
                    width: percent(row.total, row.type === 'expense' ? (stats?.totalExpense || 0) : (stats?.totalIncome || 0)),
                    background: row.type === 'expense' ? '#f56c6c' : '#67c23a',
                  }"
                />
                <span class="percent-text">
                  {{ percent(row.total, row.type === 'expense' ? (stats?.totalExpense || 0) : (stats?.totalIncome || 0)) }}
                </span>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </div>
  </div>
</template>

<style scoped>
.stats-page {
  max-width: 800px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0;
  font-size: 20px;
}

.summary-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 20px;
}

.summary-card {
  padding: 20px;
  border-radius: 12px;
  color: #fff;
}

.summary-card.income {
  background: linear-gradient(135deg, #43e97b, #38f9d7);
}

.summary-card.expense {
  background: linear-gradient(135deg, #fa709a, #fee140);
}

.label {
  font-size: 13px;
  opacity: 0.85;
  margin-bottom: 8px;
}

.value {
  font-size: 28px;
  font-weight: 700;
}

.percent-bar {
  display: flex;
  align-items: center;
  gap: 8px;
}

.percent-fill {
  height: 8px;
  border-radius: 4px;
  min-width: 4px;
  transition: width 0.3s;
}

.percent-text {
  font-size: 12px;
  color: #666;
  white-space: nowrap;
}
</style>
