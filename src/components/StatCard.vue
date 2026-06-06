<script setup lang="ts">
defineProps<{
  label: string
  value: string
  icon: string
  variant: 'income' | 'expense' | 'balance'
}>()
</script>

<template>
  <div class="stat-card" :class="variant">
    <div class="stat-icon">
      <svg v-if="icon === 'up'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="22" height="22"><path d="M12 19V5M5 12l7-7 7 7"/></svg>
      <svg v-else-if="icon === 'down'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="22" height="22"><path d="M12 5v14M5 12l7 7 7-7"/></svg>
      <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="22" height="22"><path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/><path d="M9 12h6M12 9v6"/></svg>
    </div>
    <div class="stat-content">
      <div class="stat-label">{{ label }}</div>
      <div class="stat-value">{{ value }}</div>
    </div>
  </div>
</template>

<style scoped>
.stat-card {
  padding: 20px;
  border-radius: var(--card-radius);
  color: #fff;
  display: flex;
  align-items: center;
  gap: 16px;
  position: relative;
  overflow: hidden;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 24px rgba(0,0,0,0.15);
}

.stat-card::after {
  content: '';
  position: absolute;
  top: -30px;
  right: -20px;
  width: 100px;
  height: 100px;
  background: rgba(255,255,255,0.08);
  border-radius: 50%;
}

.stat-card.income { background: linear-gradient(135deg, var(--income-dark), var(--income-light)); }
.stat-card.expense { background: linear-gradient(135deg, var(--warning-dark), var(--warning-light)); }
.stat-card.balance { background: linear-gradient(135deg, var(--accent-dark), var(--accent-light)); }

.stat-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: rgba(255,255,255,0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  backdrop-filter: blur(4px);
}

.stat-content { flex: 1; min-width: 0; }
.stat-label { font-size: 13px; opacity: 0.85; font-weight: 500; margin-bottom: 4px; }
.stat-value { font-size: 24px; font-weight: 700; letter-spacing: -0.5px; }
</style>