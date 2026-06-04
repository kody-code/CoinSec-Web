<script setup lang="ts">
defineProps<{
  icon: string
  size?: number
}>()
</script>

<template>
  <span
    class="category-icon material-symbols-rounded"
    :style="{ fontSize: (size || 20) + 'px' }"
  >
    {{ icon || 'help' }}
  </span>
</template>

<style scoped>
.category-icon {
  font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 20;
  user-select: none;
  line-height: 1;
}
</style>
