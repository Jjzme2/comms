<script setup lang="ts">
const authStore = useAuthStore()
</script>

<template>
  <div class="flex h-screen bg-cool-950 text-cool-100 overflow-hidden">
    <AppSidebar v-if="authStore.user" />
    <main class="flex-1 flex flex-col min-w-0 overflow-hidden">
      <slot />
    </main>
  </div>
</template>
