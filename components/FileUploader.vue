<script setup lang="ts">
const filesStore = useFilesStore()
const fileInput = ref<HTMLInputElement | null>(null)
const tags = ref('')

async function handleFile(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  const tagList = tags.value.split(',').map(t => t.trim()).filter(Boolean)
  await filesStore.uploadFile(file, tagList)
  if (fileInput.value) fileInput.value.value = ''
  tags.value = ''
}
</script>

<template>
  <div class="flex items-center gap-2">
    <input ref="fileInput" type="file" class="hidden" @change="handleFile" />
    <UButton
      size="sm"
      icon="i-heroicons-arrow-up-tray"
      :loading="filesStore.uploading"
      @click="fileInput?.click()"
    >
      Upload
    </UButton>
  </div>
</template>
