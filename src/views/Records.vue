<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getRecords, deleteRecord } from '@/api/record'
import { getCategories } from '@/api/category'
import CategoryIcon from '@/components/CategoryIcon.vue'
import EmptyState from '@/components/EmptyState.vue'
import { formatDate, formatMoney } from '@/utils/format'
import type { RecordItem, Category } from '@/types'
import { ElMessage, ElMessageBox } from 'element-plus'

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

function goEdit(record: RecordItem) {
  router.push({ path: `/records/${record.recordId}/edit`, state: { record } })
}

async function handleDelete(id: number) {
  try {
    await ElMessageBox.confirm('确定删除这条记录吗？', '删除确认', {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning',
    })
    await deleteRecord(id)
    ElMessage.success('删除成功')
    fetchRecords()
  } catch {
    // cancelled or error
  }
}

onMounted(async () => {
  try {
    const catRes = await getCategories()
    categories.value = catRes.data.data
    fetchRecords()
  } catch {
    // 401 handled by interceptor redirect
  }
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
<EmptyState v-if="records.length === 0 && !loading" text="还没有记录" action-text="记第一笔" @action="goNew" />
      <div v-for="record in records" :key="record.recordId" class="record-card">
        <div class="record-icon" :class="record.type" @click="goEdit(record)">
          <CategoryIcon :icon="categoryIconMap[record.categoryId] || 'help'" :size="22" />
        </div>
        <div class="record-body" @click="goEdit(record)">
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
        <button class="delete-btn" @click.stop="handleDelete(record.recordId)">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M3 6h18M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2m3 0v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6h14z"/></svg>
        </button>
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
.filter-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  gap: 10px;
}

.filter-group {
  display: flex;
  gap: 6px;
}

.filter-chip {
  padding: 6px 14px;
  border-radius: 100px;
  border: 1px solid var(--border);
  background: #fff;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
  display: flex;
  align-items: center;
  gap: 6px;
}

.filter-chip:hover {
  border-color: var(--text-hint);
  color: var(--text-dark);
}

.filter-chip.active {
  background: var(--sidebar-bg);
  border-color: var(--sidebar-bg);
  color: #fff;
}

.filter-chip.chip-expense.active {
  background: var(--expense);
  border-color: var(--expense);
}

.filter-chip.chip-income.active {
  background: var(--income);
  border-color: var(--income);
}

.chip-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.chip-dot.expense { background: var(--expense); }
.chip-dot.income { background: var(--income); }

.filter-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.filter-select,
.filter-date {
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

.filter-select:focus,
.filter-date:focus {
  border-color: var(--accent);
}

.btn-primary {
  padding: 8px 18px;
  border-radius: 10px;
  border: none;
  background: linear-gradient(135deg, var(--accent), var(--accent-purple));
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
  background: var(--expense-bg);
  color: var(--expense);
}

.record-icon.income {
  background: var(--income-bg);
  color: var(--income);
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
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.delete-btn {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.2s;
  opacity: 0;
}

.record-card:hover .delete-btn {
  opacity: 1;
}

.delete-btn:hover {
  background: var(--expense-bg);
  color: var(--expense);
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
  border: 1px solid var(--border);
  background: #fff;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-dark);
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

@media (max-width: 768px) {
  .filter-bar { flex-direction: column; align-items: stretch; }
  .filter-actions { flex-wrap: wrap; }
  .filter-select, .filter-date { font-size: 12px; padding: 6px 10px; }
  .record-card { padding: 12px 14px; }
  .record-icon { width: 38px; height: 38px; border-radius: 10px; }
  .record-amount { font-size: 14px; }
  .record-meta { font-size: 11px; }
}
</style>
