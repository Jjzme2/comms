<script setup lang="ts">
const aiStore = useAiStore()
const { endpoint, provider, listModels } = useLLM()

const models = ref<{ id: string; name: string }[]>([])
const selectedModel = ref('')
const creating = ref(false)

onMounted(async () => {
  aiStore.subscribeSessions()
  models.value = await listModels()
  if (models.value.length) selectedModel.value = models.value[0]!.id
})
onUnmounted(() => aiStore.unsubscribeAll())

async function newSession() {
  if (!selectedModel.value) return
  creating.value = true
  try {
    const id = await aiStore.createSession(selectedModel.value, endpoint.value, provider.value)
    await navigateTo(`/ai/${id}`)
  } finally {
    creating.value = false
  }
}
</script>

<template>
  <div class="flex-1 flex flex-col min-h-0">
    <div class="h-12 flex items-center px-4 border-b border-cool-800 gap-3 shrink-0">
      <h1 class="font-semibold">AI Chat</h1>
    </div>

    <div class="flex-1 overflow-y-auto p-4 flex flex-col sm:flex-row gap-4">
      <!-- Sessions list -->
      <div class="flex flex-col gap-2 w-full sm:w-60 sm:shrink-0">
        <h2 class="text-xs font-semibold uppercase tracking-wider text-cool-500 mb-1">Past conversations</h2>
        <NuxtLink
          v-for="s in aiStore.sessions"
          :key="s.id"
          :to="`/ai/${s.id}`"
          class="block px-3 py-2 rounded-lg hover:bg-cool-800 text-sm truncate"
        >
          <div class="truncate">{{ s.title }}</div>
          <div class="text-xs text-cool-500 truncate">{{ s.model }}</div>
        </NuxtLink>
        <div v-if="!aiStore.sessions.length" class="text-cool-600 text-sm">None yet.</div>
      </div>

      <!-- New session panel -->
      <div class="flex-1 flex flex-col items-center justify-center gap-4 max-w-sm mx-auto">
        <UIcon name="i-heroicons-cpu-chip" class="text-4xl text-cool-600" />
        <h2 class="text-lg font-semibold">Start a conversation</h2>

        <UFormGroup label="LLM Endpoint" class="w-full">
          <UInput v-model="endpoint" placeholder="http://localhost:11434" />
        </UFormGroup>

        <UFormGroup label="Model" class="w-full">
          <USelect
            v-model="selectedModel"
            :options="models.map(m => ({ label: m.name, value: m.id }))"
            placeholder="Select a model…"
          />
        </UFormGroup>

        <UButton :disabled="!selectedModel" :loading="creating" block @click="newSession">
          Start chat
        </UButton>

        <p class="text-xs text-cool-500 text-center">
          Models are loaded from your local LLM runtime at the configured endpoint.
          Make sure Ollama or LM Studio is running.
        </p>
      </div>
    </div>
  </div>
</template>
