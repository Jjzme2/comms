<script setup lang="ts">
const chatStore = useChatStore()

watch(() => chatStore.channels, (channels) => {
  if (channels.length > 0) {
    const general = channels.find(c => c.name === 'general') ?? channels[0]
    navigateTo(`/chat/${general!.id}`, { replace: true })
  }
}, { immediate: true })

onMounted(async () => {
  chatStore.subscribeChannels()
  await chatStore.ensureGeneralChannel()
})
</script>

<template>
  <div class="flex-1 flex items-center justify-center text-cool-500">
    <UIcon name="i-heroicons-arrow-path" class="mr-2 animate-spin" />
    Loading...
  </div>
</template>
