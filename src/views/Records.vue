<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { isNativeApp } from '@/utils/platform'
import { getRecords, deleteRecord } from '@/api/record'
import { getAccounts } from '@/api/account'
import { getCategories } from '@/api/category'
import { createTransfer, deleteTransferByRecord } from '@/api/transfer'
import CategoryIcon from '@/components/CategoryIcon.vue'
import EmptyState from '@/components/EmptyState.vue'
import { formatDate, formatMoney } from '@/utils/format'
import type { RecordItem, Category, Account } from '@/types'
import { ElMessage, ElMessageBox } from 'element-plus'

const router = useRouter()
const isNative = isNativeApp()
const records = ref<RecordItem[]>([])
const categories = ref<Category[]>([])
const accounts = ref<Account[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
const loading = ref(false)

const categoryIconMap = computed(() => {
  const map: Record<number, string> = {}
  categories.value.forEach(c => { map[c.categoryId] = c.icon })
  return map
})

const transferCategoryIds = computed(() => {
  return categories.value
    .filter(c => c.name === '转账')
    .map(c => c.categoryId)
})

const filters = ref({
  type: '' as string,
  startDate: '' as string,
  endDate: '' as string,
})

const showTransferForm = ref(false)
const transferSubmitting = ref(false)
const transferForm = ref({
  fromAccountId: undefined as number | undefined,
  toAccountId: undefined as number | undefined,
  amount: 0,
  remark: '',
})

async function fetchRecords() {
  loading.value = true
  try {
    const params: Record<string, any> = {
      page: page.value,
      size: pageSize.value,
    }
    if (filters.value.type === 'transfer') {
      if (transferCategoryIds.value.length > 0) {
        params.categoryIds = transferCategoryIds.value.join(',')
      }
    } else {
      if (filters.value.type) params.type = filters.value.type
    }
    if (filters.value.startDate) params.startDate = filters.value.startDate
    if (filters.value.endDate) params.endDate = filters.value.endDate

    const res = await getRecords(params)
    records.value = res.data.data.content
    total.value = res.data.data.totalElements
  } finally {
    loading.value = false
  }
}

async function fetchAccounts() {
  try {
    const res = await getAccounts()
    accounts.value = res.data.data
  } catch { /* 401 handled by interceptor */ }
}

function handleSearch() {
  page.value = 1
  fetchRecords()
}

function goNew() {
  router.push('/records/new')
}

function openTransferForm() {
  transferForm.value = {
    fromAccountId: undefined,
    toAccountId: undefined,
    amount: 0,
    remark: '',
  }
  showTransferForm.value = true
}

async function handleTransferSubmit() {
  if (!transferForm.value.fromAccountId) { ElMessage.warning('请选择转出账户'); return }
  if (!transferForm.value.toAccountId) { ElMessage.warning('请选择转入账户'); return }
  if (transferForm.value.fromAccountId === transferForm.value.toAccountId) { ElMessage.warning('转出和转入账户不能相同'); return }
  if (!transferForm.value.amount || transferForm.value.amount <= 0) { ElMessage.warning('请输入有效金额'); return }

  transferSubmitting.value = true
  try {
    await createTransfer({
      fromAccountId: transferForm.value.fromAccountId,
      toAccountId: transferForm.value.toAccountId,
      amount: transferForm.value.amount,
      remark: transferForm.value.remark || undefined,
    })
    ElMessage.success('转账成功')
    showTransferForm.value = false
    fetchRecords()
    fetchAccounts()
  } catch {
    // error shown by interceptor
  } finally {
    transferSubmitting.value = false
  }
}

function goEdit(record: RecordItem) {
  if (record.categoryName === '转账') return
  sessionStorage.setItem('editingRecord', JSON.stringify(record))
  router.push({ path: `/records/${record.recordId}/edit`, state: { record: record as any } })
}

async function handleDelete(record: RecordItem) {
  const isTransfer = record.categoryName === '转账'
  try {
    await ElMessageBox.confirm(
      isTransfer
        ? '确定删除这条转账记录吗？关联的转入/转出记录将被一并删除，余额将回退。'
        : '确定删除这条记录吗？',
      '删除确认',
      { confirmButtonText: '删除', cancelButtonText: '取消', type: 'warning' },
    )

    if (isTransfer) {
      await deleteTransferByRecord({
        accountId: record.accountId,
        amount: record.amount,
        recordTime: record.recordTime.replace(' ', 'T'),
        type: record.type,
      })
    } else {
      await deleteRecord(record.recordId)
    }
    ElMessage.success('删除成功')
    fetchRecords()
  } catch {
    // cancelled or error
  }
}

function handleAddCommand(command: string) {
  if (command === 'record') goNew()
  else if (command === 'transfer') openTransferForm()
}

onMounted(async () => {
  try {
    const [catRes, acctRes] = await Promise.all([
      getCategories(),
      getAccounts(),
    ])
    categories.value = catRes.data.data
    accounts.value = acctRes.data.data
    fetchRecords()
  } catch {
    // 401 handled by interceptor redirect
  }
})
</script>

<template>
  <!-- ========== 原生 APP ========== -->
  <div v-if="isNative" class="app-records-page">
    <div class="app-records-header">
      <div class="app-filter-chips">
        <button :class="['app-chip', { active: filters.type === '' }]" @click="filters.type = ''; handleSearch()">全部</button>
        <button :class="['app-chip', { active: filters.type === 'expense' }]" @click="filters.type = 'expense'; handleSearch()">支出</button>
        <button :class="['app-chip', { active: filters.type === 'income' }]" @click="filters.type = 'income'; handleSearch()">收入</button>
        <button :class="['app-chip', { active: filters.type === 'transfer' }]" @click="filters.type = 'transfer'; handleSearch()">转账</button>
      </div>
      <div class="app-records-dates">
        <input v-model="filters.startDate" type="date" class="app-date-input" @change="handleSearch" />
        <span class="app-date-sep">—</span>
        <input v-model="filters.endDate" type="date" class="app-date-input" @change="handleSearch" />
      </div>
    </div>

    <div class="app-records-list" v-loading="loading">
      <EmptyState v-if="records.length === 0 && !loading" text="还没有记录" @action="goNew" />
      <div v-for="record in records" :key="record.recordId" class="app-record-item" @click="goEdit(record)">
        <div :class="['app-record-dot', record.type]" />
        <div class="app-record-body">
          <span class="app-rec-category">{{ record.categoryName }}</span>
          <span class="app-rec-meta">{{ record.accountName }} · {{ formatDate(record.recordTime) }}</span>
        </div>
        <div class="app-rec-right">
          <span :class="['app-rec-amount', record.type]">{{ record.type === 'expense' ? '-' : '+' }}{{ formatMoney(record.amount) }}</span>
          <button class="app-rec-delete" @click.stop="handleDelete(record)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M3 6h18M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2m3 0v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6h14z"/></svg>
          </button>
        </div>
      </div>
    </div>

    <div v-if="total > pageSize" class="app-records-pagination">
      <button :disabled="page <= 1" class="app-page-btn" @click="page--; fetchRecords()">←</button>
      <span class="app-page-info">{{ page }} / {{ Math.ceil(total / pageSize) }}</span>
      <button :disabled="page >= Math.ceil(total / pageSize)" class="app-page-btn" @click="page++; fetchRecords()">→</button>
    </div>

    <div class="app-bottom-safe" />
    <button class="app-fab" @click="goNew">
      <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
    </button>
  </div>

  <!-- ========== Web 端 ========== -->
  <div v-else class="records-page">
    <div class="filter-bar">
      <div class="filter-group">
        <button :class="['filter-chip', { active: filters.type === '' }]" @click="filters.type = ''; handleSearch()">全部</button>
        <button :class="['filter-chip', 'chip-expense', { active: filters.type === 'expense' }]" @click="filters.type = 'expense'; handleSearch()"><span class="chip-dot expense" />支出</button>
        <button :class="['filter-chip', 'chip-income', { active: filters.type === 'income' }]" @click="filters.type = 'income'; handleSearch()"><span class="chip-dot income" />收入</button>
        <button :class="['filter-chip', 'chip-transfer', { active: filters.type === 'transfer' }]" @click="filters.type = 'transfer'; handleSearch()"><span class="chip-dot transfer" />转账</button>
      </div>
      <div class="filter-actions">
        <input v-model="filters.startDate" type="date" class="filter-date" @change="handleSearch" />
        <input v-model="filters.endDate" type="date" class="filter-date" @change="handleSearch" />
        <el-dropdown @command="handleAddCommand">
          <button class="btn-primary">+ 记一笔</button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="record">记一笔</el-dropdown-item>
              <el-dropdown-item command="transfer">转账</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>

    <div class="records-list" v-loading="loading">
      <EmptyState v-if="records.length === 0 && !loading" text="还没有记录" @action="goNew" />
      <div v-for="record in records" :key="record.recordId" class="record-card">
        <div class="record-icon" :class="[record.type, { transfer: record.categoryName === '转账' }]" @click="goEdit(record)">
          <CategoryIcon :icon="categoryIconMap[record.categoryId] || 'help'" :size="22" />
        </div>
        <div class="record-body" @click="goEdit(record)">
          <div class="record-top">
            <div class="record-left">
              <span class="record-category">{{ record.categoryName }}</span>
              <span v-if="record.categoryName === '转账'" class="transfer-badge">转账</span>
            </div>
            <span :class="['record-amount', record.type]">
              {{ record.type === 'expense' ? '-' : '+' }}{{ formatMoney(record.amount) }}
            </span>
          </div>
          <div class="record-bottom">
            <span class="record-meta">{{ record.accountName }} · {{ formatDate(record.recordTime) }}</span>
            <span v-if="record.remark" class="record-remark">{{ record.remark }}</span>
          </div>
        </div>
        <button class="delete-btn" @click.stop="handleDelete(record)">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M3 6h18M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2m3 0v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6h14z"/></svg>
        </button>
      </div>
    </div>

    <div v-if="total > pageSize" class="pagination">
      <button :disabled="page <= 1" class="page-btn" @click="page--; fetchRecords()">← 上一页</button>
      <span class="page-info">{{ page }} / {{ Math.ceil(total / pageSize) }}</span>
      <button :disabled="page >= Math.ceil(total / pageSize)" class="page-btn" @click="page++; fetchRecords()">下一页 →</button>
    </div>

    <el-dialog v-model="showTransferForm" title="转账" width="420px">
      <el-form label-width="80px">
        <el-form-item label="转出账户">
          <el-select v-model="transferForm.fromAccountId" placeholder="选择转出账户" style="width: 100%">
            <el-option v-for="acct in accounts" :key="acct.accountId" :label="`${acct.name} (${formatMoney(acct.balance)})`" :value="acct.accountId" />
          </el-select>
        </el-form-item>
        <el-form-item label="转入账户">
          <el-select v-model="transferForm.toAccountId" placeholder="选择转入账户" style="width: 100%">
            <el-option v-for="acct in accounts" :key="acct.accountId" :label="`${acct.name} (${formatMoney(acct.balance)})`" :value="acct.accountId" />
          </el-select>
        </el-form-item>
        <el-form-item label="金额">
          <el-input v-model.number="transferForm.amount" type="number" step="0.01" placeholder="请输入金额" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="transferForm.remark" placeholder="可选" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showTransferForm = false">取消</el-button>
        <el-button type="primary" :loading="transferSubmitting" @click="handleTransferSubmit">确认转账</el-button>
      </template>
    </el-dialog>
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

.filter-chip.chip-transfer.active {
  background: var(--accent);
  border-color: var(--accent);
}

.chip-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.chip-dot.expense { background: var(--expense); }
.chip-dot.income { background: var(--income); }
.chip-dot.transfer { background: var(--accent); }

.filter-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

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

.record-icon.transfer {
  background: var(--accent-bg);
  color: var(--accent);
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

.record-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.record-category {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
}

.transfer-badge {
  font-size: 10px;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 4px;
  background: var(--accent-bg);
  color: var(--accent);
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
  .filter-date { font-size: 12px; padding: 6px 10px; }
  .record-card { padding: 12px 14px; }
  .record-icon { width: 38px; height: 38px; border-radius: 10px; }
  .record-amount { font-size: 14px; }
  .record-meta { font-size: 11px; }
}

/* ====== 原生布局 ====== */
.app-records-page {
  padding: 12px 16px 0;
  display: flex;
  flex-direction: column;
  min-height: 100%;
}
.app-records-header { margin-bottom: 12px; }
.app-filter-chips { display: flex; gap: 8px; margin-bottom: 10px; }
.app-chip {
  flex: 1; padding: 8px 0; border: none; border-radius: 8px;
  background: var(--bg); color: var(--text-secondary);
  font-size: 14px; font-weight: 500; cursor: pointer; transition: all 0.15s;
}
.app-chip.active { background: var(--primary); color: #fff; }
.app-records-dates { display: flex; align-items: center; gap: 6px; }
.app-date-input {
  flex: 1; padding: 6px 10px; border: 1px solid var(--border-light);
  border-radius: 8px; font-size: 13px; outline: none;
  color: var(--text-primary); background: var(--card-bg);
}
.app-date-sep { font-size: 13px; color: var(--text-hint); }
.app-records-list { flex: 1; }
.app-record-item {
  display: flex; align-items: center; gap: 12px;
  padding: 14px 0; border-bottom: 1px solid var(--border-light); cursor: pointer;
}
.app-record-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
.app-record-dot.expense { background: var(--expense); }
.app-record-dot.income { background: var(--income); }
.app-record-dot.transfer { background: var(--warning); }
.app-record-body { flex: 1; min-width: 0; }
.app-rec-category { display: block; font-size: 15px; font-weight: 500; color: var(--text-primary); }
.app-rec-meta { font-size: 12px; color: var(--text-secondary); }
.app-rec-right { display: flex; flex-direction: column; align-items: flex-end; gap: 4px; }
.app-rec-amount { font-size: 15px; font-weight: 600; font-variant-numeric: tabular-nums; }
.app-rec-amount.expense { color: var(--expense); }
.app-rec-amount.income { color: var(--income); }
.app-rec-delete {
  background: none; border: none; color: var(--text-hint);
  cursor: pointer; padding: 4px; border-radius: 4px;
}
.app-rec-delete:hover { color: var(--expense); background: var(--expense-bg); }
.app-records-pagination { display: flex; align-items: center; justify-content: center; gap: 12px; padding: 16px 0; }
.app-page-btn {
  padding: 6px 16px; border: 1px solid var(--border-light);
  border-radius: 8px; background: var(--card-bg);
  color: var(--text-primary); font-size: 14px; cursor: pointer;
}
.app-page-btn:disabled { opacity: 0.4; cursor: default; }
.app-page-info { font-size: 13px; color: var(--text-secondary); }
.app-fab {
  position: fixed; right: 20px; bottom: 84px;
  width: 52px; height: 52px; border: none; border-radius: 50%;
  background: var(--primary); color: #fff;
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 4px 16px rgba(99,102,241,0.4);
  cursor: pointer; z-index: 100;
}
</style>