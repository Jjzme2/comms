<script setup lang="ts">
const route = useRoute()
const aiStore = useAiStore()
const authStore = useAuthStore()
const kbStore = useKbStore()
const { streamChat } = useLLM()

const sessionId = computed(() => route.params.sessionId as string)
const session = computed(() => aiStore.sessions.find(s => s.id === sessionId.value))
const input = ref('')
const messagesEl = ref<HTMLElement | null>(null)
const useKbContext = useLocalStorage('ai_use_kb_context', false)

onMounted(() => {
  aiStore.subscribeSessions()
  aiStore.subscribeMessages(sessionId.value)
  kbStore.subscribeTopics()
})
onUnmounted(() => {
  aiStore.unsubscribeAll()
  kbStore.unsubscribeTopics()
})

watch(() => aiStore.messages.length, async () => {
  await nextTick()
  messagesEl.value?.scrollTo({ top: messagesEl.value.scrollHeight, behavior: 'smooth' })
})

function buildKbSystemMessage(): string {
  if (!kbStore.topics.length) return ''
  const sections = kbStore.topics.map(t => {
    const body = t.content.length > 1200 ? t.content.slice(0, 1200) + '…' : t.content
    const tags = t.tags.length ? ` [${t.tags.join(', ')}]` : ''
    return `### ${t.title}${tags}\n${body}`
  })
  return `You have access to the team's knowledge base. Use it when answering questions.\n\n## Knowledge Base\n\n${sections.join('\n\n---\n\n')}`
}

async function send() {
  const text = input.value.trim()
  if (!text || aiStore.streaming || !session.value) return
  input.value = ''

  const model = session.value.model
  const endpoint = session.value.endpoint

  await aiStore.saveMessage(sessionId.value, 'user', text, model)

  const history = aiStore.messages.map(m => ({ role: m.role, content: m.content }))

  if (useKbContext.value) {
    const sysMsg = buildKbSystemMessage()
    if (sysMsg) history.unshift({ role: 'system', content: sysMsg })
  }

  aiStore.streaming = true
  aiStore.streamingContent = ''

  try {
    for await (const chunk of streamChat(model, history)) {
      aiStore.streamingContent += chunk
    }
    await aiStore.saveMessage(sessionId.value, 'assistant', aiStore.streamingContent, model)
  } finally {
    aiStore.streaming = false
    aiStore.streamingContent = ''
  }
}
</script>

<template>
  <div class="flex-1 flex flex-col min-h-0">
    <!-- Header -->
    <div class="h-12 flex items-center px-4 border-b border-cool-800 gap-3 shrink-0">
      <NuxtLink to="/ai" class="text-cool-400 hover:text-cool-200">
        <UIcon name="i-heroicons-arrow-left" />
      </NuxtLink>
      <span class="font-semibold truncate">{{ session?.title ?? 'AI Chat' }}</span>
      <div class="ml-auto flex items-center gap-2">
        <UTooltip :text="useKbContext ? 'KB context on — topics injected as system prompt' : 'Enable KB context'">
          <UButton
            size="xs"
            :variant="useKbContext ? 'solid' : 'ghost'"
            :color="useKbContext ? 'indigo' : 'cool'"
            icon="i-heroicons-book-open"
            @click="useKbContext = !useKbContext"
          >
            KB
          </UButton>
        </UTooltip>
        <UBadge v-if="session?.model" color="cool" class="font-mono text-xs">
          {{ session.model }}
        </UBadge>
      </div>
    </div>

    <!-- Messages -->
    <div ref="messagesEl" class="flex-1 overflow-y-auto p-4 space-y-4">
      <div
        v-for="msg in aiStore.messages"
        :key="msg.id"
        :class="msg.role === 'user' ? 'flex justify-end' : 'flex justify-start'"
      >
        <div :class="[
          'max-w-[75%] rounded-xl px-4 py-2 text-sm leading-relaxed',
          msg.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-cool-800 text-cool-100',
        ]">
          <div class="whitespace-pre-wrap">{{ msg.content }}</div>
          <div class="text-xs mt-1 opacity-60 font-mono">{{ msg.model }}</div>
        </div>
      </div>

      <!-- Streaming bubble -->
      <div v-if="aiStore.streaming" class="flex justify-start">
        <div class="max-w-[75%] rounded-xl px-4 py-2 text-sm bg-cool-800 text-cool-100">
          <div class="whitespace-pre-wrap">{{ aiStore.streamingContent }}<span class="animate-pulse">▋</span></div>
          <div class="text-xs mt-1 opacity-60 font-mono">{{ session?.model }}</div>
        </div>
      </div>
    </div>

    <!-- Input -->
    <div class="px-4 pb-4 shrink-0">
      <form class="flex gap-2" @submit.prevent="send">
        <UInput
          v-model="input"
          :disabled="aiStore.streaming"
          placeholder="Ask anything…"
          class="flex-1"
          @keydown.enter.exact.prevent="send"
        />
        <UButton type="submit" :loading="aiStore.streaming" icon="i-heroicons-paper-airplane" />
      </form>
    </div>
  </div>
</template>
