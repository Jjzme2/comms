<script setup lang="ts">
const authStore = useAuthStore()
const chatStore = useChatStore()
const route = useRoute()
const sidebarOpen = useMobileSidebar()
const showNewChannel = ref(false)
const newChannelName = ref('')
const newChannelDesc = ref('')
const creating = ref(false)
const showFeedback = ref(false)

onMounted(() => chatStore.subscribeChannels())

watch(() => route.path, () => {
  sidebarOpen.value = false
})

const navItems = [
  { label: 'Projects', icon: 'i-heroicons-folder-open', to: '/projects' },
  { label: 'Files', icon: 'i-heroicons-folder', to: '/files' },
  { label: 'Notes', icon: 'i-heroicons-document-text', to: '/notes' },
  { label: 'Quick Links', icon: 'i-heroicons-link', to: '/quicklinks' },
  { label: 'Knowledge Base', icon: 'i-heroicons-book-open', to: '/kb' },
  { label: 'AI', icon: 'i-heroicons-cpu-chip', to: '/ai' },
]

const adminItems = [
  { label: 'Invites', icon: 'i-heroicons-envelope-open', to: '/admin/invites' },
  { label: 'Feedback', icon: 'i-heroicons-chat-bubble-bottom-center-text', to: '/admin/feedback' },
]

async function createChannel() {
  if (!newChannelName.value.trim()) return
  creating.value = true
  try {
    const id = await chatStore.createChannel(newChannelName.value.trim(), newChannelDesc.value.trim())
    showNewChannel.value = false
    newChannelName.value = ''
    newChannelDesc.value = ''
    if (id) await navigateTo(`/chat/${id}`)
  } finally {
    creating.value = false
  }
}
</script>

<template>
  <aside
    :class="[
      'fixed inset-y-0 left-0 z-40 w-60 bg-cool-900 flex flex-col border-r border-cool-800 shrink-0 transition-transform duration-200',
      'md:relative md:z-auto md:translate-x-0',
      sidebarOpen ? 'translate-x-0' : '-translate-x-full',
    ]"
  >
    <!-- App name + mobile close -->
    <div class="h-12 flex items-center px-4 border-b border-cool-800 shrink-0">
      <span class="font-bold tracking-tight text-indigo-400 flex-1">comms</span>
      <button
        class="md:hidden text-cool-400 hover:text-cool-200 p-1 -mr-1"
        type="button"
        @click="sidebarOpen = false"
      >
        <UIcon name="i-heroicons-x-mark" class="w-5 h-5" />
      </button>
    </div>

    <div class="flex-1 overflow-y-auto py-2 space-y-4">
      <!-- Channels -->
      <div>
        <div class="flex items-center px-3 mb-1">
          <span class="text-xs font-semibold uppercase tracking-wider text-cool-500">Channels</span>
          <UButton
            size="xs"
            variant="ghost"
            icon="i-heroicons-plus"
            class="ml-auto"
            @click="showNewChannel = true"
          />
        </div>
        <NuxtLink
          v-for="channel in chatStore.channels"
          :key="channel.id"
          :to="`/chat/${channel.id}`"
          :class="[
            'flex items-center gap-2 px-3 py-1.5 text-sm rounded mx-1',
            route.path === `/chat/${channel.id}`
              ? 'bg-cool-700 text-cool-100'
              : 'text-cool-400 hover:bg-cool-800 hover:text-cool-200',
          ]"
        >
          <span class="text-cool-500 font-mono text-xs">#</span>
          <span class="truncate">{{ channel.name }}</span>
        </NuxtLink>
      </div>

      <!-- Nav items -->
      <div>
        <div class="px-3 mb-1">
          <span class="text-xs font-semibold uppercase tracking-wider text-cool-500">App</span>
        </div>
        <NuxtLink
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          :class="[
            'flex items-center gap-2 px-3 py-1.5 text-sm rounded mx-1',
            route.path.startsWith(item.to)
              ? 'bg-cool-700 text-cool-100'
              : 'text-cool-400 hover:bg-cool-800 hover:text-cool-200',
          ]"
        >
          <UIcon :name="item.icon" />
          <span>{{ item.label }}</span>
        </NuxtLink>
      </div>

      <!-- Admin section -->
      <div v-if="authStore.isAdmin">
        <div class="px-3 mb-1">
          <span class="text-xs font-semibold uppercase tracking-wider text-cool-500">Admin</span>
        </div>
        <NuxtLink
          v-for="item in adminItems"
          :key="item.to"
          :to="item.to"
          :class="[
            'flex items-center gap-2 px-3 py-1.5 text-sm rounded mx-1',
            route.path.startsWith(item.to)
              ? 'bg-cool-700 text-cool-100'
              : 'text-cool-400 hover:bg-cool-800 hover:text-cool-200',
          ]"
        >
          <UIcon :name="item.icon" />
          <span>{{ item.label }}</span>
        </NuxtLink>
      </div>
    </div>

    <!-- User footer -->
    <div class="px-3 py-2 border-t border-cool-800 shrink-0 space-y-1">
      <UButton
        size="xs"
        variant="ghost"
        icon="i-heroicons-chat-bubble-bottom-center-text"
        class="w-full justify-start text-cool-400"
        @click="showFeedback = true"
      >
        Feedback / Feature Request
      </UButton>
      <div class="flex items-center gap-2 py-1">
        <UAvatar :alt="authStore.user?.displayName ?? ''" size="xs" />
        <span class="text-sm text-cool-300 truncate flex-1">{{ authStore.user?.displayName }}</span>
        <UButton size="xs" variant="ghost" icon="i-heroicons-arrow-right-on-rectangle" @click="authStore.logout()" />
      </div>
    </div>
  </aside>

  <FeedbackModal v-model="showFeedback" />

  <!-- New channel modal -->
  <UModal v-model="showNewChannel">
    <UCard>
      <template #header><h3 class="font-semibold">New Channel</h3></template>
      <form class="space-y-3" @submit.prevent="createChannel">
        <UFormGroup label="Channel name" required>
          <UInput v-model="newChannelName" placeholder="general" required />
        </UFormGroup>
        <UFormGroup label="Description">
          <UInput v-model="newChannelDesc" placeholder="What's this channel for?" />
        </UFormGroup>
        <div class="flex justify-end gap-2 pt-1">
          <UButton variant="ghost" type="button" @click="showNewChannel = false">Cancel</UButton>
          <UButton type="submit" :loading="creating">Create</UButton>
        </div>
      </form>
    </UCard>
  </UModal>
</template>
