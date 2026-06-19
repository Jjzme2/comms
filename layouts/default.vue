<script setup lang="ts">
const authStore = useAuthStore()
const sidebarOpen = useMobileSidebar()
const route = useRoute()

watch(() => route.path, () => {
  sidebarOpen.value = false
})
</script>

<template>
  <div class="flex h-dvh bg-cool-950 text-cool-100 overflow-hidden">
    <AppSidebar v-if="authStore.user" />

    <!-- Mobile backdrop -->
    <Transition
      enter-active-class="transition-opacity duration-200"
      enter-from-class="opacity-0"
      leave-active-class="transition-opacity duration-200"
      leave-to-class="opacity-0"
    >
      <div
        v-if="authStore.user && sidebarOpen"
        class="fixed inset-0 bg-black/50 z-30 md:hidden"
        @click="sidebarOpen = false"
      />
    </Transition>

    <main class="flex-1 flex flex-col min-w-0 overflow-hidden">
      <!-- Mobile top bar -->
      <div v-if="authStore.user" class="md:hidden h-12 flex items-center px-3 border-b border-cool-800 bg-cool-900 shrink-0 gap-3">
        <button
          class="text-cool-400 hover:text-cool-200 p-1 -ml-1 touch-manipulation"
          type="button"
          @click="sidebarOpen = true"
        >
          <UIcon name="i-heroicons-bars-3" class="w-5 h-5" />
        </button>
        <span class="font-bold tracking-tight text-indigo-400">comms</span>
      </div>
      <slot />
    </main>
  </div>
</template>
