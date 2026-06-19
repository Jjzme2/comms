<script setup lang="ts">
const store = useQuicklinksStore()
const showAdd = ref(false)
const form = reactive({ title: '', url: '', description: '', tags: '' })
const adding = ref(false)

onMounted(() => store.subscribe())
onUnmounted(() => store.unsubscribe())

async function addLink() {
  if (!form.title || !form.url) return
  adding.value = true
  try {
    await store.addLink({
      title: form.title,
      url: form.url,
      description: form.description || undefined,
      tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
    })
    Object.assign(form, { title: '', url: '', description: '', tags: '' })
    showAdd.value = false
  } finally {
    adding.value = false
  }
}
</script>

<template>
  <div class="flex-1 flex flex-col min-h-0">
    <div class="flex flex-wrap items-center px-4 gap-2 border-b border-cool-800 shrink-0 min-h-12 py-2">
      <h1 class="font-semibold mr-auto">Quick Links</h1>
      <UInput v-model="store.search" placeholder="Search…" icon="i-heroicons-magnifying-glass" size="sm" class="w-36 sm:w-48" />
      <UButton size="sm" icon="i-heroicons-plus" @click="showAdd = true">Add link</UButton>
    </div>

    <!-- Tag filter bar -->
    <div v-if="store.allTags.length" class="flex gap-2 px-4 py-2 border-b border-cool-800 overflow-x-auto shrink-0">
      <UBadge
        :color="store.activeTag === '' ? 'indigo' : 'cool'"
        class="cursor-pointer"
        @click="store.activeTag = ''"
      >All</UBadge>
      <UBadge
        v-for="tag in store.allTags"
        :key="tag"
        :color="store.activeTag === tag ? 'indigo' : 'cool'"
        class="cursor-pointer"
        @click="store.activeTag = store.activeTag === tag ? '' : tag"
      >{{ tag }}</UBadge>
    </div>

    <div class="flex-1 overflow-y-auto p-4">
      <div v-if="store.filteredLinks.length === 0" class="flex items-center justify-center h-full text-cool-500">
        No links yet.
      </div>
      <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        <LinkCard
          v-for="link in store.filteredLinks"
          :key="link.id"
          :link="link"
          @delete="store.deleteLink(link.id)"
        />
      </div>
    </div>

    <!-- Add Link Modal -->
    <UModal v-model="showAdd">
      <UCard>
        <template #header><h3 class="font-semibold">Add Quick Link</h3></template>
        <form class="space-y-3" @submit.prevent="addLink">
          <UFormGroup label="Title" required>
            <UInput v-model="form.title" placeholder="My awesome tool" required />
          </UFormGroup>
          <UFormGroup label="URL" required>
            <UInput v-model="form.url" type="url" placeholder="https://..." required />
          </UFormGroup>
          <UFormGroup label="Description">
            <UInput v-model="form.description" placeholder="What is it?" />
          </UFormGroup>
          <UFormGroup label="Tags (comma separated)">
            <UInput v-model="form.tags" placeholder="dev, tools, ai" />
          </UFormGroup>
          <div class="flex justify-end gap-2 pt-2">
            <UButton variant="ghost" type="button" @click="showAdd = false">Cancel</UButton>
            <UButton type="submit" :loading="adding">Add</UButton>
          </div>
        </form>
      </UCard>
    </UModal>
  </div>
</template>
