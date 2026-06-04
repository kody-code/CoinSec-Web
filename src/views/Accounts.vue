<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getAccounts, createAccount, updateAccount, deleteAccount } from '@/api/account'
import type { Account } from '@/types'
import { ElMessage, ElMessageBox } from 'element-plus'

const accounts = ref<Account[]>([])
const loading = ref(false)
const dialogVisible = ref(false)
const editing = ref<Account | null>(null)

const form = ref({
  name: '',
  icon: '',
  balance: 0,
})

function formatMoney(val: number) {
  return '¥' + val.toLocaleString('zh-CN', { minimumFractionDigits: 2 })
}

async function fetchAccounts() {
  loading.value = true
  try {
    const res = await getAccounts()
    accounts.value = res.data.data
  } finally {
    loading.value = false
  }
}

function openCreate() {
  editing.value = null
  form.value = { name: '', icon: '', balance: 0 }
  dialogVisible.value = true
}

function openEdit(acct: Account) {
  editing.value = acct
  form.value = { name: acct.name, icon: acct.icon || '', balance: acct.balance }
  dialogVisible.value = true
}

async function handleSave() {
  if (!form.value.name) {
    ElMessage.warning('请输入账户名称')
    return
  }
  loading.value = true
  try {
    if (editing.value) {
      await updateAccount(editing.value.accountId, { name: form.value.name, icon: form.value.icon || undefined })
    } else {
      await createAccount({ name: form.value.name, icon: form.value.icon || undefined, balance: form.value.balance })
    }
    ElMessage.success(editing.value ? '修改成功' : '创建成功')
    dialogVisible.value = false
    fetchAccounts()
  } finally {
    loading.value = false
  }
}

async function handleDelete(id: number) {
  try {
    await ElMessageBox.confirm('确定删除该账户？')
    await deleteAccount(id)
    ElMessage.success('已删除')
    fetchAccounts()
  } catch {
    // cancelled
  }
}

onMounted(fetchAccounts)
</script>

<template>
  <div class="accounts-page">
    <div class="page-header">
      <h2>账户管理</h2>
      <el-button type="primary" @click="openCreate">+ 新增</el-button>
    </div>

    <div class="account-grid">
      <el-card v-for="acct in accounts" :key="acct.accountId" shadow="hover" class="account-card">
        <div class="acct-info">
          <div class="acct-name">{{ acct.name }}</div>
          <div class="acct-balance">{{ formatMoney(acct.balance) }}</div>
        </div>
        <div class="acct-actions">
          <el-button text type="primary" @click="openEdit(acct)">编辑</el-button>
          <el-button text type="danger" @click="handleDelete(acct.accountId)">删除</el-button>
        </div>
      </el-card>
    </div>

    <el-dialog
      v-model="dialogVisible"
      :title="editing ? '编辑账户' : '新增账户'"
      width="400px"
    >
      <el-form label-width="80px">
        <el-form-item label="名称">
          <el-input v-model="form.name" placeholder="如：微信" />
        </el-form-item>
        <el-form-item label="图标">
          <el-input v-model="form.icon" placeholder="图标名称" />
        </el-form-item>
        <el-form-item v-if="!editing" label="余额">
          <el-input-number v-model="form.balance" :precision="2" style="width: 100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="loading" @click="handleSave">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.accounts-page {
  max-width: 800px;
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

.account-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 16px;
}

.account-card {
  cursor: default;
}

.acct-info {
  text-align: center;
  padding: 16px 0;
}

.acct-name {
  font-size: 16px;
  color: #333;
  margin-bottom: 8px;
}

.acct-balance {
  font-size: 24px;
  font-weight: 700;
  color: #1a1a2e;
}

.acct-actions {
  display: flex;
  justify-content: center;
  gap: 8px;
  border-top: 1px solid #f0f0f0;
  padding-top: 12px;
}
</style>
