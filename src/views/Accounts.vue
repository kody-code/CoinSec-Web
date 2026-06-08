<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getAccounts, createAccount, updateAccount, deleteAccount } from '@/api/account'
import AccountIcon from '@/components/AccountIcon.vue'
import { formatMoney } from '@/utils/format'
import { accountGradients } from '@/utils/colors'
import EmptyState from '@/components/EmptyState.vue'
import type { Account } from '@/types'
import { ElMessage, ElMessageBox } from 'element-plus'

const router = useRouter()

const accounts = ref<Account[]>([])
const loading = ref(false)
const showForm = ref(false)
const editing = ref<Account | null>(null)

const form = ref({ name: '', icon: '', balance: 0 })

const availableIcons: Record<string, string> = {
  wechat: '微信',
  alipay: '支付宝',
  payments: '现金',
  credit_card: '银行卡',
  gongshang: '工商',
  zhaoshang: '招商',
  zhongguo: '中国银行',
}

const gradients = accountGradients

async function fetchAccounts() {
  try {
    const res = await getAccounts()
    accounts.value = res.data.data
  } catch {
    // 401 handled by interceptor redirect
  }
}

function goDetail(id: number) {
  router.push(`/accounts/${id}`)
}

function openCreate() {
  editing.value = null
  form.value = { name: '', icon: '', balance: 0 }
  showForm.value = true
}

function openEdit(acct: Account) {
  editing.value = acct
  form.value = { name: acct.name, icon: acct.icon || '', balance: 0 }
  showForm.value = true
}

async function handleSave() {
  if (!form.value.name) { ElMessage.warning('请输入名称'); return }
  loading.value = true
  try {
    if (editing.value) {
      await updateAccount(editing.value.accountId, { name: form.value.name, icon: form.value.icon || undefined })
    } else {
      await createAccount({ name: form.value.name, icon: form.value.icon || undefined, balance: form.value.balance || undefined })
    }
    showForm.value = false
    ElMessage.success(editing.value ? '已更新' : '已创建')
    fetchAccounts()
  } finally { loading.value = false }
}

async function handleDelete(id: number) {
  try {
    await ElMessageBox.confirm(
      '删除账户后，该账户下的所有账单记录和转账记录将被一并删除，且无法恢复。确定删除？',
      '删除账户',
      { confirmButtonText: '删除', cancelButtonText: '取消', type: 'warning' },
    )
    await deleteAccount(id)
    ElMessage.success('已删除')
    fetchAccounts()
  } catch {}
}

onMounted(fetchAccounts)
</script>

<template>
  <div class="accounts-page">
    <div class="page-head">
      <p class="page-subtitle">管理你的资金账户</p>
    </div>

    <div class="acct-grid">
      <EmptyState v-if="accounts.length === 0" text="还没有账户" icon="account" />
      <div v-for="acct in accounts" :key="acct.accountId" class="acct-card" @click="goDetail(acct.accountId)">
        <div class="acct-top" :style="{ background: gradients[acct.accountId % 4] }">
          <div class="acct-avatar-icon">
            <AccountIcon :icon="acct.icon || 'wallet'" :size="26" />
          </div>
          <span class="acct-name">{{ acct.name }}</span>
        </div>
        <div class="acct-bottom">
          <div class="acct-balance">{{ formatMoney(acct.balance) }}</div>
          <div class="acct-actions">
            <button class="action-btn" @click.stop="openEdit(acct)">编辑</button>
            <button class="action-btn danger" @click.stop="handleDelete(acct.accountId)">删除</button>
          </div>
        </div>
      </div>
      <div class="acct-card add-card" @click="openCreate">
        <div class="add-icon">
          <svg viewBox="0 0 24 24" fill="currentColor" width="32" height="32">
            <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
          </svg>
        </div>
        <span>添加账户</span>
      </div>
    </div>

    <el-dialog v-model="showForm" :title="editing ? '编辑账户' : '新增账户'" width="380px">
      <el-form label-width="60px">
        <el-form-item label="名称">
          <el-input v-model="form.name" placeholder="如：微信" />
        </el-form-item>
        <el-form-item v-if="!editing" label="余额">
          <el-input-number v-model="form.balance" :precision="2" style="width: 100%" />
        </el-form-item>
        <el-form-item label="图标">
          <div class="icon-grid">
            <button
              v-for="(label, icon) in availableIcons"
              :key="icon"
              type="button"
              :class="['icon-option', { active: form.icon === icon }]"
              @click.stop="form.icon = icon"
            >
              <AccountIcon :icon="icon" :size="28" />
              <span class="icon-label">{{ label }}</span>
            </button>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showForm = false">取消</el-button>
        <el-button type="primary" :loading="loading" @click="handleSave">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.page-head {
  margin-bottom: 20px;
}

.page-subtitle {
  font-size: 14px;
  color: var(--text-secondary);
  margin: 0;
}

.acct-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 12px;
}

.acct-card {
  background: #fff;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
  transition: all 0.2s;
}

.acct-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0,0,0,0.08);
}

.acct-top {
  padding: 20px;
  color: #fff;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.acct-avatar-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(255,255,255,0.25);
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(4px);
}

.acct-name {
  font-size: 15px;
  font-weight: 600;
}

.acct-bottom {
  padding: 14px 18px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.acct-balance {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-primary);
}

.acct-actions {
  display: flex;
  gap: 4px;
}

.action-btn {
  padding: 4px 10px;
  border-radius: 6px;
  border: none;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  font-family: inherit;
background: var(--border-light);
  color: var(--text-secondary);
}

.action-btn:hover { background: var(--border); }
.action-btn.danger { color: var(--expense); }
.action-btn.danger:hover { background: var(--expense-bg); }

.add-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 40px 20px;
  border: 2px dashed var(--border);
  background: transparent;
  box-shadow: none;
  cursor: pointer;
  color: var(--text-secondary);
  font-size: 14px;
  font-weight: 500;
}

.add-card:hover {
  border-color: var(--accent);
  color: var(--accent);
  background: var(--accent-bg);
}

.add-icon {
  opacity: 0.5;
}

.icon-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  width: 100%;
}

.icon-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 10px 4px;
  border-radius: 10px;
  border: 1px solid var(--border);
  background: #fff;
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
}

.icon-option:hover {
  border-color: var(--accent);
  background: var(--accent-bg);
}

.icon-option.active {
  border-color: var(--accent);
  background: var(--accent-bg);
  box-shadow: 0 0 0 2px var(--accent-glow);
}

.icon-label {
  font-size: 10px;
  color: var(--text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

.icon-none {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--border-light);
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 600;
}

@media (max-width: 768px) {
  .account-grid { grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 10px; }
}


</style>
