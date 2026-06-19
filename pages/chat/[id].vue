<script setup lang="ts">
const route = useRoute()
const chatStore = useChatStore()
const channelId = computed(() => route.params.id as string)
const channel = computed(() => chatStore.channels.find(c => c.id === channelId.value))

onMounted(() => {
  chatStore.subscribeChannels()
  chatStore.subscribeMessages(channelId.value)
})

watch(channelId, (id) => {
  chatStore.subscribeMessages(id)
})
</script>

<template>
  <div class="flex-1 flex flex-col min-h-0">
    <!-- Header -->
    <div class="h-12 flex items-center px-4 border-b border-cool-800 gap-2 shrink-0">
      <span class="text-cool-400 font-mono">#</span>
      <span class="font-semibold">{{ channel?.name ?? 'Loading...' }}</span>
      <span v-if="channel?.description" class="text-cool-400 text-sm ml-2 border-l border-cool-700 pl-2">
        {{ channel.description }}
      </span>
    </div>

    <!-- Messages -->
    <ChatWindow :channel-id="channelId" />

    <!-- Input -->
    <ChatMessageInput :channel-id="channelId" :channel-name="channel?.name ?? ''" />
  </div>
</template>
