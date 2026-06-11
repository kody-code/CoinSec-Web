<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { isNativeApp } from '@/utils/platform'
import { formatMoney } from '@/utils/format'
import { getCategories } from '@/api/category'
import { getBudgets, createBudget, updateBudget, deleteBudget, getBudgetOverview } from '@/api/budget'
import EmptyState from '@/components/EmptyState.vue'
import LoadingSkeleton from '@/components/LoadingSkeleton.vue'
import type { Category, Budget, BudgetOverview } from '@/types'
import { ElMessage, ElMessageBox } from 'element-plus'

const budgets = ref<Budget[]>([])
const overviews = ref<BudgetOverview[]>([])
const categories = ref<Category[]>([])
const isNative = isNativeApp()
const loading = ref(true)

const now = new Date()
const periodYear = ref(now.getFullYear())
const periodMonth = ref(now.getMonth() + 1)
const periodType = ref<'MONTHLY' | 'YEARLY'>('MONTHLY')

const showForm = ref(false)
const editing = ref<Budget | null>(null)
const formLoading = ref(false)
const form = ref({
  categoryId: undefined as number | undefined,
  budgetAmount: undefined as number | undefined,
  periodType: 'MONTHLY' as string,
  periodYear: now.getFullYear(),
  periodMonth: now.getMonth() + 1,
})

const expenseCategories = computed(() =>
  categories.value.filter(c => c.type === 'expense')
)

function getCatName(catId: number) {
  return categories.value.find(c => c.categoryId === catId)?.name || '未知分类'
}

function getOverview(catId: number): BudgetOverview | undefined {
  return overviews.value.find(o => o.categoryId === catId)
}

async function fetchData() {
  loading.value = true
  try {
    const [budgetRes, catRes, overviewRes] = await Promise.all([
      getBudgets(),
      getCategories(),
      getBudgetOverview(periodType.value, periodYear.value, periodType.value === 'MONTHLY' ? periodMonth.value : undefined),
    ])
    budgets.value = budgetRes.data.data
    categories.value = catRes.data.data
    overviews.value = overviewRes.data.data
  } catch (e) {
    console.error('[Budgets] Failed to load data:', e)
  } finally {
    loading.value = false
  }
}

async function refreshOverview() {
  try {
    const res = await getBudgetOverview(periodType.value, periodYear.value, periodType.value === 'MONTHLY' ? periodMonth.value : undefined)
    overviews.value = res.data.data
  } catch (e) {
    console.error('[Budgets] Failed to refresh overview:', e)
  }
}

function openCreate() {
  editing.value = null
  form.value = {
    categoryId: undefined,
    budgetAmount: undefined,
    periodType: 'MONTHLY',
    periodYear: periodYear.value,
    periodMonth: periodMonth.value,
  }
  showForm.value = true
}

function openEdit(b: Budget) {
  editing.value = b
  form.value = {
    categoryId: b.categoryId,
    budgetAmount: Number(b.budgetAmount),
    periodType: b.periodType,
    periodYear: b.periodYear,
    periodMonth: b.periodMonth ?? now.getMonth() + 1,
  }
  showForm.value = true
}

async function handleSave() {
  if (!form.value.categoryId) { ElMessage.warning('请选择分类'); return }
  if (!form.value.budgetAmount || form.value.budgetAmount <= 0) { ElMessage.warning('请输入有效金额'); return }
  formLoading.value = true
  try {
    const payload = {
      categoryId: form.value.categoryId!,
      budgetAmount: form.value.budgetAmount!,
      periodType: form.value.periodType,
      periodYear: form.value.periodYear,
      ...(form.value.periodType === 'MONTHLY' ? { periodMonth: form.value.periodMonth } : {}),
    }
    if (editing.value) {
      await updateBudget(editing.value.budgetId, payload)
    } else {
      await createBudget(payload)
    }
    showForm.value = false
    ElMessage.success(editing.value ? '已更新' : '已创建')
    fetchData()
  } finally { formLoading.value = false }
}

async function handleDelete(id: number) {
  try {
    await ElMessageBox.confirm('确定删除该预算？', '删除确认', { confirmButtonText: '删除', cancelButtonText: '取消', type: 'warning' })
    await deleteBudget(id)
    ElMessage.success('已删除')
    fetchData()
  } catch {}
}

