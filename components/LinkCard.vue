<script setup lang="ts">
import type { QuickLink } from '~/types'

const props = defineProps<{ link: QuickLink }>()
const emit = defineEmits<{ delete: [] }>()
const authStore = useAuthStore()

const isOwn = computed(() => props.link.addedBy === authStore.user?.uid)

function favicon(url: string) {
  try {
    const { hostname } = new URL(url)
    return `https://www.google.com/s2/favicons?domain=${hostname}&sz=32`
  } catch {
    return null
  }
}
</script>

<template>
  <!-- entire card is a real hyperlink -->
  <a
    :href="link.url"
    target="_blank"
    rel="noopener noreferrer"
    class="block bg-cool-800 border border-cool-700 rounded-xl p-4 hover:border-indigo-500/50 transition-colors group"
  >
    <div class="flex items-start gap-3">
      <img
        v-if="favicon(link.url)"
        :src="favicon(link.url)!"
        class="w-5 h-5 rounded mt-0.5 shrink-0"
        loading="lazy"
        :alt="link.title"
      />
      <UIcon v-else name="i-heroicons-link" class="text-cool-500 mt-0.5 shrink-0" />

      <div class="flex-1 min-w-0">
        <div class="font-medium text-cool-100 truncate group-hover:text-indigo-300 transition-colors">
          {{ link.title }}
        </div>
        <div class="text-xs text-cool-500 truncate mt-0.5">{{ link.url }}</div>
        <div v-if="link.description" class="text-sm text-cool-400 mt-1 line-clamp-2">
          {{ link.description }}
        </div>
        <div class="flex items-center justify-between mt-2">
          <div class="flex gap-1 flex-wrap">
            <UBadge v-for="tag in link.tags" :key="tag" color="cool" size="xs">{{ tag }}</UBadge>
          </div>
          <button
            v-if="isOwn"
            class="text-cool-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
            @click.prevent="emit('delete')"
          >
            <UIcon name="i-heroicons-trash" class="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  </a>
</template>
