<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getRecords } from '@/api/record'
import { getCategories } from '@/api/category'
import type { RecordItem, Category } from '@/types'

const router = useRouter()
const records = ref<RecordItem[]>([])
const categories = ref<Category[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
const loading = ref(false)

const filters = ref({
  type: '' as string,
  categoryId: undefined as number | undefined,
  startDate: '' as string,
  endDate: '' as string,
})

function formatDate(dateStr: string) {
  return dateStr.slice(5, 16)
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
    <div class="page-header">
      <h2>账单记录</h2>
      <el-button type="primary" @click="goNew">+ 新增</el-button>
    </div>

    <el-card class="filter-card">
      <el-form :inline="true" class="filter-form">
        <el-form-item label="类型">
          <el-select v-model="filters.type" placeholder="全部" clearable style="width: 120px">
            <el-option label="支出" value="expense" />
            <el-option label="收入" value="income" />
          </el-select>
        </el-form-item>
        <el-form-item label="分类">
          <el-select v-model="filters.categoryId" placeholder="全部" clearable style="width: 140px">
            <el-option
              v-for="cat in categories"
              :key="cat.categoryId"
              :label="cat.name"
              :value="cat.categoryId"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="日期">
          <el-date-picker
            v-model="filters.startDate"
            type="date"
            placeholder="开始"
            value-format="YYYY-MM-DD"
            style="width: 140px"
          />
          <span class="date-sep">至</span>
          <el-date-picker
            v-model="filters.endDate"
            type="date"
            placeholder="结束"
            value-format="YYYY-MM-DD"
            style="width: 140px"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-table :data="records" v-loading="loading" stripe style="width: 100%">
      <el-table-column prop="categoryName" label="分类" width="120" />
      <el-table-column label="类型" width="80">
        <template #default="{ row }">
          <el-tag :type="row.type === 'expense' ? 'danger' : 'success'" size="small">
            {{ row.type === 'expense' ? '支出' : '收入' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="accountName" label="账户" width="100" />
      <el-table-column label="金额" width="120">
        <template #default="{ row }">
          <span :class="row.type">{{ row.type === 'expense' ? '-' : '+' }}{{ formatMoney(row.amount) }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="remark" label="备注" min-width="160" />
      <el-table-column label="时间" width="160">
        <template #default="{ row }">{{ formatDate(row.recordTime) }}</template>
      </el-table-column>
    </el-table>

    <div class="pagination-wrap">
      <el-pagination
        v-model:current-page="page"
        v-model:page-size="pageSize"
        :total="total"
        layout="prev, pager, next, total"
        @current-change="fetchRecords"
      />
    </div>
  </div>
</template>

<style scoped>
.records-page {
  max-width: 1000px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.page-header h2 {
  margin: 0;
  font-size: 20px;
}

.filter-card {
  margin-bottom: 16px;
}

.filter-form .date-sep {
  padding: 0 8px;
  color: #999;
}

.pagination-wrap {
  margin-top: 16px;
  display: flex;
  justify-content: center;
}

.income {
  color: #67c23a;
  font-weight: 600;
}

.expense {
  color: #f56c6c;
  font-weight: 600;
}
</style>
