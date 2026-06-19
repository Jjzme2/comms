<script setup lang="ts">
const authStore = useAuthStore()
const invitesStore = useInvitesStore()

// Guard: admins only
onMounted(() => {
  if (!authStore.isAdmin) {
    navigateTo('/chat')
    return
  }
  invitesStore.subscribe()
})
onUnmounted(() => invitesStore.unsubscribe())

const newEmail = ref('')
const adding = ref(false)
const addError = ref('')

async function add() {
  addError.value = ''
  const email = newEmail.value.trim().toLowerCase()
  if (!email || !email.includes('@')) {
    addError.value = 'Enter a valid email address.'
    return
  }
  adding.value = true
  try {
    await invitesStore.addInvite(email)
    newEmail.value = ''
  } catch (e: any) {
    addError.value = e.message ?? 'Failed to add invite.'
  } finally {
    adding.value = false
  }
}

function statusColor(status: string) {
  return status === 'accepted' ? 'green' : 'yellow'
}

function formatDate(d: Date) {
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(d)
}
</script>

<template>
  <div class="flex-1 flex flex-col min-h-0">
    <div class="h-12 flex items-center px-4 border-b border-cool-800 shrink-0">
      <h1 class="font-semibold">Invites</h1>
      <UBadge color="indigo" class="ml-2">Admin</UBadge>
    </div>

    <div class="flex-1 overflow-y-auto p-6 max-w-2xl w-full mx-auto">
      <!-- Add invite form -->
      <UCard class="mb-6">
        <template #header>
          <h2 class="font-medium">Add invite</h2>
        </template>
        <form class="flex gap-2" @submit.prevent="add">
          <UInput
            v-model="newEmail"
            type="email"
            placeholder="someone@example.com"
            class="flex-1"
            :disabled="adding"
          />
          <UButton type="submit" :loading="adding" icon="i-heroicons-plus">
            Invite
          </UButton>
        </form>
        <p v-if="addError" class="text-red-400 text-sm mt-2">{{ addError }}</p>
        <p class="text-xs text-cool-500 mt-2">
          The invited person will be able to create an account using this email.
          Their role will be <strong>admin</strong> if the email is in <code>NUXT_PUBLIC_ADMIN_EMAILS</code>, otherwise <strong>member</strong>.
        </p>
      </UCard>

      <!-- Invite list -->
      <div class="space-y-2">
        <div
          v-for="invite in invitesStore.invites"
          :key="invite.email"
          class="flex items-center gap-3 bg-cool-800 rounded-xl px-4 py-3 border border-cool-700"
        >
          <UIcon name="i-heroicons-envelope" class="text-cool-500 shrink-0" />
          <div class="flex-1 min-w-0">
            <div class="text-sm font-medium text-cool-100 truncate">{{ invite.email }}</div>
            <div class="text-xs text-cool-500">
              Invited {{ formatDate(invite.invitedAt) }}
            </div>
          </div>
          <UBadge :color="statusColor(invite.status)" size="xs">
            {{ invite.status }}
          </UBadge>
          <UButton
            size="xs"
            variant="ghost"
            color="red"
            icon="i-heroicons-trash"
            :disabled="invite.status === 'accepted'"
            @click="invitesStore.revokeInvite(invite.email)"
          />
        </div>

        <div v-if="invitesStore.invites.length === 0" class="text-center text-cool-500 py-8">
          No invites yet.
        </div>
      </div>
    </div>
  </div>
</template>
