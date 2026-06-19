<script setup lang="ts">
definePageMeta({ layout: 'auth' })

const authStore = useAuthStore()
const mode = ref<'login' | 'register'>('login')
const email = ref('')
const password = ref('')
const displayName = ref('')
const loading = ref(false)
const error = ref('')

async function submit() {
  error.value = ''
  loading.value = true
  try {
    if (mode.value === 'login') {
      await authStore.login(email.value, password.value)
    } else {
      await authStore.register(email.value, password.value, displayName.value)
    }
    await navigateTo('/chat')
  } catch (e: any) {
    error.value = e.message ?? 'Something went wrong.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <UCard class="w-full max-w-sm">
    <template #header>
      <div class="text-center space-y-1">
        <h1 class="text-2xl font-bold tracking-tight">comms</h1>
        <p class="text-sm text-cool-400">{{ mode === 'login' ? 'Sign in to your account' : 'Create your account' }}</p>
      </div>
    </template>

    <form class="space-y-4" @submit.prevent="submit">
      <UFormGroup v-if="mode === 'register'" label="Display name">
        <UInput v-model="displayName" placeholder="Your name" autocomplete="name" required />
      </UFormGroup>

      <UFormGroup label="Email">
        <UInput v-model="email" type="email" placeholder="you@example.com" autocomplete="email" required />
      </UFormGroup>

      <UFormGroup label="Password">
        <UInput v-model="password" type="password" placeholder="••••••••" autocomplete="current-password" required />
      </UFormGroup>

      <UAlert v-if="error" color="red" icon="i-heroicons-exclamation-circle" :description="error" />

      <UButton type="submit" block :loading="loading">
        {{ mode === 'login' ? 'Sign in' : 'Create account' }}
      </UButton>
    </form>

    <template #footer>
      <p class="text-center text-sm text-cool-400">
        {{ mode === 'login' ? "Don't have an account?" : 'Already have an account?' }}
        <button class="text-indigo-400 hover:underline ml-1" type="button" @click="mode = mode === 'login' ? 'register' : 'login'">
          {{ mode === 'login' ? 'Request access' : 'Sign in' }}
        </button>
      </p>
    </template>
  </UCard>
</template>
