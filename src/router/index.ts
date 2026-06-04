import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'Login',
      component: () => import('@/views/Login.vue'),
      meta: { requiresAuth: false },
    },
    {
      path: '/',
      component: () => import('@/components/AppLayout.vue'),
      meta: { requiresAuth: true },
      children: [
        { path: '', redirect: '/dashboard' },
        { path: 'dashboard', name: 'Dashboard', component: () => import('@/views/Dashboard.vue') },
        { path: 'records', name: 'Records', component: () => import('@/views/Records.vue') },
        { path: 'records/new', name: 'NewRecord', component: () => import('@/views/RecordForm.vue') },
        { path: 'statistics', name: 'Statistics', component: () => import('@/views/Statistics.vue') },
        { path: 'accounts', name: 'Accounts', component: () => import('@/views/Accounts.vue') },
        { path: 'categories', name: 'Categories', component: () => import('@/views/Categories.vue') },
        { path: 'profile', name: 'Profile', component: () => import('@/views/Profile.vue') },
      ],
    },
  ],
})

router.beforeEach((to, _from, next) => {
  const auth = useAuthStore()
  if (to.meta.requiresAuth !== false) {
    if (auth.checkLogin()) {
      next()
    } else {
      next('/login')
    }
  } else {
    next()
  }
})

export default router
