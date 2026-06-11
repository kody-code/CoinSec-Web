<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { login as loginApi, setup as setupApi } from '@/api/auth'
import { ElMessage } from 'element-plus'

const router = useRouter()
const auth = useAuthStore()
const isSetup = ref(false)
const loading = ref(false)

const form = ref({
  username: '',
  password: '',
  confirmPassword: '',
})

onMounted(async () => {
  const token = localStorage.getItem('satoken')
  if (!token) return
  try {
    await auth.fetchUser()
    router.push('/dashboard')
  } catch {
    // token invalid, stay on login
  }
})

async function handleSubmit() {
  if (!form.value.username || !form.value.password) {
    ElMessage.warning('请填写完整信息')
    return
  }
  if (isSetup.value && form.value.password !== form.value.confirmPassword) {
    ElMessage.warning('两次密码不一致')
    return
  }

  loading.value = true
  try {
    const api = isSetup.value ? setupApi : loginApi
    const res = await api({
      username: form.value.username,
      password: form.value.password,
    })
    auth.setToken(res.data.data.token)
    await auth.fetchUser()
    ElMessage.success(isSetup.value ? '初始化成功' : '登录成功')
    router.push('/dashboard')
  } catch {
    // handled by interceptor
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="login-page">
    <div class="login-bg">
      <div class="bg-orb orb-1" />
      <div class="bg-orb orb-2" />
      <div class="bg-orb orb-3" />
    </div>

    <div class="login-container">
      <div class="login-brand">
        <div class="brand-icon">
          <svg viewBox="0 0 200 200" width="96" height="96" xmlns="http://www.w3.org/2000/svg">
            <circle cx="100" cy="100" r="96" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="4"/>
            <circle cx="100" cy="100" r="84" fill="#F0F9FF"/>
            <rect x="40" y="44" width="54" height="112" rx="10" fill="#93C5FD"/>
            <rect x="106" y="44" width="54" height="112" rx="10" fill="#67E8F9"/>
            <rect x="52" y="62" width="30" height="4" rx="2" fill="#FFFFFF" opacity="0.8"/>
            <rect x="52" y="74" width="22" height="4" rx="2" fill="#FFFFFF" opacity="0.8"/>
            <rect x="118" y="62" width="30" height="4" rx="2" fill="#FFFFFF" opacity="0.8"/>
            <rect x="126" y="74" width="22" height="4" rx="2" fill="#FFFFFF" opacity="0.8"/>
            <path d="M67 98 L72 101 L72 108 Q72 116, 67 119 Q62 116, 62 108 L62 101 Z" fill="#FFFFFF" opacity="0.9"/>
            <polyline points="64,108 67,112 72,105" fill="none" stroke="#93C5FD" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
            <line x1="130" y1="118" x2="130" y2="98" stroke="#FFFFFF" stroke-width="5" stroke-linecap="round" opacity="0.9"/>
            <path d="M122 106 L130 95 L138 106" fill="none" stroke="#FFFFFF" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" opacity="0.9"/>
          </svg>
        </div>
        <h1 class="brand-title">CoinSec</h1>
        <p class="brand-subtitle">智慧管理每一笔</p>
      </div>

      <div class="login-card">
        <h2 class="card-title">{{ isSetup ? '初始化管理员' : '欢迎回来' }}</h2>
        <p class="card-desc">{{ isSetup ? '创建你的第一个账号' : '登录以继续使用' }}</p>

        <form @submit.prevent="handleSubmit" class="login-form">
          <div class="input-group">
            <label class="input-label">用户名</label>
            <div class="input-wrapper">
              <svg class="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
              <input
                v-model="form.username"
                placeholder="输入用户名"
                class="input-field"
              />
            </div>
          </div>

          <div class="input-group">
            <label class="input-label">密码</label>
            <div class="input-wrapper">
              <svg class="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              <input
                v-model="form.password"
                type="password"
                placeholder="输入密码"
                class="input-field"
              />
            </div>
          </div>

          <div v-if="isSetup" class="input-group">
            <label class="input-label">确认密码</label>
            <div class="input-wrapper">
              <svg class="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              <input
                v-model="form.confirmPassword"
                type="password"
                placeholder="再次输入密码"
                class="input-field"
              />
            </div>
          </div>

          <button type="button" class="submit-btn" :disabled="loading" @click="handleSubmit">
            <span v-if="!loading">{{ isSetup ? '创建账号' : '登录' }}</span>
            <span v-else class="loading-dots">处理中<span>.</span><span>.</span><span>.</span></span>
          </button>
        </form>

        <div class="login-switch">
          <button class="switch-btn" @click="isSetup = !isSetup">
            {{ isSetup ? '已有账号？去登录 →' : '首次使用？初始化 →' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.login-page {
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  background: #f5f6fa;
}

.login-bg {
  position: absolute;
  inset: 0;
  overflow: hidden;
}

.bg-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.18;
  animation: float 20s ease-in-out infinite;
}

.orb-1 {
  width: 500px;
  height: 500px;
  background: var(--accent);
  top: -10%;
  left: -10%;
}

.orb-2 {
  width: 400px;
  height: 400px;
  background: var(--accent-purple);
  bottom: -15%;
  right: -10%;
  animation-delay: -7s;
}

.orb-3 {
  width: 300px;
  height: 300px;
  background: var(--income);
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  animation-delay: -14s;
}

@keyframes float {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33% { transform: translate(30px, -30px) scale(1.05); }
  66% { transform: translate(-20px, 20px) scale(0.95); }
}

.login-container {
  position: relative;
  z-index: 1;
  text-align: center;
}

.login-brand {
  margin-bottom: 32px;
}

.brand-icon {
  width: 112px;
  height: 112px;
  background: transparent;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  font-weight: 700;
  color: #fff;
  margin: 0 auto 16px;
}

.brand-title {
  font-size: 28px;
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: -0.5px;
  margin: 0;
}

.brand-subtitle {
  font-size: 14px;
  color: var(--text-secondary);
  margin-top: 6px;
}

.login-card {
  width: 380px;
  padding: 32px;
  background: #fff;
  border-radius: 20px;
  border: 1px solid var(--border-light);
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
  text-align: left;
}

.card-title {
  font-size: 20px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 4px;
}

.card-desc {
  font-size: 14px;
  color: var(--text-secondary);
  margin: 0 0 24px;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.input-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary);
}

.input-wrapper {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 14px;
  height: 44px;
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 12px;
  transition: all 0.2s;
}

.input-wrapper:focus-within {
  border-color: var(--accent);
  background: #fff;
  box-shadow: 0 0 0 3px var(--accent-glow);
}

.input-icon {
  color: var(--text-hint);
  flex-shrink: 0;
}

.input-field {
  flex: 1;
  background: none;
  border: none;
  outline: none;
  color: var(--text-primary);
  font-size: 14px;
  font-family: inherit;
}

.input-field::placeholder {
  color: var(--text-hint);
}

.submit-btn {
  width: 100%;
  height: 44px;
  border: none;
  border-radius: 12px;
  background: linear-gradient(135deg, var(--accent), var(--accent-purple));
  color: #fff;
  font-size: 15px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.2s;
  margin-top: 6px;
}

.submit-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 8px 20px var(--accent-glow);
}

.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.loading-dots span {
  animation: dots 1.4s infinite;
  opacity: 0;
}

.loading-dots span:nth-child(2) { animation-delay: 0.2s; }
.loading-dots span:nth-child(3) { animation-delay: 0.4s; }

@keyframes dots {
  0%, 100% { opacity: 0; }
  50% { opacity: 1; }
}

.login-switch {
  text-align: center;
  margin-top: 20px;
}

.switch-btn {
  background: none;
  border: none;
  color: var(--text-secondary);
  font-size: 13px;
  font-family: inherit;
  cursor: pointer;
  transition: color 0.2s;
}

.switch-btn:hover {
  color: var(--accent);
}
</style>
