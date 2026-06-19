<script setup lang="ts">
import QRCode from 'qrcode'

const authStore = useAuthStore()
const invitesStore = useInvitesStore()
const config = useRuntimeConfig()
const toast = useToast()

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

// Share modal state
const shareEmail = ref('')
const shareModalOpen = ref(false)
const qrDataUrl = ref('')
const linkCopied = ref(false)
const resending = ref<string | null>(null)

async function resendInvite(email: string) {
  resending.value = email
  try {
    const authStore = useAuthStore()
    await $fetch('/api/invites/send-email', {
      method: 'POST',
      body: { email, inviterName: authStore.user?.displayName ?? 'Someone' },
    })
    toast.add({ title: 'Email resent', description: `Invite resent to ${email}`, color: 'green', icon: 'i-heroicons-paper-airplane' })
  } catch (e: any) {
    toast.add({ title: 'Failed to resend', description: e?.data?.message ?? e?.message ?? 'Unknown error', color: 'red', icon: 'i-heroicons-exclamation-circle' })
  } finally {
    resending.value = null
  }
}

const appUrl = computed(() =>
  ((config.public as any).appUrl as string | undefined)?.replace(/\/$/, '') || window.location.origin
)

function inviteLink(email: string) {
  return `${appUrl.value}/login?register=1&email=${encodeURIComponent(email)}`
}

async function openShare(email: string) {
  shareEmail.value = email
  shareModalOpen.value = true
  linkCopied.value = false
  qrDataUrl.value = await QRCode.toDataURL(inviteLink(email), {
    width: 200,
    margin: 2,
    color: { dark: '#1e293b', light: '#f8fafc' },
  })
}

async function copyLink() {
  await navigator.clipboard.writeText(inviteLink(shareEmail.value))
  linkCopied.value = true
  setTimeout(() => { linkCopied.value = false }, 2000)
}

async function add() {
  addError.value = ''
  const email = newEmail.value.trim().toLowerCase()
  if (!email || !email.includes('@')) {
    addError.value = 'Enter a valid email address.'
    return
  }
  adding.value = true
  try {
    const { emailSent, emailError } = await invitesStore.addInvite(email)
    newEmail.value = ''
    if (emailSent) {
      toast.add({ title: 'Invite sent', description: `Email delivered to ${email}`, color: 'green', icon: 'i-heroicons-paper-airplane' })
    } else {
      toast.add({ title: 'Invite added', description: emailError ?? 'Firestore invite created; email not sent.', color: 'yellow', icon: 'i-heroicons-exclamation-triangle' })
    }
    await openShare(email)
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
          <UButton type="submit" :loading="adding" icon="i-heroicons-paper-airplane">
            Invite
          </UButton>
        </form>
        <p v-if="addError" class="text-red-400 text-sm mt-2">{{ addError }}</p>
        <p class="text-xs text-cool-500 mt-2">
          Creates a Firestore invite and sends a registration email. Role will be
          <strong>admin</strong> if the email is in <code>NUXT_PUBLIC_ADMIN_EMAILS</code>, otherwise <strong>member</strong>.
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
          <UTooltip text="Share invite link">
            <UButton
              size="xs"
              variant="ghost"
              color="indigo"
              icon="i-heroicons-qr-code"
              @click="openShare(invite.email)"
            />
          </UTooltip>
          <UTooltip v-if="invite.status === 'pending'" text="Resend email">
            <UButton
              size="xs"
              variant="ghost"
              color="cool"
              icon="i-heroicons-arrow-path"
              :loading="resending === invite.email"
              @click="resendInvite(invite.email)"
            />
          </UTooltip>
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

    <!-- Share modal -->
    <UModal v-model="shareModalOpen">
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <h2 class="font-semibold">Share invite</h2>
            <UButton variant="ghost" icon="i-heroicons-x-mark" size="xs" @click="shareModalOpen = false" />
          </div>
        </template>

        <div class="space-y-4">
          <p class="text-sm text-cool-400">
            Send this link to <strong class="text-cool-200">{{ shareEmail }}</strong> — they'll land directly on the registration page.
          </p>

          <!-- QR code -->
          <div class="flex justify-center">
            <img
              v-if="qrDataUrl"
              :src="qrDataUrl"
              alt="Invite QR code"
              class="rounded-xl border border-cool-700"
              width="200"
              height="200"
            />
          </div>

          <!-- Copyable link -->
          <div class="flex gap-2 items-center bg-cool-900 rounded-lg px-3 py-2 border border-cool-700">
            <span class="flex-1 text-xs text-cool-300 truncate font-mono select-all">{{ inviteLink(shareEmail) }}</span>
            <UButton
              size="xs"
              :icon="linkCopied ? 'i-heroicons-check' : 'i-heroicons-clipboard'"
              :color="linkCopied ? 'green' : 'indigo'"
              variant="ghost"
              @click="copyLink"
            />
          </div>

          <p class="text-xs text-cool-500">
            The invitee must sign up using exactly <code class="text-cool-300">{{ shareEmail }}</code>.
          </p>
        </div>
      </UCard>
    </UModal>
  </div>
</template>
