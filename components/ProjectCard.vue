<script setup lang="ts">
import type { Project } from '~/types'

const props = defineProps<{ project: Project }>()

const statusColor: Record<Project['status'], string> = {
  active: 'text-emerald-400',
  archived: 'text-cool-500',
}
</script>

<template>
  <div class="bg-cool-900 border border-cool-800 rounded-xl p-4 hover:border-cool-600 transition-colors h-full flex flex-col gap-2">
    <div class="flex items-start gap-2">
      <UIcon name="i-heroicons-folder-open" class="text-indigo-400 shrink-0 mt-0.5" />
      <div class="min-w-0 flex-1">
        <div class="font-semibold truncate">{{ project.name }}</div>
        <div v-if="project.description" class="text-sm text-cool-400 line-clamp-2 mt-0.5">
          {{ project.description }}
        </div>
      </div>
    </div>
    <div class="flex items-center gap-2 mt-auto pt-1 text-xs text-cool-500">
      <span :class="[statusColor[project.status], 'capitalize']">{{ project.status }}</span>
      <span class="ml-auto">{{ project.createdByName }}</span>
    </div>
  </div>
</template>
