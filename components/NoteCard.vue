<script setup lang="ts">
import { marked } from 'marked'
import type { Note } from '~/types'

defineProps<{ note: Note; isOwn: boolean }>()

function formatDate(d: Date) {
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(d)
}

function snippet(content: string): string {
  if (!content) return ''
  // Strip markdown syntax for plain-text preview
  return content
    .replace(/!\[.*?\]\(.*?\)/g, '[image]')
    .replace(/\[([^\]]+)\]\(.*?\)/g, '$1')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`[^`]+`/g, (m) => m.slice(1, -1))
    .replace(/#{1,6}\s+/g, '')
    .replace(/[*_]{1,2}([^*_]+)[*_]{1,2}/g, '$1')
    .replace(/>\s+/g, '')
    .replace(/[-*+]\s+/g, '')
    .replace(/\n+/g, ' ')
    .trim()
}
</script>

<template>
  <div class="bg-cool-800 border border-cool-700 rounded-xl p-4 hover:border-indigo-500/50 transition-colors cursor-pointer h-full">
    <div class="flex items-start justify-between gap-2 mb-2">
      <h3 class="font-medium text-cool-100 truncate">{{ note.title || 'Untitled' }}</h3>
      <div class="flex gap-1 shrink-0">
        <UBadge v-if="note.sharedWith === 'all'" color="indigo" size="xs">Shared</UBadge>
        <UBadge v-if="!isOwn" color="cool" size="xs">{{ note.authorName }}</UBadge>
      </div>
    </div>
    <p class="text-sm text-cool-400 line-clamp-3">{{ snippet(note.content) || 'Empty note…' }}</p>
    <div class="text-xs text-cool-600 mt-3">{{ formatDate(note.updatedAt) }}</div>
  </div>
</template>
