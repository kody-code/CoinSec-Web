<script setup lang="ts">
defineProps<{
  rows?: number
}>()
</script>

<template>
  <div class="skeleton-container">
    <div class="skeleton-card" v-for="i in (rows || 2)" :key="i">
      <div class="skeleton-header">
        <div class="skeleton-line w-24" />
        <div class="skeleton-line w-16" />
      </div>
      <div class="skeleton-row" v-for="j in 3" :key="j">
        <div class="skeleton-line w-32" />
        <div class="skeleton-line w-20" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.skeleton-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}

.skeleton-card {
  background: var(--card-bg);
  border-radius: var(--card-radius);
  padding: 20px;
}

.skeleton-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
}

.skeleton-line {
  height: 14px;
  border-radius: 7px;
  background: linear-gradient(90deg, var(--border-light) 25%, var(--border) 50%, var(--border-light) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

.skeleton-line.w-24 { width: 96px; }
.skeleton-line.w-16 { width: 64px; }
.skeleton-line.w-32 { width: 128px; }
.skeleton-line.w-20 { width: 80px; }

.skeleton-row {
  display: flex;
  justify-content: space-between;
  padding: 12px 0;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
</style>