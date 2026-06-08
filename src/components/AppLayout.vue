<script setup lang="ts">
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { ref, onMounted, computed, onUnmounted } from 'vue'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()
const collapsed = ref(false)
const mobileOpen = ref(false)
const windowWidth = ref(window.innerWidth)

function onResize() {
  windowWidth.value = window.innerWidth
}

const sidebarWidth = computed(() => {
  if (windowWidth.value <= 768) return '0px'
  return collapsed.value ? '68px' : '240px'
})

function closeMobileSidebar() {
  mobileOpen.value = false
}

const menuItems = [
  { path: '/dashboard', icon: 'Odometer', label: '首页' },
  { path: '/records', icon: 'Notebook', label: '账单' },
  { path: '/statistics', icon: 'DataAnalysis', label: '统计' },
  { path: '/accounts', icon: 'Wallet', label: '账户' },
  { path: '/categories', icon: 'Collection', label: '分类' },
  { path: '/profile', icon: 'User', label: '个人' },
]

async function handleLogout() {
  await auth.logout()
  router.push('/login')
}

onMounted(() => {
  window.addEventListener('resize', onResize)
  const token = localStorage.getItem('satoken')
  if (token && !auth.user) {
    auth.fetchUser()
  }
})

onUnmounted(() => {
  window.removeEventListener('resize', onResize)
})

function getIconSvg(name: string) {
  const icons: Record<string, string> = {
    Odometer: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm1-13h-2v6l5.25 3.15L17 12.23l-4-2.37V7z',
    Notebook: 'M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H8V4h12v12zM10 9h8v2h-8V9zm0 3h4v2h-4v-2zm0-6h8v2h-8V6z',
    DataAnalysis: 'M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zM7 10h2v7H7v-7zm4-3h2v10h-2V7zm4 6h2v4h-2v-4z',
    Swap: 'M6.99 11L3 15l3.99 4v-3H14v-2H6.99v-3zM21 9l-3.99-4v3H10v2h7.01v3L21 9z',
    Wallet: 'M21 18v1c0 1.1-.9 2-2 2H5c-1.11 0-2-.9-2-2V5c0-1.1.89-2 2-2h14c1.1 0 2 .9 2 2v1h-9c-1.11 0-2 .9-2 2v8c0 1.1.89 2 2 2h9zm-9-2h10V8H12v8zm4-2.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z',
    Collection: 'M22 16V4c0-1.1-.9-2-2-2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2zm-11-4l2.03 2.71L16 11l4 5H8l3-4zM2 6v14c0 1.1.9 2 2 2h14v-2H4V6H2z',
    User: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z',
  }
  return icons[name] || icons.Odometer
}
</script>

<template>
  <div class="app-shell">
    <div v-if="mobileOpen" class="sidebar-overlay" @click="closeMobileSidebar" />
    <aside :class="['sidebar', { collapsed, 'mobile-open': mobileOpen }]">
      <div class="sidebar-brand">
        <div class="brand-icon">
          <svg viewBox="0 0 48 48" width="22" height="22" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M24 4L8 14v12c0 11 7.5 21.5 16 26 8.5-4.5 16-15 16-26V14L24 4z" fill="#fff" opacity="0.15"/>
            <path d="M24 6L10 15v11c0 10 6.8 19.5 14 23.5 7.2-4 14-13.5 14-23.5V15L24 6z" stroke="#fff" stroke-width="2" stroke-linejoin="round"/>
            <circle cx="24" cy="26" r="10" stroke="#fff" stroke-width="1.5" fill="none"/>
            <path d="M30 20c-1.5-1.2-3.5-2-5.5-2C19 18 15.5 21.5 15.5 26s3.5 8 9 8c2 0 4-.8 5.5-2" stroke="#fff" stroke-width="1.8" stroke-linecap="round" fill="none"/>
          </svg>
        </div>
        <transition name="fade">
          <span v-show="!collapsed" class="brand-text">CoinSec</span>
        </transition>
      </div>

      <nav class="sidebar-nav">
        <router-link
          v-for="item in menuItems"
          :key="item.path"
          :to="item.path"
          :class="['nav-item', { active: route.path.startsWith(item.path) }]"
          @click="closeMobileSidebar"
        >
          <div class="nav-icon">
            <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
              <path :d="getIconSvg(item.icon)" />
            </svg>
          </div>
          <transition name="fade">
            <span v-show="!collapsed" class="nav-label">{{ item.label }}</span>
          </transition>
          <div v-if="!collapsed && route.path.startsWith(item.path)" class="nav-indicator" />
        </router-link>
      </nav>

      <div class="sidebar-footer">
        <div class="nav-item logout-item" @click="handleLogout">
          <div class="nav-icon">
            <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
              <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z" />
            </svg>
          </div>
          <transition name="fade">
            <span v-show="!collapsed" class="nav-label">退出</span>
          </transition>
        </div>
      </div>
    </aside>

    <button class="collapse-toggle" @click="collapsed = !collapsed">
      <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
        <path :d="collapsed ? 'M8 5v14l11-7z' : 'M16 5v14l-11-7z'" />
      </svg>
    </button>

    <main class="main-area">
      <header class="topbar">
        <div class="topbar-left">
          <button class="hamburger-btn" @click="mobileOpen = true">
            <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22"><path d="M3 6h18v2H3V6zm0 5h18v2H3v-2zm0 5h18v2H3v-2z"/></svg>
          </button>
          <h2 class="page-title">{{ menuItems.find(m => route.path.startsWith(m.path))?.label || '首页' }}</h2>
        </div>
        <div class="topbar-right">
          <div class="user-badge" @click="router.push('/profile')">
            <div class="user-avatar-small">{{ auth.user?.nickname?.charAt(0) || auth.user?.username?.charAt(0) || 'U' }}</div>
            <div class="user-text">
              <span class="user-name-small">{{ auth.user?.nickname || auth.user?.username || '用户' }}</span>
              <span v-if="auth.user?.username" class="user-sub-name">@{{ auth.user.username }}</span>
            </div>
          </div>
        </div>
      </header>

      <div class="content-area">
        <div class="content-wrapper">
          <router-view v-slot="{ Component }">
            <transition name="page" mode="out-in">
              <component :is="Component" />
            </transition>
          </router-view>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
