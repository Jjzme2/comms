<script setup lang="ts">
const props = defineProps<{ channelId: string }>()
const chatStore = useChatStore()
const el = ref<HTMLElement | null>(null)

watch(() => chatStore.messages.length, async () => {
  await nextTick()
  el.value?.scrollTo({ top: el.value.scrollHeight, behavior: 'smooth' })
})
</script>

<template>
  <div ref="el" class="flex-1 overflow-y-auto px-4 py-3 space-y-1">
    <div v-if="chatStore.messages.length === 0" class="flex items-center justify-center h-full text-cool-500 text-sm">
      No messages yet. Say hello!
    </div>
    <ChatMessageBubble
      v-for="msg in chatStore.messages"
      :key="msg.id"
      :message="msg"
    />
  </div>
</template>
