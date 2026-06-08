<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { Capacitor } from '@capacitor/core'

const iconCache = new Map<string, string>()
const ICON_BASE = Capacitor.isNativePlatform()
  ? 'https://coinsec.site/api'
  : (import.meta.env.VITE_API_BASE_URL as string || '/api')

const props = withDefaults(defineProps<{
  icon: string
  size?: number
}>(), {
  size: 24,
})

const svgContent = ref('')
const failed = ref(false)

async function loadIcon() {
  if (!props.icon) { failed.value = true; return }

  if (iconCache.has(props.icon)) {
    svgContent.value = iconCache.get(props.icon)!
    failed.value = false
    return
  }

  try {
    const res = await fetch(`${ICON_BASE}/icons/${props.icon}.svg`)
    if (!res.ok) throw new Error('not found')
    const raw = await res.text()
    const cleaned = raw
      .replace(/<\?xml[^>]*\?>/, '')
      .replace(/<!DOCTYPE[^>]*>/, '')
      .replace(/\s+width="[^"]*"/, '')
      .replace(/\s+height="[^"]*"/, '')
    iconCache.set(props.icon, cleaned)
    svgContent.value = cleaned
    failed.value = false
  } catch {
    failed.value = true
  }
}

watch(() => props.icon, loadIcon)
onMounted(loadIcon)
</script>

<template>
  <span
    v-if="svgContent"
    class="account-icon"
    v-html="svgContent"
    :style="{ width: size + 'px', height: size + 'px' }"
  />
  <span
    v-else
    class="account-icon fallback"
    :style="{ width: size + 'px', height: size + 'px', fontSize: (size * 0.5) + 'px' }"
  >
    {{ props.icon?.charAt(0).toUpperCase() || '?' }}
  </span>
</template>

<style scoped>
.account-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  pointer-events: none;
}

.account-icon :deep(svg) {
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.fallback {
  border-radius: 50%;
  background: var(--border-light);
  color: var(--text-secondary);
  font-weight: 600;
  line-height: 1;
}
</style>