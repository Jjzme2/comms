<script setup lang="ts">
import { marked } from 'marked'

const route = useRoute()
const kbStore = useKbStore()
const authStore = useAuthStore()

const topicId = computed(() => route.params.id as string)
const topic = computed(() => kbStore.topics.find(t => t.id === topicId.value))
const isAuthor = computed(() => topic.value?.authorId === authStore.user?.uid)
const isAdmin = computed(() => authStore.isAdmin)

const editing = ref(false)
const editTitle = ref('')
const editContent = ref('')
const editTags = ref('')
const saving = ref(false)
const uploadingImage = ref(false)
const imageInput = ref<HTMLInputElement | null>(null)
const editorTextarea = ref<HTMLTextAreaElement | null>(null)

const mobilePreview = ref(false)

const newComment = ref('')
const submittingComment = ref(false)

watch(topic, (t) => {
  if (t && !editing.value) {
    editTitle.value = t.title
    editContent.value = t.content
    editTags.value = t.tags.join(', ')
  }
}, { immediate: true })

function startEdit() {
  if (!topic.value) return
  editTitle.value = topic.value.title
  editContent.value = topic.value.content
  editTags.value = topic.value.tags.join(', ')
  editing.value = true
  mobilePreview.value = false
}

async function saveEdit() {
  if (!editTitle.value.trim()) return
  saving.value = true
  try {
    const tags = editTags.value.split(',').map(t => t.trim()).filter(Boolean)
    await kbStore.saveTopic(topicId.value, {
      title: editTitle.value.trim(),
      content: editContent.value,
      tags,
    })
    editing.value = false
  } finally {
    saving.value = false
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
  const el = editorTextarea.value
  if (!el) {
    editContent.value += text
    return
  }
  const start = el.selectionStart ?? editContent.value.length
  const end = el.selectionEnd ?? editContent.value.length
  editContent.value = editContent.value.slice(0, start) + text + editContent.value.slice(end)
  nextTick(() => {
    el.selectionStart = el.selectionEnd = start + text.length
    el.focus()
  })
}

async function deleteTopic() {
  if (!confirm('Delete this topic and all its comments?')) return
  await kbStore.deleteTopic(topicId.value)
  await navigateTo('/kb')
}

async function submitComment() {
  if (!newComment.value.trim()) return
  submittingComment.value = true
  try {
    await kbStore.addComment(topicId.value, newComment.value.trim())
    newComment.value = ''
  } finally {
    submittingComment.value = false
  }
}

onMounted(() => {
  kbStore.subscribeTopics()
  kbStore.subscribeComments(topicId.value)
})
onUnmounted(() => {
  kbStore.unsubscribeTopics()
  kbStore.unsubscribeComments()
})

const rendered = computed(() => marked(editing.value ? editContent.value : (topic.value?.content ?? '')))

const rootComments = computed(() => kbStore.comments.filter(c => !c.parentId))
const repliesFor = (commentId: string) => kbStore.comments.filter(c => c.parentId === commentId)

function formatDate(d: Date) {
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) +
    ' at ' + d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
}
</script>

