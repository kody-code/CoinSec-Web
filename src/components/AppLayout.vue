<script setup lang="ts">
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { Expand, Fold } from '@element-plus/icons-vue'
import { ref, computed } from 'vue'

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

const activeIcon = computed(() => {
  const item = menuItems.find(m => route.path.startsWith(m.path))
  return item?.icon || 'Odometer'
})

function handleLogout() {
  auth.clearToken()
  router.push('/login')
}

function getIconSvg(name: string) {
  const icons: Record<string, string> = {
    Odometer: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm1-13h-2v6l5.25 3.15L17 12.23l-4-2.37V7z',
    Notebook: 'M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H8V4h12v12zM10 9h8v2h-8V9zm0 3h4v2h-4v-2zm0-6h8v2h-8V6z',
    DataAnalysis: 'M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zM7 10h2v7H7v-7zm4-3h2v10h-2V7zm4 6h2v4h-2v-4z',
    Wallet: 'M21 18v1c0 1.1-.9 2-2 2H5c-1.11 0-2-.9-2-2V5c0-1.1.89-2 2-2h14c1.1 0 2 .9 2 2v1h-9c-1.11 0-2 .9-2 2v8c0 1.1.89 2 2 2h9zm-9-2h10V8H12v8zm4-2.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z',
    Collection: 'M22 16V4c0-1.1-.9-2-2-2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2zm-11-4l2.03 2.71L16 11l4 5H8l3-4zM2 6v14c0 1.1.9 2 2 2h14v-2H4V6H2z',
    User: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z',
  }
  return icons[name] || icons.Odometer
}
</script>

<template>
  <div class="app-shell">
    <aside :class="['sidebar', { collapsed }]">
      <div class="sidebar-brand">
        <div class="brand-icon">C</div>
        <span v-show="!collapsed" class="brand-text">CoinSec</span>
      </div>

      <nav class="sidebar-nav">
        <div
          v-for="item in menuItems"
          :key="item.path"
          :class="['nav-item', { active: route.path.startsWith(item.path) }]"
          @click="router.push(item.path)"
        >
          <div class="nav-icon">
            <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
              <path :d="getIconSvg(item.icon)" />
            </svg>
          </div>
          <span v-show="!collapsed" class="nav-label">{{ item.label }}</span>
          <div v-show="!collapsed && route.path.startsWith(item.path)" class="nav-indicator" />
        </div>
      </nav>

      <div class="sidebar-footer">
        <div class="nav-item" @click="handleLogout">
          <div class="nav-icon">
            <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
              <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z" />
            </svg>
          </div>
          <span v-show="!collapsed" class="nav-label">退出</span>
        </div>
      </div>

      <button class="collapse-btn" @click="collapsed = !collapsed">
        <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
          <path :d="collapsed ? 'M8 5v14l11-7z' : 'M16 5v14l-11-7z'" />
        </svg>
      </button>
    </aside>

    <main class="main-area">
      <header class="topbar">
        <div class="topbar-left">
          <h2 class="page-title">{{ menuItems.find(m => route.path.startsWith(m.path))?.label || '首页' }}</h2>
        </div>
        <div class="topbar-right">
          <div class="user-badge">
            <div class="user-avatar-small">{{ auth.user?.nickname?.charAt(0) || 'U' }}</div>
            <span class="user-name-small">{{ auth.user?.nickname || '用户' }}</span>
          </div>
        </div>
      </header>

      <div class="content-area">
        <router-view v-slot="{ Component }">
          <transition name="page" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </div>
    </main>
  </div>
</template>

<style scoped>
.app-shell {
  display: flex;
  height: 100vh;
  background: #f8f9fc;
}

.sidebar {
  width: 240px;
  background: var(--sidebar-bg);
  display: flex;
  flex-direction: column;
  position: relative;
  transition: width 0.35s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
  flex-shrink: 0;
}

.sidebar.collapsed {
  width: 68px;
}

.sidebar-brand {
  height: 64px;
  display: flex;
  align-items: center;
  padding: 0 18px;
  gap: 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.brand-icon {
  width: 32px;
  height: 32px;
  background: linear-gradient(135deg, var(--accent), #a855f7);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 14px;
  color: #fff;
  flex-shrink: 0;
}

.brand-text {
  color: #fff;
  font-size: 18px;
  font-weight: 600;
  letter-spacing: -0.3px;
  white-space: nowrap;
}

.sidebar-nav {
  flex: 1;
  padding: 12px 10px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  border-radius: 10px;
  color: var(--sidebar-text);
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  white-space: nowrap;
}

.nav-item:hover {
  color: var(--sidebar-text-active);
  background: var(--sidebar-hover);
}

.nav-item.active {
  color: var(--sidebar-text-active);
  background: var(--sidebar-active);
}

.nav-icon {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.nav-label {
  font-size: 14px;
  font-weight: 500;
}

.nav-indicator {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: var(--accent-light);
  position: absolute;
  right: 12px;
  box-shadow: 0 0 8px var(--accent-glow);
}

.sidebar-footer {
  padding: 8px 10px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}

.collapse-btn {
  position: absolute;
  bottom: 16px;
  right: -12px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--sidebar-bg);
  border: 2px solid rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.5);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  z-index: 10;
}

.collapse-btn:hover {
  color: #fff;
  border-color: var(--accent);
}

.main-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.topbar {
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 32px;
  background: transparent;
}

.page-title {
  font-size: 20px;
  font-weight: 600;
  color: var(--text-primary);
  letter-spacing: -0.3px;
}

.user-badge {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 12px 6px 6px;
  border-radius: 100px;
  background: var(--card-bg);
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
  cursor: pointer;
  transition: box-shadow 0.2s;
}

.user-badge:hover {
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
}

.user-avatar-small {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--accent), #a855f7);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 600;
}

.user-name-small {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
}

.content-area {
  flex: 1;
  padding: 0 32px 32px;
  overflow-y: auto;
}

.page-enter-active,
.page-leave-active {
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.page-enter-from {
  opacity: 0;
  transform: translateY(12px);
}

.page-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
