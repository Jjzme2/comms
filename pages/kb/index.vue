<script setup lang="ts">
const kbStore = useKbStore()

const search = ref('')
const activeTag = ref<string | null>(null)

onMounted(() => kbStore.subscribeTopics())
onUnmounted(() => kbStore.unsubscribeTopics())

const allTags = computed(() => {
  const set = new Set<string>()
  kbStore.topics.forEach(t => t.tags.forEach(tag => set.add(tag)))
  return [...set].sort()
})

const filtered = computed(() => {
  let list = kbStore.topics
  if (activeTag.value) list = list.filter(t => t.tags.includes(activeTag.value!))
  if (search.value.trim()) {
    const q = search.value.toLowerCase()
    list = list.filter(t =>
      t.title.toLowerCase().includes(q) ||
      t.tags.some(tag => tag.toLowerCase().includes(q))
    )
  }
  return list
})
</script>

<template>
  <div class="flex-1 flex flex-col min-h-0">
    <div class="h-12 flex items-center px-4 border-b border-cool-800 gap-3 shrink-0">
      <h1 class="font-semibold">Knowledge Base</h1>
      <NuxtLink to="/kb/new" class="ml-auto">
        <UButton size="sm" icon="i-heroicons-plus">New Topic</UButton>
      </NuxtLink>
    </div>

    <div class="flex-1 overflow-y-auto p-4 space-y-4">
      <!-- Search + tag filter -->
      <div class="flex flex-col sm:flex-row gap-2">
        <UInput
          v-model="search"
          icon="i-heroicons-magnifying-glass"
          placeholder="Search topics…"
          class="flex-1"
        />
      </div>

      <div v-if="allTags.length" class="flex flex-wrap gap-1.5">
        <UButton
          size="xs"
          :variant="activeTag === null ? 'solid' : 'ghost'"
          @click="activeTag = null"
        >
          All
        </UButton>
        <UButton
          v-for="tag in allTags"
          :key="tag"
          size="xs"
          :variant="activeTag === tag ? 'solid' : 'ghost'"
          @click="activeTag = activeTag === tag ? null : tag"
        >
          {{ tag }}
        </UButton>
      </div>

      <div v-if="filtered.length === 0" class="flex items-center justify-center py-16 text-cool-500">
        {{ kbStore.topics.length === 0 ? 'No topics yet. Create the first one!' : 'No topics match your search.' }}
      </div>

      <div v-else class="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <NuxtLink
          v-for="topic in filtered"
          :key="topic.id"
          :to="`/kb/${topic.id}`"
        >
          <KbTopicCard :topic="topic" />
        </NuxtLink>
      </div>
    </div>
  </div>
</template>
