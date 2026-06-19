<script setup lang="ts">
const notesStore = useNotesStore()
const authStore = useAuthStore()
const creating = ref(false)

onMounted(() => notesStore.subscribe())
onUnmounted(() => notesStore.unsubscribe())

async function newNote() {
  creating.value = true
  try {
    const id = await notesStore.createNote()
    await navigateTo(`/notes/${id}`)
  } finally {
    creating.value = false
  }
}

function isOwn(note: { authorId: string }) {
  return note.authorId === authStore.user?.uid
}
</script>

<template>
  <div class="flex-1 flex flex-col min-h-0">
    <div class="h-12 flex items-center px-4 border-b border-cool-800 shrink-0">
      <h1 class="font-semibold">Notes</h1>
      <UButton class="ml-auto" size="sm" icon="i-heroicons-plus" :loading="creating" @click="newNote">
        New note
      </UButton>
    </div>

    <div class="flex-1 overflow-y-auto p-4">
      <div v-if="notesStore.notes.length === 0" class="flex items-center justify-center h-full text-cool-500">
        No notes yet.
      </div>
      <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <NuxtLink
          v-for="note in notesStore.notes"
          :key="note.id"
          :to="`/notes/${note.id}`"
        >
          <NoteCard :note="note" :is-own="isOwn(note)" />
        </NuxtLink>
      </div>
    </div>
  </div>
</template>
