<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { RouterView, useRouter, useRoute } from 'vue-router'
import { App } from '@capacitor/app'

const router = useRouter()
const route = useRoute()
let backListener: { remove: () => void } | null = null

onMounted(async () => {
  backListener = await App.addListener('backButton', () => {
    if (route.name && route.name !== 'Dashboard') {
      router.replace('/dashboard')
    } else {
      App.exitApp()
    }
  })
})

onUnmounted(() => {
  backListener?.remove()
})
</script>

<template>
  <RouterView />
</template>
