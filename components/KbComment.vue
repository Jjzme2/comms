<script setup lang="ts">
import { marked } from 'marked'
import type { KbComment } from '~/types'

const props = defineProps<{
  comment: KbComment
  replies: KbComment[]
  topicId: string
  currentUserId: string
}>()

const kbStore = useKbStore()

const editing = ref(false)
const editContent = ref('')
const replying = ref(false)
const replyContent = ref('')
const saving = ref(false)
const replySubmitting = ref(false)

function startEdit() {
  editContent.value = props.comment.content
  editing.value = true
}

async function submitEdit() {
  if (!editContent.value.trim()) return
  saving.value = true
  try {
    await kbStore.saveComment(props.comment.id, editContent.value.trim())
    editing.value = false
  } finally {
    saving.value = false
  }
}

async function submitReply() {
  if (!replyContent.value.trim()) return
  replySubmitting.value = true
  try {
    await kbStore.addComment(props.topicId, replyContent.value.trim(), props.comment.id)
    replyContent.value = ''
    replying.value = false
  } finally {
    replySubmitting.value = false
  }
}

async function remove() {
  if (!confirm('Delete this comment?')) return
  await kbStore.deleteComment(props.comment.id, props.topicId)
}

function formatDate(d: Date) {
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) + ' at ' +
    d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
}

const rendered = computed(() => marked(props.comment.content))
</script>

<template>
  <div class="space-y-1">
    <!-- Comment -->
    <div class="bg-cool-800 border border-cool-700 rounded-lg p-3">
      <div class="flex items-center gap-2 mb-2">
        <UAvatar :alt="comment.authorName" size="xs" />
        <span class="text-sm font-medium text-cool-200">{{ comment.authorName }}</span>
        <span class="text-xs text-cool-500">{{ formatDate(comment.createdAt) }}</span>
        <span v-if="comment.updatedAt > comment.createdAt" class="text-xs text-cool-600 italic">(edited)</span>
        <div class="ml-auto flex gap-1" v-if="comment.authorId === currentUserId">
          <UButton size="xs" variant="ghost" icon="i-heroicons-pencil" @click="startEdit" />
          <UButton size="xs" variant="ghost" icon="i-heroicons-trash" color="red" @click="remove" />
        </div>
      </div>

      <div v-if="editing" class="space-y-2">
        <UTextarea v-model="editContent" :rows="3" autoresize />
        <div class="flex gap-2 justify-end">
          <UButton size="xs" variant="ghost" @click="editing = false">Cancel</UButton>
          <UButton size="xs" :loading="saving" @click="submitEdit">Save</UButton>
        </div>
      </div>
      <!-- eslint-disable-next-line vue/no-v-html -->
      <div v-else class="prose prose-invert prose-sm max-w-none" v-html="rendered" />

      <UButton
        v-if="!editing"
        size="xs"
        variant="ghost"
        icon="i-heroicons-arrow-uturn-left"
        class="mt-2 text-cool-500"
        @click="replying = !replying"
      >
        Reply
      </UButton>
    </div>

    <!-- Reply form -->
    <div v-if="replying" class="ml-6 bg-cool-800/60 border border-cool-700 rounded-lg p-3 space-y-2">
      <UTextarea v-model="replyContent" placeholder="Write a reply…" :rows="2" autoresize />
      <div class="flex gap-2 justify-end">
        <UButton size="xs" variant="ghost" @click="replying = false; replyContent = ''">Cancel</UButton>
        <UButton size="xs" :loading="replySubmitting" :disabled="!replyContent.trim()" @click="submitReply">Reply</UButton>
      </div>
    </div>

    <!-- Replies -->
    <div v-if="replies.length" class="ml-6 space-y-1">
      <div
        v-for="reply in replies"
        :key="reply.id"
        class="bg-cool-800/70 border border-cool-700/60 rounded-lg p-3"
      >
        <div class="flex items-center gap-2 mb-2">
          <UAvatar :alt="reply.authorName" size="xs" />
          <span class="text-sm font-medium text-cool-200">{{ reply.authorName }}</span>
          <span class="text-xs text-cool-500">{{ formatDate(reply.createdAt) }}</span>
          <div class="ml-auto flex gap-1" v-if="reply.authorId === currentUserId">
            <UButton size="xs" variant="ghost" icon="i-heroicons-trash" color="red" @click="kbStore.deleteComment(reply.id, topicId)" />
          </div>
        </div>
        <!-- eslint-disable-next-line vue/no-v-html -->
        <div class="prose prose-invert prose-sm max-w-none" v-html="marked(reply.content)" />
      </div>
    </div>
  </div>
</template>
