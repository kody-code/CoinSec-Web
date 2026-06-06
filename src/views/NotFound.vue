<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()
</script>

<template>
  <div class="not-found">
    <div class="not-found-card">
      <div class="error-code">404</div>
      <p class="error-msg">页面不存在</p>
      <button class="back-btn" @click="router.push('/')">返回首页</button>
    </div>
  </div>
</template>

<style scoped>
.not-found {
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg);
}

.not-found-card {
  text-align: center;
  padding: 48px;
}

.error-code {
  font-size: 96px;
  font-weight: 800;
  color: var(--accent);
  line-height: 1;
  letter-spacing: -4px;
}

.error-msg {
  font-size: 18px;
  color: var(--text-secondary);
  margin: 16px 0 32px;
}

.back-btn {
  padding: 10px 32px;
  border: none;
  border-radius: 12px;
  background: linear-gradient(135deg, var(--accent), var(--accent-purple));
  color: #fff;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.back-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 8px 20px var(--accent-glow);
}
</style>