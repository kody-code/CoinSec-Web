<script setup lang="ts">
withDefaults(defineProps<{
  icon?: string
  text?: string
  actionText?: string
}>(), {
  icon: 'empty',
  text: '暂无数据',
  actionText: '',
})

const emit = defineEmits<{
  action: []
}>()

const svgMap: Record<string, string> = {
  empty: 'M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zM14 2v6h6M16 13H8M16 17H8M10 9H8',
  records: 'M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zM14 2v6h6M16 13H8M16 17H8M10 9H8',
  category: 'M22 16V4c0-1.1-.9-2-2-2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2zm-11-4l2.03 2.71L16 11l4 5H8l3-4zM2 6v14c0 1.1.9 2 2 2h14v-2H4V6H2z',
  account: 'M21 18v1c0 1.1-.9 2-2 2H5c-1.11 0-2-.9-2-2V5c0-1.1.89-2 2-2h14c1.1 0 2 .9 2 2v1h-9c-1.11 0-2 .9-2 2v8c0 1.1.89 2 2 2h9zm-9-2h10V8H12v8zm4-2.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z',
}
</script>

<template>
  <div class="empty-state">
    <div class="empty-icon">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="36" height="36">
        <path :d="svgMap[icon] || svgMap.empty" />
      </svg>
    </div>
    <p class="empty-text">{{ text }}</p>
    <button v-if="actionText" class="empty-btn" @click="emit('action')">{{ actionText }}</button>
  </div>
</template>

<style scoped>
.empty-state {
  text-align: center;
  padding: 40px 20px;
}

.empty-icon {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: var(--border-light);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16px;
  color: var(--text-secondary);
}

.empty-text {
  font-size: 14px;
  color: var(--text-secondary);
  margin: 0 0 16px;
}

.empty-btn {
  padding: 8px 20px;
  border-radius: 10px;
  border: none;
  background: linear-gradient(135deg, var(--accent), var(--accent-purple));
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.2s;
}

.empty-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px var(--accent-glow);
}
</style>