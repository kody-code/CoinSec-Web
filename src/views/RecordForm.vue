<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { createRecord } from '@/api/record'
import { getCategories } from '@/api/category'
import { getAccounts } from '@/api/account'
import type { Category, Account } from '@/types'
import { ElMessage } from 'element-plus'

const router = useRouter()
const categories = ref<Category[]>([])
const accounts = ref<Account[]>([])
const loading = ref(false)

const form = ref({
  type: 'expense' as string,
  categoryId: undefined as number | undefined,
  accountId: undefined as number | undefined,
  amount: undefined as number | undefined,
  remark: '',
  recordTime: '',
})

const filteredCategories = ref<Category[]>([])

function filterCategories() {
  filteredCategories.value = categories.value.filter(
    (c) => c.type === form.value.type,
  )
}

function handleTypeChange(val: string) {
  form.value.type = val
  form.value.categoryId = undefined
  filterCategories()
}

async function handleSubmit() {
  if (!form.value.categoryId || !form.value.accountId || !form.value.amount) {
    ElMessage.warning('请填写完整信息')
    return
  }

  loading.value = true
  try {
    await createRecord({
      categoryId: form.value.categoryId!,
      accountId: form.value.accountId!,
      type: form.value.type,
      amount: form.value.amount!,
      remark: form.value.remark,
      recordTime: form.value.recordTime ? form.value.recordTime + ':00' : undefined,
    })
    ElMessage.success('记账成功')
    router.push('/records')
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  const [catRes, acctRes] = await Promise.all([
    getCategories(),
    getAccounts(),
  ])
  categories.value = catRes.data.data
  accounts.value = acctRes.data.data
  filterCategories()
})
</script>

<template>
  <div class="form-page">
    <div class="page-header">
      <h2>新增记录</h2>
    </div>

    <el-card class="form-card">
      <el-form label-width="80px">
        <el-form-item label="类型">
          <el-radio-group :model-value="form.type" @change="handleTypeChange">
            <el-radio-button value="expense">支出</el-radio-button>
            <el-radio-button value="income">收入</el-radio-button>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="分类">
          <el-select v-model="form.categoryId" placeholder="选择分类" style="width: 100%">
            <el-option
              v-for="cat in filteredCategories"
              :key="cat.categoryId"
              :label="cat.name"
              :value="cat.categoryId"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="账户">
          <el-select v-model="form.accountId" placeholder="选择账户" style="width: 100%">
            <el-option
              v-for="acct in accounts"
              :key="acct.accountId"
              :label="acct.name"
              :value="acct.accountId"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="金额">
          <el-input-number
            v-model="form.amount"
            :min="0.01"
            :precision="2"
            style="width: 200px"
          />
        </el-form-item>

        <el-form-item label="时间">
          <el-date-picker
            v-model="form.recordTime"
            type="datetime"
            placeholder="选择时间"
            value-format="YYYY-MM-DD HH:mm"
            style="width: 100%"
          />
        </el-form-item>

        <el-form-item label="备注">
          <el-input v-model="form.remark" type="textarea" :rows="2" />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" :loading="loading" @click="handleSubmit">
            保存
          </el-button>
          <el-button @click="router.back()">取消</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<style scoped>
.form-page {
  max-width: 600px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 16px;
}

.page-header h2 {
  margin: 0;
  font-size: 20px;
}

.form-card {
  padding: 10px;
}
</style>
