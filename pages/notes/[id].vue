<script setup lang="ts">
import { marked } from 'marked'

const route = useRoute()
const notesStore = useNotesStore()
const authStore = useAuthStore()

const noteId = computed(() => route.params.id as string)
const note = computed(() => notesStore.notes.find(n => n.id === noteId.value))
const isOwn = computed(() => note.value?.authorId === authStore.user?.uid)

const title = ref('')
const content = ref('')
const preview = ref(false)
const saving = ref(false)
const shareAll = ref(false)

watch(note, (n) => {
  if (n) {
    title.value = n.title
    content.value = n.content
    shareAll.value = n.sharedWith === 'all'
  }
}, { immediate: true })

const rendered = computed(() => marked(content.value))

const debouncedSave = useDebounceFn(async () => {
  if (!isOwn.value) return
  saving.value = true
  await notesStore.saveNote(noteId.value, {
    title: title.value,
    content: content.value,
    sharedWith: shareAll.value ? 'all' : [],
  })
  saving.value = false
}, 800)

watch([title, content, shareAll], debouncedSave)

onMounted(() => notesStore.subscribe())
</script>

<template>
  <div class="flex-1 flex flex-col min-h-0">
    <!-- Toolbar -->
    <div class="h-12 flex items-center px-4 border-b border-cool-800 gap-3 shrink-0">
      <NuxtLink to="/notes" class="text-cool-400 hover:text-cool-200">
        <UIcon name="i-heroicons-arrow-left" />
      </NuxtLink>
      <input
        v-model="title"
        class="flex-1 bg-transparent font-semibold outline-none text-cool-100 placeholder-cool-600"
        placeholder="Note title"
        :disabled="!isOwn"
      />
      <span v-if="saving" class="text-xs text-cool-500">Saving…</span>
      <UToggle v-if="isOwn" v-model="shareAll" label="Share with all" />
      <!-- Preview toggle only on mobile -->
      <UButton
        v-if="isOwn"
        size="sm"
        :variant="preview ? 'solid' : 'ghost'"
        class="md:hidden"
        @click="preview = !preview"
      >
        {{ preview ? 'Edit' : 'Preview' }}
      </UButton>
    </div>

    <!-- Split pane on md+, single pane with toggle on mobile -->
    <div class="flex-1 min-h-0 flex">
      <!-- Editor: hidden on mobile when preview is on, always visible on md+ -->
      <div
        :class="[
          'flex-1 min-w-0 overflow-y-auto p-4',
          preview ? 'hidden md:flex md:flex-col' : 'flex flex-col',
          'md:border-r md:border-cool-800',
        ]"
      >
        <textarea
          v-if="isOwn"
          v-model="content"
          class="w-full flex-1 min-h-[60vh] md:min-h-0 bg-transparent outline-none resize-none text-cool-200 font-mono text-sm leading-relaxed placeholder-cool-600"
          placeholder="Write in Markdown…"
        />
        <div v-else class="text-cool-200 font-mono text-sm leading-relaxed whitespace-pre-wrap">{{ content }}</div>
      </div>

      <!-- Preview: mobile toggle, always visible on md+ -->
      <div
        :class="[
          'flex-1 min-w-0 overflow-y-auto p-4',
          preview ? 'block' : 'hidden md:block',
        ]"
      >
        <!-- eslint-disable-next-line vue/no-v-html -->
        <div class="prose prose-invert prose-sm max-w-none" v-html="rendered" />
        <p v-if="!content" class="text-cool-600 text-sm italic">Preview will appear here…</p>
      </div>
    </div>
  </div>
</template>
