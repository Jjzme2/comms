<script setup lang="ts">
import { marked } from 'marked'

const kbStore = useKbStore()

const title = ref('')
const content = ref('')
const tagsInput = ref('')
const preview = ref(false)
const submitting = ref(false)
const uploadingImage = ref(false)
const imageInput = ref<HTMLInputElement | null>(null)
const textarea = ref<HTMLTextAreaElement | null>(null)

const rendered = computed(() => marked(content.value))

async function submit() {
  if (!title.value.trim() || !content.value.trim()) return
  submitting.value = true
  try {
    const tags = tagsInput.value.split(',').map(t => t.trim()).filter(Boolean)
    const id = await kbStore.createTopic(title.value.trim(), content.value, tags)
    await navigateTo(`/kb/${id}`)
  } finally {
    submitting.value = false
  }
}

async function handleImageUpload(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return

  uploadingImage.value = true
  try {
    const url = await kbStore.uploadImage(file)
    insertAtCursor(`![${file.name}](${url})`)
  } finally {
    uploadingImage.value = false
    if (imageInput.value) imageInput.value.value = ''
  }
}

function insertAtCursor(text: string) {
  const el = textarea.value
  if (!el) {
    content.value += text
    return
  }
  const start = el.selectionStart ?? content.value.length
  const end = el.selectionEnd ?? content.value.length
  content.value = content.value.slice(0, start) + text + content.value.slice(end)
  nextTick(() => {
    el.selectionStart = el.selectionEnd = start + text.length
    el.focus()
  })
}
</script>

<template>
  <div class="flex-1 flex flex-col min-h-0">
    <div class="h-12 flex items-center px-4 border-b border-cool-800 gap-3 shrink-0">
      <NuxtLink to="/kb" class="text-cool-400 hover:text-cool-200">
        <UIcon name="i-heroicons-arrow-left" />
      </NuxtLink>
      <span class="font-semibold">New Topic</span>
      <div class="ml-auto flex gap-2">
        <!-- Mobile-only toggle -->
        <UButton size="sm" :variant="preview ? 'solid' : 'ghost'" class="md:hidden" @click="preview = !preview">
          {{ preview ? 'Edit' : 'Preview' }}
        </UButton>
        <UButton
          size="sm"
          :loading="submitting"
          :disabled="!title.trim() || !content.trim()"
          @click="submit"
        >
          Publish
        </UButton>
      </div>
    </div>

    <!-- Meta fields -->
    <div class="px-4 pt-4 pb-2 border-b border-cool-800 space-y-2 shrink-0 max-w-3xl w-full mx-auto">
      <UInput
        v-model="title"
        placeholder="Topic title…"
        size="lg"
        class="text-lg font-semibold"
      />
      <UInput
        v-model="tagsInput"
        placeholder="Tags: local-ai, tooling, setup (comma-separated)"
        size="sm"
      />
    </div>

    <!-- Split pane -->
    <div class="flex-1 min-h-0 flex">
      <!-- Editor -->
      <div
        :class="[
          'flex-1 min-w-0 flex flex-col',
          preview ? 'hidden md:flex' : 'flex',
          'md:border-r md:border-cool-800',
        ]"
      >
        <!-- Toolbar -->
        <div class="flex items-center gap-1 px-2 py-1 bg-cool-800 border-b border-cool-700 shrink-0">
          <input
            ref="imageInput"
            type="file"
            accept="image/*"
            class="hidden"
            @change="handleImageUpload"
          />
          <UButton
            size="xs"
            variant="ghost"
            :loading="uploadingImage"
            icon="i-heroicons-photo"
            @click="imageInput?.click()"
          >
            Image
          </UButton>
          <span class="text-xs text-cool-600 ml-auto">Markdown</span>
        </div>
        <textarea
          ref="textarea"
          v-model="content"
          class="flex-1 bg-cool-950 outline-none resize-none text-cool-200 font-mono text-sm leading-relaxed placeholder-cool-600 p-3"
          placeholder="Write your topic in Markdown…"
        />
      </div>

      <!-- Preview -->
      <div
        :class="[
          'flex-1 min-w-0 overflow-y-auto p-4',
          preview ? 'block' : 'hidden md:block',
        ]"
      >
        <!-- eslint-disable-next-line vue/no-v-html -->
        <div class="prose prose-invert prose-sm max-w-none" v-html="rendered" />
        <p v-if="!content" class="text-cool-600 text-sm italic">Preview will appear here as you type…</p>
      </div>
    </div>
  </div>
</template>
