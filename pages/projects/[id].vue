<script setup lang="ts">
const route = useRoute()
const store = useProjectsStore()
const notesStore = useNotesStore()
const authStore = useAuthStore()

const projectId = computed(() => route.params.id as string)
const project = computed(() => store.projects.find(p => p.id === projectId.value))
const tab = ref<'tasks' | 'notes' | 'channel'>('tasks')

// Task add form
const newTaskTitle = ref('')
const addingTask = ref(false)

// Notes filtered to this project
const projectNotes = computed(() =>
  notesStore.notes.filter(n => n.projectId === projectId.value)
)

onMounted(() => {
  store.subscribeProjects()
  store.subscribeTasks(projectId.value)
  notesStore.subscribe()
})
onUnmounted(() => {
  store.unsubscribeAll()
  notesStore.unsubscribe()
})

async function addTask() {
  const title = newTaskTitle.value.trim()
  if (!title) return
  addingTask.value = true
  try {
    await store.createTask(projectId.value, title)
    newTaskTitle.value = ''
  } finally {
    addingTask.value = false
  }
}

async function onStatusChange(id: string, status: 'todo' | 'in-progress' | 'done') {
  await store.updateTask(id, { status })
}

async function onDeleteTask(id: string) {
  await store.deleteTask(id)
}

async function createProjectNote() {
  const id = await notesStore.createNote()
  // Tag the note with this projectId
  await notesStore.saveNote(id, { sharedWith: 'all', projectId: projectId.value })
  await navigateTo(`/notes/${id}`)
}

async function archiveToggle() {
  if (!project.value) return
  await store.updateProject(projectId.value, {
    status: project.value.status === 'active' ? 'archived' : 'active',
  })
}

// Tasks grouped by status for the kanban-style view
const todoTasks = computed(() => store.tasks.filter(t => t.status === 'todo'))
const inProgressTasks = computed(() => store.tasks.filter(t => t.status === 'in-progress'))
const doneTasks = computed(() => store.tasks.filter(t => t.status === 'done'))
</script>

