<script setup lang="ts">
const filesStore = useFilesStore()
const search = ref('')
const typeFilter = ref('')

onMounted(() => filesStore.subscribe())
onUnmounted(() => filesStore.unsubscribe())

const filtered = computed(() => {
  let list = filesStore.files
  if (typeFilter.value === 'image') list = list.filter(f => f.type.startsWith('image/'))
  if (typeFilter.value === 'doc') list = list.filter(f => !f.type.startsWith('image/'))
  if (search.value) {
    const q = search.value.toLowerCase()
    list = list.filter(f => f.name.toLowerCase().includes(q))
  }
  return list
})

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}
</script>

<template>
  <div class="flex-1 flex flex-col min-h-0">
    <div class="h-12 flex items-center px-4 border-b border-cool-800 shrink-0 gap-3">
      <h1 class="font-semibold">Files</h1>
      <div class="ml-auto flex items-center gap-2">
        <UInput v-model="search" placeholder="Search files..." icon="i-heroicons-magnifying-glass" size="sm" />
        <USelect v-model="typeFilter" :options="[{ label: 'All', value: '' }, { label: 'Images', value: 'image' }, { label: 'Documents', value: 'doc' }]" size="sm" />
        <FileUploader />
      </div>
    </div>

    <div class="flex-1 overflow-y-auto p-4">
      <div v-if="filtered.length === 0" class="flex items-center justify-center h-full text-cool-500">
        No files yet.
      </div>
      <div v-else class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3">
        <FileCard
          v-for="file in filtered"
          :key="file.id"
          :file="file"
          :format-size="formatSize"
        />
      </div>
    </div>
  </div>
</template>
