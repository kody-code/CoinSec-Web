<script setup lang="ts">
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { Menu as MenuIcon, Expand, Fold } from '@element-plus/icons-vue'
import { ref } from 'vue'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()
const collapsed = ref(false)

const menuItems = [
  { path: '/dashboard', icon: 'Odometer', label: '首页' },
  { path: '/records', icon: 'Notebook', label: '账单' },
  { path: '/statistics', icon: 'DataAnalysis', label: '统计' },
  { path: '/accounts', icon: 'Wallet', label: '账户' },
  { path: '/categories', icon: 'Collection', label: '分类' },
  { path: '/profile', icon: 'User', label: '个人' },
]

function handleLogout() {
  auth.clearToken()
  router.push('/login')
}
</script>

<template>
  <el-container class="app-container">
    <el-aside :width="collapsed ? '64px' : '220px'" class="app-aside">
      <div class="aside-header">
        <span v-if="!collapsed" class="logo-text">CoinSec</span>
        <span v-else class="logo-mini">C</span>
      </div>
      <el-menu
        :default-active="route.path"
        :collapse="collapsed"
        router
        class="aside-menu"
      >
        <el-menu-item
          v-for="item in menuItems"
          :key="item.path"
          :index="item.path"
        >
          <el-icon><component :is="item.icon" /></el-icon>
          <template #title>{{ item.label }}</template>
        </el-menu-item>
      </el-menu>
    </el-aside>

    <el-container>
      <el-header class="app-header">
        <div class="header-left">
          <el-button
            :icon="collapsed ? Expand : Fold"
            text
            @click="collapsed = !collapsed"
          />
        </div>
        <div class="header-right">
          <span class="user-name">{{ auth.user?.nickname || '用户' }}</span>
          <el-button type="danger" text @click="handleLogout">退出</el-button>
        </div>
      </el-header>

      <el-main class="app-main">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<style scoped>
.app-container {
  height: 100vh;
}

.app-aside {
  background: #1a1a2e;
  transition: width 0.3s;
  overflow: hidden;
}

.aside-header {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 22px;
  font-weight: 700;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.logo-mini {
  font-size: 24px;
}

.aside-menu {
  border-right: none;
  background: transparent;
}

.aside-menu .el-menu-item {
  color: rgba(255, 255, 255, 0.65);
}

.aside-menu .el-menu-item:hover {
  background: rgba(255, 255, 255, 0.08);
}

.aside-menu .el-menu-item.is-active {
  color: #409eff;
  background: rgba(64, 158, 255, 0.1);
}

.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #fff;
  border-bottom: 1px solid #ebeef5;
  padding: 0 20px;
  height: 60px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-name {
  font-size: 14px;
  color: #333;
}

.app-main {
  background: #f5f7fa;
  padding: 20px;
  overflow-y: auto;
}
</style>