<template>
  <div class="flex-1 flex flex-col min-h-0">
    <!-- Header -->
    <div class="flex flex-wrap items-center px-4 gap-2 border-b border-cool-800 shrink-0 min-h-12 py-2">
      <NuxtLink to="/projects" class="text-cool-400 hover:text-cool-200 shrink-0">
        <UIcon name="i-heroicons-arrow-left" />
      </NuxtLink>
      <div class="flex-1 min-w-0">
        <h1 class="font-semibold truncate">{{ project?.name ?? 'Loading…' }}</h1>
        <p v-if="project?.description" class="text-xs text-cool-500 truncate">{{ project.description }}</p>
      </div>
      <UBadge
        v-if="project"
        :color="project.status === 'active' ? 'emerald' : 'gray'"
        class="capitalize shrink-0"
      >
        {{ project.status }}
      </UBadge>
      <UButton
        v-if="project"
        size="xs"
        variant="ghost"
        class="shrink-0"
        @click="archiveToggle"
      >
        {{ project.status === 'active' ? 'Archive' : 'Restore' }}
      </UButton>
    </div>

    <!-- Tab bar -->
    <div class="flex gap-1 px-4 pt-3 pb-0 border-b border-cool-800 shrink-0 overflow-x-auto">
      <button
        v-for="t in (['tasks', 'notes', 'channel'] as const)"
        :key="t"
        :class="[
          'px-3 py-1.5 text-sm font-medium rounded-t-lg border-b-2 transition-colors capitalize whitespace-nowrap',
          tab === t
            ? 'border-indigo-400 text-indigo-300'
            : 'border-transparent text-cool-400 hover:text-cool-200',
        ]"
        @click="tab = t"
      >
        <span v-if="t === 'tasks'">Tasks ({{ store.tasks.length }})</span>
        <span v-else-if="t === 'notes'">Notes ({{ projectNotes.length }})</span>
        <span v-else>Channel</span>
      </button>
    </div>

    <!-- Tasks tab -->
    <div v-if="tab === 'tasks'" class="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
      <!-- Add task input -->
      <form class="flex gap-2" @submit.prevent="addTask">
        <UInput
          v-model="newTaskTitle"
          placeholder="Add a task…"
          class="flex-1"
          :disabled="addingTask"
        />
        <UButton type="submit" :loading="addingTask" icon="i-heroicons-plus">
          <span class="hidden sm:inline">Add</span>
        </UButton>
      </form>

      <!-- Task columns: stacked on mobile, side-by-side on md+ -->
      <div class="flex flex-col md:flex-row gap-4 flex-1">
        <!-- To Do -->
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 mb-2 text-xs font-semibold uppercase tracking-wider text-cool-500">
            <UIcon name="i-heroicons-circle-stack" class="text-cool-500" />
            To Do <span class="ml-auto">{{ todoTasks.length }}</span>
          </div>
          <div class="bg-cool-900 rounded-xl py-1 min-h-16">
            <div v-if="todoTasks.length === 0" class="text-xs text-cool-600 text-center py-4">None</div>
            <ProjectTaskItem
              v-for="task in todoTasks"
              :key="task.id"
              :task="task"
              @status-change="onStatusChange"
              @delete="onDeleteTask"
            />
          </div>
        </div>

        <!-- In Progress -->
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 mb-2 text-xs font-semibold uppercase tracking-wider text-amber-500">
            <UIcon name="i-heroicons-arrow-path" class="text-amber-500" />
            In Progress <span class="ml-auto">{{ inProgressTasks.length }}</span>
          </div>
          <div class="bg-cool-900 rounded-xl py-1 min-h-16">
            <div v-if="inProgressTasks.length === 0" class="text-xs text-cool-600 text-center py-4">None</div>
            <ProjectTaskItem
              v-for="task in inProgressTasks"
              :key="task.id"
              :task="task"
              @status-change="onStatusChange"
              @delete="onDeleteTask"
            />
          </div>
        </div>

        <!-- Done -->
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 mb-2 text-xs font-semibold uppercase tracking-wider text-emerald-500">
            <UIcon name="i-heroicons-check-circle" class="text-emerald-500" />
            Done <span class="ml-auto">{{ doneTasks.length }}</span>
          </div>
          <div class="bg-cool-900 rounded-xl py-1 min-h-16">
            <div v-if="doneTasks.length === 0" class="text-xs text-cool-600 text-center py-4">None</div>
            <ProjectTaskItem
              v-for="task in doneTasks"
              :key="task.id"
              :task="task"
              @status-change="onStatusChange"
              @delete="onDeleteTask"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Notes tab -->
    <div v-else-if="tab === 'notes'" class="flex-1 overflow-y-auto p-4">
      <div class="flex justify-end mb-3">
        <UButton size="sm" icon="i-heroicons-plus" @click="createProjectNote">New note</UButton>
      </div>
      <div v-if="projectNotes.length === 0" class="flex items-center justify-center h-40 text-cool-500">
        No notes for this project yet.
      </div>
      <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <NuxtLink v-for="note in projectNotes" :key="note.id" :to="`/notes/${note.id}`">
          <NoteCard :note="note" :is-own="note.authorId === authStore.user?.uid" />
        </NuxtLink>
      </div>
    </div>

    <!-- Channel tab -->
    <div v-else-if="tab === 'channel'" class="flex-1 flex flex-col items-center justify-center gap-4 p-4">
      <UIcon name="i-heroicons-chat-bubble-left-right" class="text-4xl text-cool-600" />
      <div class="text-center">
        <h2 class="font-semibold">Project Channel</h2>
        <p class="text-sm text-cool-400 mt-1">
          A dedicated channel was created for this project.
        </p>
      </div>
      <UButton
        v-if="project?.channelId"
        icon="i-heroicons-arrow-right"
        trailing
        :to="`/chat/${project.channelId}`"
      >
        Open channel
      </UButton>
      <p v-else class="text-sm text-cool-500">No channel linked to this project.</p>
    </div>
  </div>
</template>