function prevMonth() {
  periodMonth.value--
  if (periodMonth.value < 1) { periodMonth.value = 12; periodYear.value-- }
  fetchData()
}
function nextMonth() {
  periodMonth.value++
  if (periodMonth.value > 12) { periodMonth.value = 1; periodYear.value++ }
  fetchData()
}

const periodLabel = computed(() => {
  if (periodType.value === 'YEARLY') return `${periodYear.value} 年`
  return `${periodYear.value} 年 ${periodMonth.value} 月`
})

onMounted(fetchData)
</script>

<template>
  <div :class="['budget-page', { 'budget-page-native': isNative }]">
    <div class="period-bar">
      <template v-if="periodType === 'MONTHLY'">
        <button class="period-btn" @click="prevMonth">←</button>
        <span class="period-label">{{ periodLabel }}</span>
        <button class="period-btn" @click="nextMonth">→</button>
      </template>
      <template v-else>
        <span class="period-label">{{ periodYear }} 年</span>
      </template>
    </div>

    <div class="period-toggle">
      <button :class="['toggle-btn', { active: periodType === 'MONTHLY' }]" @click="periodType = 'MONTHLY'; fetchData()">月度</button>
      <button :class="['toggle-btn', { active: periodType === 'YEARLY' }]" @click="periodType = 'YEARLY'; fetchData()">年度</button>
    </div>

    <div class="page-actions">
      <button class="btn-primary" @click="openCreate">+ 新建预算</button>
    </div>

    <div v-if="loading" class="loading-wrap"><LoadingSkeleton :rows="3" /></div>

    <EmptyState v-else-if="budgets.length === 0" text="还没有预算" icon="budget" />

    <template v-else>
      <div v-for="b in budgets" :key="b.budgetId" class="budget-card">
        <div class="budget-header">
          <span class="budget-cat">{{ getCatName(b.categoryId) }}</span>
          <span class="budget-period">{{ b.periodType === 'MONTHLY' ? `${b.periodYear}.${String(b.periodMonth).padStart(2, '0')}` : `${b.periodYear}` }}</span>
        </div>
        <div class="budget-bar-wrap">
          <div class="budget-bar-bg">
            <div
              class="budget-bar-fill"
              :class="{ over: (getOverview(b.categoryId)?.percentage ?? 0) > 1 }"
              :style="{ width: Math.min((getOverview(b.categoryId)?.percentage ?? 0) * 100, 100) + '%' }"
            />
          </div>
        </div>
        <div class="budget-footer">
          <span class="budget-amount">预算 {{ formatMoney(b.budgetAmount) }}</span>
          <span v-if="getOverview(b.categoryId)" class="budget-spent">
            已花 {{ formatMoney(getOverview(b.categoryId)!.spentAmount) }}
            <span :class="['budget-pct', { over: getOverview(b.categoryId)!.percentage > 1 }]">
              {{ (getOverview(b.categoryId)!.percentage * 100).toFixed(0) }}%
            </span>
          </span>
          <span v-else class="budget-spent">暂无数据</span>
          <div class="budget-actions">
            <button class="action-btn" @click="openEdit(b)">编辑</button>
            <button class="action-btn danger" @click="handleDelete(b.budgetId)">删除</button>
          </div>
        </div>
      </div>
    </template>

    <el-dialog v-model="showForm" :title="editing ? '编辑预算' : '新建预算'" width="400px">
      <el-form label-width="80px">
        <el-form-item label="分类">
          <el-select v-model="form.categoryId" placeholder="选择分类" style="width: 100%">
            <el-option v-for="cat in expenseCategories" :key="cat.categoryId" :label="cat.name" :value="cat.categoryId" />
          </el-select>
        </el-form-item>
        <el-form-item label="预算金额">
          <el-input-number v-model="form.budgetAmount" :min="0" :precision="2" style="width: 100%" />
        </el-form-item>
        <el-form-item label="周期">
          <el-select v-model="form.periodType" style="width: 100%">
            <el-option label="月度" value="MONTHLY" />
            <el-option label="年度" value="YEARLY" />
          </el-select>
        </el-form-item>
        <el-form-item label="年份">
          <el-input-number v-model="form.periodYear" :min="2020" :max="2099" style="width: 100%" />
        </el-form-item>
        <el-form-item v-if="form.periodType === 'MONTHLY'" label="月份">
          <el-input-number v-model="form.periodMonth" :min="1" :max="12" style="width: 100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showForm = false">取消</el-button>
        <el-button type="primary" :loading="formLoading" @click="handleSave">保存</el-button>
      </template>
    </el-dialog>

    <div v-if="isNative" class="app-bottom-safe" />
  </div>