<template>
  <div class="flex-1 flex flex-col min-h-0">
    <!-- Header -->
    <div class="h-12 flex items-center px-4 border-b border-cool-800 gap-3 shrink-0">
      <NuxtLink to="/kb" class="text-cool-400 hover:text-cool-200">
        <UIcon name="i-heroicons-arrow-left" />
      </NuxtLink>

      <div v-if="topic" class="ml-auto flex items-center gap-2">
        <UButton
          v-if="isAdmin"
          size="xs"
          :variant="topic.pinned ? 'solid' : 'ghost'"
          :icon="topic.pinned ? 'i-heroicons-bookmark-solid' : 'i-heroicons-bookmark'"
          @click="kbStore.togglePin(topic.id, !topic.pinned)"
        >
          {{ topic.pinned ? 'Pinned' : 'Pin' }}
        </UButton>
        <template v-if="isAuthor">
          <UButton v-if="!editing" size="sm" variant="ghost" icon="i-heroicons-pencil" @click="startEdit">Edit</UButton>
          <template v-else>
            <!-- Mobile-only preview toggle -->
            <UButton size="sm" :variant="mobilePreview ? 'solid' : 'ghost'" class="md:hidden" @click="mobilePreview = !mobilePreview">
              {{ mobilePreview ? 'Edit' : 'Preview' }}
            </UButton>
            <UButton size="sm" variant="ghost" @click="editing = false">Cancel</UButton>
            <UButton size="sm" :loading="saving" @click="saveEdit">Save</UButton>
          </template>
          <UButton size="sm" variant="ghost" color="red" icon="i-heroicons-trash" @click="deleteTopic" />
        </template>
      </div>
    </div>

    <div v-if="!topic" class="flex-1 flex items-center justify-center text-cool-500">
      Loading…
    </div>

    <!-- View mode -->
    <div v-else-if="!editing" class="flex-1 overflow-y-auto">
      <div class="max-w-3xl mx-auto p-6 space-y-8">
        <div>
          <div class="mb-4">
            <div class="flex items-center gap-2 mb-1">
              <UIcon v-if="topic.pinned" name="i-heroicons-bookmark-solid" class="text-indigo-400" />
              <h1 class="text-2xl font-bold text-cool-50">{{ topic.title }}</h1>
            </div>
            <div class="flex flex-wrap items-center gap-3 text-sm text-cool-500">
              <span>{{ topic.authorName }}</span>
              <span>·</span>
              <span>{{ formatDate(topic.createdAt) }}</span>
              <span v-if="topic.updatedAt > topic.createdAt" class="italic">· edited {{ formatDate(topic.updatedAt) }}</span>
            </div>
            <div v-if="topic.tags.length" class="flex flex-wrap gap-1.5 mt-2">
              <span
                v-for="tag in topic.tags"
                :key="tag"
                class="text-xs px-2 py-0.5 rounded-full bg-indigo-900/50 text-indigo-300"
              >{{ tag }}</span>
            </div>
          </div>
          <!-- eslint-disable-next-line vue/no-v-html -->
          <div class="prose prose-invert max-w-none" v-html="rendered" />
        </div>

        <UDivider />

        <div class="space-y-4">
          <h2 class="font-semibold text-cool-300 flex items-center gap-2">
            <UIcon name="i-heroicons-chat-bubble-left-right" />
            {{ topic.commentCount }} {{ topic.commentCount === 1 ? 'comment' : 'comments' }}
          </h2>

          <div v-if="rootComments.length === 0" class="text-cool-500 text-sm">
            No comments yet. Start the conversation.
          </div>

          <KbComment
            v-for="comment in rootComments"
            :key="comment.id"
            :comment="comment"
            :replies="repliesFor(comment.id)"
            :topic-id="topicId"
            :current-user-id="authStore.user?.uid ?? ''"
          />

          <div class="bg-cool-800 border border-cool-700 rounded-lg p-3 space-y-2">
            <UTextarea
              v-model="newComment"
              placeholder="Add a comment… (Markdown supported)"
              :rows="3"
              autoresize
            />
            <div class="flex justify-end">
              <UButton
                :loading="submittingComment"
                :disabled="!newComment.trim()"
                @click="submitComment"
              >
                Comment
              </UButton>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Edit mode: split pane -->
    <div v-else class="flex-1 min-h-0 flex flex-col">
      <!-- Edit meta fields -->
      <div class="px-4 pt-3 pb-2 border-b border-cool-800 shrink-0 space-y-2">
        <UInput v-model="editTitle" placeholder="Title" size="lg" class="font-bold" />
        <UInput v-model="editTags" placeholder="Tags (comma-separated)" size="sm" />
      </div>

      <!-- Split pane -->
      <div class="flex-1 min-h-0 flex">
        <!-- Editor -->
        <div
          :class="[
            'flex-1 min-w-0 flex flex-col',
            mobilePreview ? 'hidden md:flex' : 'flex',
            'md:border-r md:border-cool-800',
          ]"
        >
          <div class="flex items-center gap-1 px-2 py-1 bg-cool-800 border-b border-cool-700 shrink-0">
            <input ref="imageInput" type="file" accept="image/*" class="hidden" @change="handleImageUpload" />
            <UButton size="xs" variant="ghost" :loading="uploadingImage" icon="i-heroicons-photo" @click="imageInput?.click()">
              Image
            </UButton>
            <span class="text-xs text-cool-600 ml-auto">Markdown</span>
          </div>
          <textarea
            ref="editorTextarea"
            v-model="editContent"
            class="flex-1 bg-cool-950 outline-none resize-none text-cool-200 font-mono text-sm leading-relaxed p-3"
          />
        </div>

        <!-- Preview -->
        <div
          :class="[
            'flex-1 min-w-0 overflow-y-auto p-4',
            mobilePreview ? 'block' : 'hidden md:block',
          ]"
        >
          <!-- eslint-disable-next-line vue/no-v-html -->
          <div class="prose prose-invert max-w-none" v-html="rendered" />
          <p v-if="!editContent" class="text-cool-600 text-sm italic">Preview will appear here as you type…</p>
        </div>
      </div>
    </div>
  </div>
</template>
