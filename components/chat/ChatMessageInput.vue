<script setup lang="ts">
const props = defineProps<{ channelId: string; channelName: string }>()
const chatStore = useChatStore()
const filesStore = useFilesStore()
const authStore = useAuthStore()

const text = ref('')
const fileInput = ref<HTMLInputElement | null>(null)
const uploading = ref(false)

async function send() {
  const t = text.value.trim()
  if (!t) return
  text.value = ''
  await chatStore.sendMessage(props.channelId, t, { type: 'text' })
}

async function handleFile(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  uploading.value = true
  try {
    const user = authStore.user!
    const r2Key = `chat/${props.channelId}/${Date.now()}-${file.name}`

    const { url } = await $fetch<{ url: string }>('/api/r2/presign', {
      method: 'POST',
      body: { key: r2Key, contentType: file.type },
    })

    await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': file.type },
      body: file,
    })

    const type = file.type.startsWith('image/') ? 'image' : 'file'
    await chatStore.sendMessage(props.channelId, '', {
      type,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      r2Key,
    })
  } finally {
    uploading.value = false
    if (fileInput.value) fileInput.value.value = ''
  }
}
</script>

<template>
  <div class="px-4 pb-4 shrink-0">
    <div class="flex items-end gap-2 bg-cool-800 rounded-xl px-3 py-2">
      <button
        class="text-cool-400 hover:text-cool-200 p-1 rounded transition-colors"
        type="button"
        @click="fileInput?.click()"
      >
        <UIcon name="i-heroicons-paper-clip" class="w-5 h-5" />
      </button>
      <input ref="fileInput" type="file" class="hidden" @change="handleFile" />

      <textarea
        v-model="text"
        :placeholder="`Message #${channelName}…`"
        rows="1"
        class="flex-1 bg-transparent outline-none resize-none text-sm text-cool-100 placeholder-cool-500 leading-relaxed max-h-32"
        @keydown.enter.exact.prevent="send"
        @input="($el as HTMLTextAreaElement).style.height = 'auto'; ($el as HTMLTextAreaElement).style.height = ($el as HTMLTextAreaElement).scrollHeight + 'px'"
      />

      <button
        :disabled="!text.trim() && !uploading"
        class="text-indigo-400 hover:text-indigo-300 disabled:opacity-30 p-1 rounded transition-colors"
        type="button"
        @click="send"
      >
        <UIcon v-if="!uploading" name="i-heroicons-paper-airplane" class="w-5 h-5" />
        <UIcon v-else name="i-heroicons-arrow-path" class="w-5 h-5 animate-spin" />
      </button>
    </div>
  </div>
</template>
