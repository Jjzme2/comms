<script setup lang="ts">
const feedbackStore = useFeedbackStore()
const authStore = useAuthStore()

if (!authStore.isAdmin) await navigateTo('/')

onMounted(() => feedbackStore.subscribe())
onUnmounted(() => feedbackStore.unsubscribe())

const typeColors: Record<string, string> = {
  bug: 'red',
  feature: 'indigo',
  general: 'cool',
}

const typeLabels: Record<string, string> = {
  bug: 'Bug',
  feature: 'Feature Request',
  general: 'General',
}

const statusColors: Record<string, string> = {
  open: 'yellow',
  'in-progress': 'blue',
  done: 'green',
}

function formatDate(d: Date) {
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(d)
}
</script>

<template>
  <div class="flex-1 flex flex-col min-h-0">
    <div class="h-12 flex items-center px-4 border-b border-cool-800 shrink-0">
      <h1 class="font-semibold">Feedback & Feature Requests</h1>
      <UBadge class="ml-2" color="cool">{{ feedbackStore.items.length }}</UBadge>
    </div>

    <div class="flex-1 overflow-y-auto p-4">
      <div v-if="feedbackStore.items.length === 0" class="flex items-center justify-center h-full text-cool-500">
        No feedback yet.
      </div>
      <div v-else class="space-y-3 max-w-3xl mx-auto">
        <div
          v-for="item in feedbackStore.items"
          :key="item.id"
          class="bg-cool-800 border border-cool-700 rounded-xl p-4 space-y-2"
        >
          <div class="flex items-start justify-between gap-3">
            <div class="flex items-center gap-2 flex-wrap">
              <UBadge :color="typeColors[item.type]" size="sm">{{ typeLabels[item.type] }}</UBadge>
              <UBadge :color="statusColors[item.status]" size="sm" variant="subtle">{{ item.status }}</UBadge>
              <span class="font-medium text-cool-100">{{ item.title }}</span>
            </div>
            <span class="text-xs text-cool-500 shrink-0">{{ formatDate(item.createdAt) }}</span>
          </div>
          <p class="text-sm text-cool-300 whitespace-pre-wrap">{{ item.description }}</p>
          <p class="text-xs text-cool-500">— {{ item.authorName }}</p>
        </div>
      </div>
    </div>
  </div>
</template>