</template>

<style scoped>
.budget-page { max-width: 720px; margin: 0 auto; }
.budget-page-native { max-width: 100%; padding: 0 16px; }
.period-bar { display: flex; align-items: center; justify-content: center; gap: 16px; margin-bottom: 12px; }
.period-label { font-size: 16px; font-weight: 600; color: var(--text-primary); min-width: 120px; text-align: center; }
.period-btn {
  width: 32px; height: 32px; border-radius: 8px; border: 1px solid var(--border);
  background: #fff; cursor: pointer; display: flex; align-items: center; justify-content: center;
  color: var(--text-secondary); font-size: 14px; transition: all 0.2s;
}
.period-btn:hover { border-color: var(--accent); color: var(--accent); }
.period-toggle { display: flex; gap: 8px; margin-bottom: 20px; }
.toggle-btn {
  padding: 6px 16px; border-radius: 100px; border: 1px solid var(--border);
  background: #fff; font-size: 13px; font-weight: 500; font-family: inherit;
  color: var(--text-secondary); cursor: pointer; transition: all 0.2s;
}
.toggle-btn.active { background: var(--sidebar-bg); border-color: var(--sidebar-bg); color: #fff; }
.page-actions { margin-bottom: 20px; }
.btn-primary {
  padding: 8px 18px; border-radius: 10px; border: none;
  background: linear-gradient(135deg, var(--accent), var(--accent-purple));
  color: #fff; font-size: 13px; font-weight: 600; cursor: pointer;
  font-family: inherit; transition: all 0.2s;
}
.btn-primary:hover { transform: translateY(-1px); box-shadow: 0 4px 12px var(--accent-glow); }

.budget-card {
  background: #fff; border-radius: 14px; padding: 16px 20px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04); margin-bottom: 12px; transition: all 0.2s;
}
.budget-card:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
.budget-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
.budget-cat { font-size: 15px; font-weight: 600; color: var(--text-primary); }
.budget-period { font-size: 12px; color: var(--text-secondary); font-variant-numeric: tabular-nums; }
.budget-bar-wrap { margin-bottom: 10px; }
.budget-bar-bg { height: 8px; border-radius: 4px; background: var(--border-light); overflow: hidden; }
.budget-bar-fill { height: 100%; border-radius: 4px; background: linear-gradient(135deg, var(--accent), var(--accent-purple)); min-width: 4px; transition: width 0.4s ease; }
.budget-bar-fill.over { background: linear-gradient(135deg, var(--expense), #fb923c); }
.budget-footer { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
.budget-amount { font-size: 13px; color: var(--text-secondary); }
.budget-spent { font-size: 13px; color: var(--text-primary); font-weight: 500; font-variant-numeric: tabular-nums; }
.budget-pct { font-size: 12px; margin-left: 4px; color: var(--accent); font-weight: 600; }
.budget-pct.over { color: var(--expense); }
.budget-actions { margin-left: auto; display: flex; gap: 4px; }
.action-btn {
  padding: 4px 10px; border-radius: 6px; border: none; font-size: 12px;
  font-weight: 500; cursor: pointer; font-family: inherit;
  background: var(--border-light); color: var(--text-secondary); transition: all 0.2s;
}
.action-btn:hover { background: var(--border); }
.action-btn.danger { color: var(--expense); }
.action-btn.danger:hover { background: var(--expense-bg); }

.loading-wrap { margin-bottom: 20px; }
.app-bottom-safe { height: 72px; }

@media (max-width: 768px) {
  .budget-card { padding: 14px 16px; }
  .budget-actions { margin-left: 0; width: 100%; justify-content: flex-end; margin-top: 4px; }
}
</style>