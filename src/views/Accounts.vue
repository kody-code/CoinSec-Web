<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getAccounts, createAccount, updateAccount, deleteAccount } from '@/api/account'
import type { Account } from '@/types'
import { ElMessage, ElMessageBox } from 'element-plus'

const accounts = ref<Account[]>([])
const loading = ref(false)
const showForm = ref(false)
const editing = ref<Account | null>(null)

const form = ref({ name: '', icon: '', balance: 0 })

const gradients = ['linear-gradient(135deg, #6366f1, #818cf8)', 'linear-gradient(135deg, #10b981, #34d399)', 'linear-gradient(135deg, #f59e0b, #fbbf24)', 'linear-gradient(135deg, #ef4444, #f87171)']

function formatMoney(val: number) {
  return '¥' + val.toLocaleString('zh-CN', { minimumFractionDigits: 2 })
}

async function fetchAccounts() {
  const res = await getAccounts()
  accounts.value = res.data.data
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
      await updateAccount(editing.value.accountId, { name: form.value.name })
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
    await ElMessageBox.confirm('确定删除？')
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
      <div v-for="acct in accounts" :key="acct.accountId" class="acct-card">
        <div class="acct-top" :style="{ background: gradients[acct.accountId % 4] }">
          <span class="acct-icon">
            {{ ['💳', '📱', '💰', '🏦'][acct.accountId % 4] }}
          </span>
          <span class="acct-name">{{ acct.name }}</span>
        </div>
        <div class="acct-bottom">
          <div class="acct-balance">{{ formatMoney(acct.balance) }}</div>
          <div class="acct-actions">
            <button class="action-btn" @click="openEdit(acct)">编辑</button>
            <button class="action-btn danger" @click="handleDelete(acct.accountId)">删除</button>
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

    <div v-if="showForm" class="modal-overlay" @click.self="showForm = false">
      <div class="modal-card">
        <h3>{{ editing ? '编辑账户' : '新增账户' }}</h3>
        <div class="modal-body">
          <input v-model="form.name" placeholder="名称" class="modal-input" />
          <input v-if="!editing" v-model="form.balance" type="number" placeholder="初始余额" class="modal-input" />
        </div>
        <div class="modal-footer">
          <button class="modal-btn cancel" @click="showForm = false">取消</button>
          <button class="modal-btn confirm" :disabled="loading" @click="handleSave">保存</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.accounts-page {
  max-width: 600px;
  margin: 0 auto;
}

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
  grid-template-columns: repeat(2, 1fr);
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

.acct-icon {
  font-size: 28px;
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
  background: #f1f5f9;
  color: #64748b;
  transition: all 0.2s;
}

.action-btn:hover { background: #e2e8f0; }
.action-btn.danger { color: #ef4444; }
.action-btn.danger:hover { background: #fef2f2; }

.add-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 40px 20px;
  border: 2px dashed #e2e8f0;
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
  background: #eef2ff;
}

.add-icon {
  opacity: 0.5;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  backdrop-filter: blur(4px);
}

.modal-card {
  background: #fff;
  border-radius: 20px;
  padding: 24px;
  width: 360px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.15);
}

.modal-card h3 {
  font-size: 17px;
  font-weight: 600;
  margin: 0 0 16px;
  color: var(--text-primary);
}

.modal-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 20px;
}

.modal-input {
  padding: 12px 14px;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
  font-size: 14px;
  font-family: inherit;
  outline: none;
  transition: border-color 0.2s;
}

.modal-input:focus {
  border-color: var(--accent);
}

.modal-footer {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.modal-btn {
  padding: 8px 20px;
  border-radius: 10px;
  border: none;
  font-size: 14px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.2s;
}

.modal-btn.cancel {
  background: #f1f5f9;
  color: #64748b;
}

.modal-btn.confirm {
  background: var(--accent);
  color: #fff;
}

.modal-btn.confirm:hover {
  box-shadow: 0 4px 12px var(--accent-glow);
}
</style>
