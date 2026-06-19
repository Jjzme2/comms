<script setup lang="ts">
import type { Message } from '~/types'

const props = defineProps<{ message: Message }>()
const authStore = useAuthStore()
const chatStore = useChatStore()
const filesStore = useFilesStore()

const isOwn = computed(() => props.message.authorId === authStore.user?.uid)

function formatTime(date: Date) {
  return new Intl.DateTimeFormat('en', { hour: 'numeric', minute: '2-digit' }).format(date)
}

const REACTIONS = ['👍', '❤️', '😂', '🔥', '✅']

async function openFile() {
  if (!props.message.r2Key) return
  const url = await filesStore.getFileUrl(props.message.r2Key)
  window.open(url, '_blank')
}
</script>

<template>
  <div :class="['flex gap-2 group', isOwn ? 'flex-row-reverse' : 'flex-row']">
    <UAvatar :alt="message.authorName" size="xs" class="mt-1 shrink-0" />

    <div :class="['max-w-[70%]', isOwn ? 'items-end' : 'items-start', 'flex flex-col gap-1']">
      <div class="flex items-center gap-2 text-xs text-cool-500" :class="isOwn ? 'flex-row-reverse' : 'flex-row'">
        <span class="font-medium text-cool-300">{{ message.authorName }}</span>
        <span>{{ formatTime(message.createdAt) }}</span>
      </div>

      <!-- Text message -->
      <div
        v-if="message.type === 'text'"
        :class="[
          'px-3 py-2 rounded-2xl text-sm leading-relaxed break-words',
          isOwn ? 'bg-indigo-600 text-white rounded-tr-sm' : 'bg-cool-800 text-cool-100 rounded-tl-sm',
        ]"
      >
        {{ message.content }}
      </div>

      <!-- File / image attachment -->
      <div
        v-else-if="message.type === 'file' || message.type === 'image'"
        :class="[
          'rounded-xl overflow-hidden border cursor-pointer',
          isOwn ? 'border-indigo-500/40' : 'border-cool-700',
        ]"
        @click="openFile"
      >
        <div class="flex items-center gap-2 px-3 py-2 hover:bg-cool-700 transition-colors">
          <UIcon
            :name="message.type === 'image' ? 'i-heroicons-photo' : 'i-heroicons-document'"
            class="text-cool-400 shrink-0"
          />
          <div class="min-w-0">
            <div class="text-sm text-cool-200 truncate">{{ message.fileName }}</div>
            <div v-if="message.fileSize" class="text-xs text-cool-500">
              {{ (message.fileSize / 1024).toFixed(1) }} KB
            </div>
          </div>
          <UIcon name="i-heroicons-arrow-down-tray" class="text-cool-500 ml-2 shrink-0" />
        </div>
      </div>

      <!-- Reactions -->
      <div v-if="Object.keys(message.reactions ?? {}).length" class="flex gap-1 flex-wrap">
        <button
          v-for="(users, emoji) in message.reactions"
          :key="emoji"
          class="flex items-center gap-1 bg-cool-800 hover:bg-cool-700 rounded-full px-2 py-0.5 text-xs"
          @click="chatStore.toggleReaction(message.id, emoji as string)"
        >
          {{ emoji }} {{ (users as string[]).length }}
        </button>
      </div>

      <!-- Reaction picker (visible on hover) -->
      <div class="hidden group-hover:flex gap-1 mt-0.5">
        <button
          v-for="emoji in REACTIONS"
          :key="emoji"
          class="text-sm hover:scale-110 transition-transform"
          @click="chatStore.toggleReaction(message.id, emoji)"
        >{{ emoji }}</button>
      </div>
    </div>
  </div>
</template>
