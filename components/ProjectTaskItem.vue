<script setup lang="ts">
import type { ProjectTask } from '~/types'

const props = defineProps<{ task: ProjectTask }>()
const emit = defineEmits<{
  statusChange: [id: string, status: ProjectTask['status']]
  delete: [id: string]
}>()

const STATUS_CYCLE: Record<ProjectTask['status'], ProjectTask['status']> = {
  'todo': 'in-progress',
  'in-progress': 'done',
  'done': 'todo',
}

const statusIcon: Record<ProjectTask['status'], string> = {
  'todo': 'i-heroicons-circle-stack',
  'in-progress': 'i-heroicons-arrow-path',
  'done': 'i-heroicons-check-circle',
}

const statusColor: Record<ProjectTask['status'], string> = {
  'todo': 'text-cool-500',
  'in-progress': 'text-amber-400',
  'done': 'text-emerald-400',
}
</script>

<template>
  <div class="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-cool-800/50 group">
    <button
      class="shrink-0 touch-manipulation"
      :class="statusColor[task.status]"
      type="button"
      :title="`Mark as ${STATUS_CYCLE[task.status]}`"
      @click="emit('statusChange', task.id, STATUS_CYCLE[task.status])"
    >
      <UIcon :name="statusIcon[task.status]" class="w-5 h-5" />
    </button>

    <span
      class="flex-1 text-sm leading-snug"
      :class="task.status === 'done' ? 'line-through text-cool-500' : 'text-cool-200'"
    >
      {{ task.title }}
    </span>

    <UBadge
      :color="task.status === 'done' ? 'gray' : task.status === 'in-progress' ? 'amber' : 'cool'"
      size="xs"
      class="hidden sm:flex shrink-0 capitalize"
    >
      {{ task.status }}
    </UBadge>

    <UButton
      size="xs"
      variant="ghost"
      icon="i-heroicons-trash"
      class="opacity-0 group-hover:opacity-100 shrink-0 text-cool-500 hover:text-red-400"
      @click="emit('delete', task.id)"
    />
  </div>
</template>
