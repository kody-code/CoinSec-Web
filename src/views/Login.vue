<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { login as loginApi, setup as setupApi } from '@/api/auth'
import { getUserInfo } from '@/api/user'
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
  try {
    await getUserInfo()
    router.push('/dashboard')
  } catch {
    // not initialized or not logged in
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
    // error handled by interceptor
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="login-page">
    <div class="login-card">
      <div class="login-header">
        <h1 class="title">CoinSec</h1>
        <p class="subtitle">个人记账管理</p>
      </div>

      <el-form @submit.prevent="handleSubmit" class="login-form">
        <el-form-item label="用户名">
          <el-input
            v-model="form.username"
            placeholder="请输入用户名"
            size="large"
          />
        </el-form-item>

        <el-form-item label="密码">
          <el-input
            v-model="form.password"
            type="password"
            placeholder="请输入密码"
            size="large"
            show-password
          />
        </el-form-item>

        <el-form-item v-if="isSetup" label="确认密码">
          <el-input
            v-model="form.confirmPassword"
            type="password"
            placeholder="再次输入密码"
            size="large"
            show-password
          />
        </el-form-item>

        <el-form-item>
          <el-button
            type="primary"
            size="large"
            :loading="loading"
            class="submit-btn"
            @click="handleSubmit"
          >
            {{ isSetup ? '初始化' : '登录' }}
          </el-button>
        </el-form-item>
      </el-form>

      <div class="login-footer">
        <el-button text @click="isSetup = !isSetup">
          {{ isSetup ? '已有账号？去登录' : '首次使用？初始化管理员' }}
        </el-button>
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
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
}

.login-card {
  width: 400px;
  padding: 40px;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.login-header {
  text-align: center;
  margin-bottom: 32px;
}

.title {
  font-size: 28px;
  font-weight: 700;
  color: #1a1a2e;
  margin: 0;
}

.subtitle {
  font-size: 14px;
  color: #999;
  margin-top: 8px;
}

.login-form {
  margin-bottom: 16px;
}

.submit-btn {
  width: 100%;
}
</style>
