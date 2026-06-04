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
      <div class="profile-avatar">{{ auth.user?.nickname?.charAt(0) || 'U' }}</div>
      <div class="profile-info">
        <h2>{{ auth.user?.nickname || '用户' }}</h2>
        <p>@{{ auth.user?.username }}</p>
      </div>
    </div>

    <div class="section-card">
      <div class="section-title">修改昵称</div>
      <div class="section-body">
        <input v-model="nickVal" placeholder="新昵称" class="field-input" />
        <button class="save-btn" :disabled="nickLoading" @click="saveNickname">
          {{ nickLoading ? '保存中...' : '保存' }}
        </button>
      </div>
    </div>

    <div class="section-card">
      <div class="section-title">修改密码</div>
      <div class="section-body stacked">
        <input v-model="pwForm.oldPassword" type="password" placeholder="原密码" class="field-input" />
        <input v-model="pwForm.newPassword" type="password" placeholder="新密码" class="field-input" />
        <input v-model="pwForm.confirmPassword" type="password" placeholder="确认密码" class="field-input" />
        <button class="save-btn" :disabled="pwLoading" @click="savePassword">
          {{ pwLoading ? '修改中...' : '修改密码' }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.profile-page {
  max-width: 420px;
  margin: 0 auto;
}

.profile-hero {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
  padding: 20px;
  background: linear-gradient(135deg, #6366f1, #a855f7);
  border-radius: 20px;
  color: #fff;
}

.profile-avatar {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: rgba(255,255,255,0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  font-weight: 700;
  flex-shrink: 0;
  backdrop-filter: blur(4px);
}

.profile-info h2 {
  font-size: 20px;
  font-weight: 600;
  margin: 0;
}

.profile-info p {
  font-size: 14px;
  opacity: 0.7;
  margin: 4px 0 0;
}

.section-card {
  background: #fff;
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 12px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
}

.section-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 14px;
}

.section-body {
  display: flex;
  gap: 10px;
}

.section-body.stacked {
  flex-direction: column;
}

.field-input {
  flex: 1;
  padding: 10px 14px;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
  font-size: 14px;
  font-family: inherit;
  outline: none;
  transition: border-color 0.2s;
  color: var(--text-primary);
}

.field-input:focus {
  border-color: var(--accent);
}

.save-btn {
  padding: 10px 20px;
  border-radius: 10px;
  border: none;
  background: linear-gradient(135deg, var(--accent), #a855f7);
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.save-btn:hover:not(:disabled) {
  box-shadow: 0 4px 12px var(--accent-glow);
}

.save-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
