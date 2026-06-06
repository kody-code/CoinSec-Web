<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { updateNickname, updatePassword } from '@/api/user'
import { ElMessage } from 'element-plus'

const auth = useAuthStore()
const nickVal = ref('')
const pwForm = ref({ oldPassword: '', newPassword: '', confirmPassword: '' })
const nickLoading = ref(false)
const pwLoading = ref(false)

async function saveNickname() {
  if (!nickVal.value) { ElMessage.warning('请输入昵称'); return }
  nickLoading.value = true
  try {
    await updateNickname({ nickname: nickVal.value })
    await auth.fetchUser()
    ElMessage.success('昵称已更新')
  } finally { nickLoading.value = false }
}

async function savePassword() {
  if (!pwForm.value.oldPassword || !pwForm.value.newPassword) { ElMessage.warning('请填写完整'); return }
  if (pwForm.value.newPassword !== pwForm.value.confirmPassword) { ElMessage.warning('两次密码不一致'); return }
  pwLoading.value = true
  try {
    await updatePassword({ oldPassword: pwForm.value.oldPassword, newPassword: pwForm.value.newPassword })
    ElMessage.success('密码已修改')
    pwForm.value = { oldPassword: '', newPassword: '', confirmPassword: '' }
  } finally { pwLoading.value = false }
}

onMounted(() => { if (auth.user) nickVal.value = auth.user.nickname || '' })
</script>

<template>
  <div class="profile-page">
    <div class="profile-hero">
      <div class="profile-avatar-large">{{ auth.user?.nickname?.charAt(0) || 'U' }}</div>
      <div class="profile-info">
        <h2>{{ auth.user?.nickname || '用户' }}</h2>
        <p class="profile-username">@{{ auth.user?.username }}</p>
      </div>
    </div>

    <div class="profile-card">
      <div class="card-icon-row">
        <div class="card-icon-wrap nickname">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
        </div>
        <div class="card-content">
          <span class="card-label">昵称</span>
          <span class="card-value">{{ auth.user?.nickname || '未设置' }}</span>
        </div>
      </div>
      <div class="card-edit-row">
        <input v-model="nickVal" placeholder="输入新昵称" class="field-input" />
        <button class="save-btn" :disabled="nickLoading" @click="saveNickname">
          {{ nickLoading ? '保存中...' : '保存' }}
        </button>
      </div>
    </div>

    <div class="profile-card">
      <div class="card-icon-row">
        <div class="card-icon-wrap password">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
        </div>
        <div class="card-content">
          <span class="card-label">密码</span>
          <span class="card-value">••••••••</span>
        </div>
      </div>
      <div class="card-edit-row stacked">
        <input v-model="pwForm.oldPassword" type="password" placeholder="原密码" class="field-input" />
        <input v-model="pwForm.newPassword" type="password" placeholder="新密码" class="field-input" />
        <input v-model="pwForm.confirmPassword" type="password" placeholder="确认新密码" class="field-input" />
        <button class="save-btn" :disabled="pwLoading" @click="savePassword">
          {{ pwLoading ? '修改中...' : '修改密码' }}
        </button>
      </div>
    </div>

    <div class="profile-card info-card">
      <div class="info-row">
        <span class="info-label">用户名</span>
        <span class="info-value">{{ auth.user?.username }}</span>
      </div>
      <div class="info-row">
        <span class="info-label">注册时间</span>
        <span class="info-value">{{ auth.user?.createTime ? new Date(auth.user.createTime).toLocaleDateString('zh-CN') : '—' }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.profile-page {
  max-width: 640px;
  margin: 0 auto;
}

.profile-hero {
  display: flex;
  align-items: center;
  gap: 18px;
  margin-bottom: 24px;
  padding: 24px;
  background: linear-gradient(135deg, var(--accent-dark), var(--accent-deep), var(--accent-purple));
  border-radius: 20px;
  color: #fff;
  position: relative;
  overflow: hidden;
}

.profile-hero::after {
  content: '';
  position: absolute;
  top: -30px;
  right: -20px;
  width: 120px;
  height: 120px;
  background: rgba(255,255,255,0.06);
  border-radius: 50%;
}

.profile-avatar-large {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: rgba(255,255,255,0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 26px;
  font-weight: 700;
  flex-shrink: 0;
  backdrop-filter: blur(4px);
  border: 2px solid rgba(255,255,255,0.1);
  position: relative;
  z-index: 1;
}

.profile-info h2 {
  font-size: 20px;
  font-weight: 600;
  margin: 0;
  position: relative;
  z-index: 1;
}

.profile-username {
  font-size: 14px;
  opacity: 0.7;
  margin: 4px 0 0;
  position: relative;
  z-index: 1;
}

.profile-card {
  background: #fff;
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 12px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
}

.card-icon-row {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 16px;
}

.card-icon-wrap {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.card-icon-wrap.nickname {
  background: var(--accent-bg);
  color: var(--accent);
}

.card-icon-wrap.password {
  background: var(--expense-bg);
  color: var(--expense);
}

.card-content {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.card-label {
  font-size: 12px;
  color: var(--text-secondary);
  font-weight: 500;
}

.card-value {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
}

.card-edit-row {
  display: flex;
  gap: 10px;
}

.card-edit-row.stacked {
  flex-direction: column;
}

.field-input {
  flex: 1;
  padding: 10px 14px;
  border-radius: 10px;
  border: 1px solid var(--border);
  font-size: 14px;
  font-family: inherit;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
  color: var(--text-primary);
  background: var(--bg);
}

.field-input:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-glow);
  background: #fff;
}

.save-btn {
  padding: 10px 22px;
  border-radius: 10px;
  border: none;
  background: linear-gradient(135deg, var(--accent), var(--accent-purple));
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.save-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px var(--accent-glow);
}

.save-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.info-card {
  margin-top: 4px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 0;
}

.info-row + .info-row {
  border-top: 1px solid var(--border-light);
}

.info-label {
  font-size: 14px;
  color: var(--text-secondary);
}

.info-value {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
}

@media (max-width: 768px) {
  .profile-page { max-width: 100%; }
}
</style>