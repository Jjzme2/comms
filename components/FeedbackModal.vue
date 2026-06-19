<script setup lang="ts">
import type { FeedbackType } from '~/types'

const props = defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{ 'update:modelValue': [boolean] }>()

const feedbackStore = useFeedbackStore()

const typeOptions = [
  { label: 'Bug Report', value: 'bug' },
  { label: 'Feature Request', value: 'feature' },
  { label: 'General Feedback', value: 'general' },
]

const type = ref<FeedbackType>('feature')
const title = ref('')
const description = ref('')
const submitting = ref(false)
const submitted = ref(false)

function close() {
  emit('update:modelValue', false)
}

watch(() => props.modelValue, (open) => {
  if (!open) {
    // Reset after close animation
    setTimeout(() => {
      type.value = 'feature'
      title.value = ''
      description.value = ''
      submitted.value = false
    }, 200)
  }
})

async function submit() {
  if (!title.value.trim() || !description.value.trim()) return
  submitting.value = true
  try {
    await feedbackStore.submit(type.value, title.value.trim(), description.value.trim())
    submitted.value = true
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <UModal :model-value="modelValue" @update:model-value="emit('update:modelValue', $event)">
    <UCard>
      <template #header>
        <div class="flex items-center justify-between">
          <h3 class="font-semibold">Send Feedback</h3>
          <UButton variant="ghost" icon="i-heroicons-x-mark" size="xs" @click="close" />
        </div>
      </template>

      <div v-if="submitted" class="py-6 flex flex-col items-center gap-3 text-center">
        <UIcon name="i-heroicons-check-circle" class="text-4xl text-green-400" />
        <p class="font-medium text-cool-100">Thanks for your feedback!</p>
        <p class="text-sm text-cool-400">We'll review it and get back to you if needed.</p>
        <UButton class="mt-2" @click="close">Close</UButton>
      </div>

      <form v-else class="space-y-4" @submit.prevent="submit">
        <UFormGroup label="Type">
          <USelectMenu v-model="type" :options="typeOptions" value-attribute="value" option-attribute="label" />
        </UFormGroup>

        <UFormGroup label="Title" required>
          <UInput v-model="title" placeholder="Brief summary…" required />
        </UFormGroup>

        <UFormGroup label="Description" required>
          <UTextarea
            v-model="description"
            placeholder="Describe the issue, idea, or feedback in detail…"
            :rows="5"
            autoresize
            required
          />
        </UFormGroup>

        <div class="flex justify-end gap-2 pt-1">
          <UButton variant="ghost" type="button" @click="close">Cancel</UButton>
          <UButton
            type="submit"
            :loading="submitting"
            :disabled="!title.trim() || !description.trim()"
          >
            Submit
          </UButton>
        </div>
      </form>
    </UCard>
  </UModal>
</template>
