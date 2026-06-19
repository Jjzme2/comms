<script setup lang="ts">
const store = useProjectsStore()
const showCreate = ref(false)
const form = reactive({ name: '', description: '' })
const creating = ref(false)

onMounted(() => store.subscribeProjects())
onUnmounted(() => store.unsubscribeAll())

async function create() {
  if (!form.name.trim()) return
  creating.value = true
  try {
    const id = await store.createProject(form.name.trim(), form.description.trim())
    Object.assign(form, { name: '', description: '' })
    showCreate.value = false
    await navigateTo(`/projects/${id}`)
  } finally {
    creating.value = false
  }
}

const active = computed(() => store.projects.filter(p => p.status === 'active'))
const archived = computed(() => store.projects.filter(p => p.status === 'archived'))
</script>

<template>
  <div class="flex-1 flex flex-col min-h-0">
    <div class="flex flex-wrap items-center px-4 gap-2 border-b border-cool-800 shrink-0 min-h-12 py-2">
      <h1 class="font-semibold mr-auto">Projects</h1>
      <UButton size="sm" icon="i-heroicons-plus" @click="showCreate = true">New project</UButton>
    </div>

    <div class="flex-1 overflow-y-auto p-4 space-y-6">
      <!-- Active projects -->
      <div>
        <p v-if="active.length === 0 && archived.length === 0" class="flex items-center justify-center h-40 text-cool-500">
          No projects yet. Create one to get started.
        </p>
        <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <NuxtLink
            v-for="project in active"
            :key="project.id"
            :to="`/projects/${project.id}`"
          >
            <ProjectCard :project="project" />
          </NuxtLink>
        </div>
      </div>

      <!-- Archived -->
      <div v-if="archived.length">
        <h2 class="text-xs font-semibold uppercase tracking-wider text-cool-500 mb-2">Archived</h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <NuxtLink
            v-for="project in archived"
            :key="project.id"
            :to="`/projects/${project.id}`"
          >
            <ProjectCard :project="project" />
          </NuxtLink>
        </div>
      </div>
    </div>

    <!-- New Project Modal -->
    <UModal v-model="showCreate">
      <UCard>
        <template #header><h3 class="font-semibold">New Project</h3></template>
        <form class="space-y-3" @submit.prevent="create">
          <UFormGroup label="Project name" required>
            <UInput v-model="form.name" placeholder="My awesome project" required autofocus />
          </UFormGroup>
          <UFormGroup label="Description">
            <UInput v-model="form.description" placeholder="What's this project about?" />
          </UFormGroup>
          <div class="flex justify-end gap-2 pt-1">
            <UButton variant="ghost" type="button" @click="showCreate = false">Cancel</UButton>
            <UButton type="submit" :loading="creating">Create</UButton>
          </div>
        </form>
      </UCard>
    </UModal>
  </div>
</template>
