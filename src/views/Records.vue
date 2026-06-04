<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getRecords } from '@/api/record'
import { getCategories } from '@/api/category'
import CategoryIcon from '@/components/CategoryIcon.vue'
import type { RecordItem, Category } from '@/types'

const router = useRouter()
const records = ref<RecordItem[]>([])
const categories = ref<Category[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
const loading = ref(false)

const categoryIconMap = computed(() => {
  const map: Record<number, string> = {}
  categories.value.forEach(c => { map[c.categoryId] = c.icon })
  return map
})

const filters = ref({
  type: '' as string,
  categoryId: undefined as number | undefined,
  startDate: '' as string,
  endDate: '' as string,
})

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  return `${d.getMonth() + 1}月${d.getDate()}日 ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function formatMoney(val: number) {
  return '¥' + val.toLocaleString('zh-CN', { minimumFractionDigits: 2 })
}

async function fetchRecords() {
  loading.value = true
  try {
    const res = await getRecords({
      page: page.value,
      size: pageSize.value,
      ...filters.value,
    })
    records.value = res.data.data.content
    total.value = res.data.data.totalElements
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  page.value = 1
  fetchRecords()
}

function goNew() {
  router.push('/records/new')
}

onMounted(async () => {
  const catRes = await getCategories()
  categories.value = catRes.data.data
  fetchRecords()
})
</script>

<template>
  <div class="records-page">
    <div class="filter-bar">
      <div class="filter-group">
        <button
          :class="['filter-chip', { active: filters.type === '' }]"
          @click="filters.type = ''; handleSearch()"
        >
          全部
        </button>
        <button
          :class="['filter-chip', 'chip-expense', { active: filters.type === 'expense' }]"
          @click="filters.type = 'expense'; handleSearch()"
        >
          <span class="chip-dot expense" />
          支出
        </button>
        <button
          :class="['filter-chip', 'chip-income', { active: filters.type === 'income' }]"
          @click="filters.type = 'income'; handleSearch()"
        >
          <span class="chip-dot income" />
          收入
        </button>
      </div>
      <div class="filter-actions">
        <select v-model="filters.categoryId" class="filter-select" @change="handleSearch">
          <option :value="undefined">全部分类</option>
          <option v-for="cat in categories" :key="cat.categoryId" :value="cat.categoryId">
            {{ cat.name }}
          </option>
        </select>
        <input v-model="filters.startDate" type="date" class="filter-date" @change="handleSearch" />
        <input v-model="filters.endDate" type="date" class="filter-date" @change="handleSearch" />
        <button class="btn-primary" @click="goNew">+ 记一笔</button>
      </div>
    </div>

    <div class="records-list" v-loading="loading">
      <div v-if="records.length === 0" class="empty-state">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="48" height="48">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
        </svg>
        <p>暂无记录</p>
        <button class="btn-primary" @click="goNew">记第一笔</button>
      </div>
      <div v-for="record in records" :key="record.recordId" class="record-card">
        <div class="record-icon" :class="record.type">
          <CategoryIcon :icon="categoryIconMap[record.categoryId] || 'help'" :size="22" />
        </div>
        <div class="record-body">
          <div class="record-top">
            <span class="record-category">{{ record.categoryName }}</span>
            <span :class="['record-amount', record.type]">
              {{ record.type === 'expense' ? '-' : '+' }}{{ formatMoney(record.amount) }}
            </span>
          </div>
          <div class="record-bottom">
            <span class="record-meta">{{ record.accountName }} · {{ formatDate(record.recordTime) }}</span>
            <span v-if="record.remark" class="record-remark">{{ record.remark }}</span>
          </div>
        </div>
      </div>
    </div>

    <div v-if="total > pageSize" class="pagination">
      <button
        :disabled="page <= 1"
        class="page-btn"
        @click="page--; fetchRecords()"
      >
        ← 上一页
      </button>
      <span class="page-info">{{ page }} / {{ Math.ceil(total / pageSize) }}</span>
      <button
        :disabled="page >= Math.ceil(total / pageSize)"
        class="page-btn"
        @click="page++; fetchRecords()"
      >
        下一页 →
      </button>
    </div>
  </div>
</template>

<style scoped>
.records-page {
  max-width: 680px;
  margin: 0 auto;
}

.filter-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 12px;
}

.filter-group {
  display: flex;
  gap: 6px;
}

.filter-chip {
  padding: 6px 14px;
  border-radius: 100px;
  border: 1px solid #e2e8f0;
  background: #fff;
  font-size: 13px;
  font-weight: 500;
  color: #64748b;
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
  display: flex;
  align-items: center;
  gap: 6px;
}

.filter-chip:hover {
  border-color: #cbd5e1;
  color: #334155;
}

.filter-chip.active {
  background: #0d0e1a;
  border-color: #0d0e1a;
  color: #fff;
}

.filter-chip.chip-expense.active {
  background: #ef4444;
  border-color: #ef4444;
}

.filter-chip.chip-income.active {
  background: #10b981;
  border-color: #10b981;
}

.chip-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.chip-dot.expense { background: #ef4444; }
.chip-dot.income { background: #10b981; }

.filter-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.filter-select,
.filter-date {
  padding: 6px 12px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  background: #fff;
  font-size: 13px;
  font-family: inherit;
  color: #334155;
  outline: none;
  transition: border-color 0.2s;
}

.filter-select:focus,
.filter-date:focus {
  border-color: var(--accent);
}

.btn-primary {
  padding: 8px 18px;
  border-radius: 10px;
  border: none;
  background: linear-gradient(135deg, var(--accent), #a855f7);
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px var(--accent-glow);
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
  cursor: pointer;
}

.record-card:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
}

.record-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.record-icon.expense {
  background: #fef2f2;
  color: #ef4444;
}

.record-icon.income {
  background: #ecfdf5;
  color: #10b981;
}

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
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
}

.record-amount {
  font-weight: 700;
  font-size: 16px;
  letter-spacing: -0.3px;
}

.record-amount.expense { color: #ef4444; }
.record-amount.income { color: #10b981; }

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
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: var(--text-secondary);
}

.empty-state svg {
  opacity: 0.3;
  margin-bottom: 12px;
}

.empty-state p {
  margin-bottom: 16px;
  font-size: 15px;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  margin-top: 20px;
}

.page-btn {
  padding: 8px 16px;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
  background: #fff;
  font-size: 13px;
  font-weight: 500;
  color: #334155;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.2s;
}

.page-btn:hover:not(:disabled) {
  border-color: var(--accent);
  color: var(--accent);
}

.page-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.page-info {
  font-size: 13px;
  color: var(--text-secondary);
}
</style>