.app-shell {
  display: flex;
  height: 100vh;
  background: var(--bg);
}

.sidebar {
  width: 240px;
  background: var(--sidebar-bg);
  display: flex;
  flex-direction: column;
  transition: width 0.35s cubic-bezier(0.4, 0, 0.2, 1);
  flex-shrink: 0;
  overflow-x: hidden;
  overflow-y: auto;
}

.sidebar::-webkit-scrollbar {
  width: 0;
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
  flex-shrink: 0;
}

.brand-icon {
  width: 32px;
  height: 32px;
  background: linear-gradient(135deg, var(--accent), var(--accent-purple));
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 14px;
  color: #fff;
  flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
}

.brand-text {
  color: #fff;
  font-size: 18px;
  font-weight: 600;
  letter-spacing: -0.3px;
  white-space: nowrap;
  overflow: hidden;
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
  text-decoration: none;
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
  overflow: hidden;
}

.nav-indicator {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--accent-light);
  position: absolute;
  right: 14px;
  box-shadow: 0 0 8px var(--accent-glow);
}

.sidebar-footer {
  padding: 8px 10px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  flex-shrink: 0;
}

.logout-item:hover {
  color: var(--expense-light);
  background: rgba(239, 68, 68, 0.08);
}

.collapse-toggle {
  position: fixed;
  bottom: 28px;
  z-index: 20;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: var(--card-bg);
  border: 1px solid var(--border);
  color: var(--text-hint);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  left: v-bind(sidebarWidth);
  margin-left: -13px;
}

.collapse-toggle:hover {
  color: var(--accent);
  border-color: var(--accent);
  box-shadow: 0 4px 12px var(--accent-glow);
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
  flex-shrink: 0;
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
  padding: 6px 14px 6px 6px;
  border-radius: 100px;
  background: var(--card-bg);
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
  cursor: pointer;
  transition: all 0.2s;
}

.user-badge:hover {
  box-shadow: 0 4px 16px rgba(0,0,0,0.1);
  transform: translateY(-1px);
}

.user-avatar-small {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--accent), var(--accent-purple));
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
  line-height: 1.2;
}

.user-sub-name {
  font-size: 11px;
  color: var(--text-secondary);
  line-height: 1;
}

.user-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.content-area {
  flex: 1;
  overflow-y: auto;
}

.content-wrapper {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 32px 32px;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
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

.sidebar-overlay {
  display: none;
}

.hamburger-btn {
  display: none;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  border: none;
  background: var(--card-bg);
  color: var(--text-primary);
  cursor: pointer;
  align-items: center;
  justify-content: center;
  box-shadow: 0 1px 3px rgba(0,0,0,0.06);
}

@media (max-width: 768px) {
  .sidebar {
    position: fixed;
    left: 0;
    top: 0;
    bottom: 0;
    z-index: 100;
    transform: translateX(-100%);
  }

  .sidebar.mobile-open {
    transform: translateX(0);
  }

  .sidebar-overlay {
    display: block;
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.4);
    z-index: 99;
  }

  .collapse-toggle {
    display: none;
  }

  .hamburger-btn {
    display: flex;
  }

  .main-area {
    width: 100%;
  }

  .topbar {
    padding: 0 16px;
  }

  .topbar-left {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .content-wrapper {
    padding: 0 16px 24px;
  }

  .user-sub-name {
    display: none;
  }
}
</style>