<script setup lang="ts">
import type { KbTopic } from '~/types'

defineProps<{
  topic: KbTopic
}>()

function formatDate(d: Date) {
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}
</script>

<template>
  <div class="bg-cool-800 hover:bg-cool-750 border border-cool-700 rounded-lg p-4 transition-colors cursor-pointer group">
    <div class="flex items-start gap-2 mb-2">
      <UIcon v-if="topic.pinned" name="i-heroicons-bookmark-solid" class="text-indigo-400 shrink-0 mt-0.5" />
      <h3 class="font-semibold text-cool-100 group-hover:text-white leading-snug flex-1">{{ topic.title }}</h3>
    </div>

    <div class="flex flex-wrap gap-1 mb-3" v-if="topic.tags.length">
      <span
        v-for="tag in topic.tags"
        :key="tag"
        class="text-xs px-2 py-0.5 rounded-full bg-indigo-900/50 text-indigo-300"
      >{{ tag }}</span>
    </div>

    <div class="flex items-center gap-3 text-xs text-cool-500">
      <span>{{ topic.authorName }}</span>
      <span>·</span>
      <span>{{ formatDate(topic.createdAt) }}</span>
      <span class="ml-auto flex items-center gap-1">
        <UIcon name="i-heroicons-chat-bubble-left" class="text-cool-500" />
        {{ topic.commentCount }}
      </span>
    </div>
  </div>
</template>
