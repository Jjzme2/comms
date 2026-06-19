<script setup lang="ts">
import type { FileItem } from '~/types'

const props = defineProps<{
  file: FileItem
  formatSize: (n: number) => string
}>()

const filesStore = useFilesStore()
const authStore = useAuthStore()

const isImage = computed(() => props.file.type.startsWith('image/'))
const isOwn = computed(() => props.file.uploadedBy === authStore.user?.uid)
const previewUrl = ref<string | null>(null)

onMounted(async () => {
  if (isImage.value) {
    previewUrl.value = await filesStore.getFileUrl(props.file.r2Key)
  }
})

async function open() {
  const url = await filesStore.getFileUrl(props.file.r2Key)
  window.open(url, '_blank')
}
</script>

<template>
  <div
    class="bg-cool-800 rounded-xl overflow-hidden border border-cool-700 cursor-pointer hover:border-indigo-500/50 transition-colors group"
    @click="open"
  >
    <div class="aspect-square flex items-center justify-center bg-cool-900 relative overflow-hidden">
      <img
        v-if="isImage && previewUrl"
        :src="previewUrl"
        :alt="file.name"
        class="object-cover w-full h-full"
      />
      <UIcon
        v-else
        :name="isImage ? 'i-heroicons-photo' : 'i-heroicons-document'"
        class="text-4xl text-cool-600"
      />
      <div class="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
        <UIcon name="i-heroicons-arrow-down-tray" class="text-white opacity-0 group-hover:opacity-100 transition-opacity text-xl" />
      </div>
    </div>
    <div class="p-2">
      <div class="text-xs text-cool-200 truncate">{{ file.name }}</div>
      <div class="flex items-center justify-between mt-0.5">
        <span class="text-xs text-cool-500">{{ formatSize(file.size) }}</span>
        <button
          v-if="isOwn"
          class="text-cool-600 hover:text-red-400 transition-colors"
          @click.stop="filesStore.deleteFile(file.id)"
        >
          <UIcon name="i-heroicons-trash" class="w-3 h-3" />
        </button>
      </div>
      <div class="flex flex-wrap gap-1 mt-1">
        <span v-for="tag in file.tags" :key="tag" class="text-[10px] bg-cool-700 text-cool-400 rounded px-1">{{ tag }}</span>
      </div>
    </div>
  </div>
</template>
