import { defineStore } from 'pinia'
import {
  collection,
  addDoc,
  setDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  where,
  orderBy,
  serverTimestamp,
  type Unsubscribe,
} from 'firebase/firestore'
import type { Project, ProjectTask } from '~/types'

export const useProjectsStore = defineStore('projects', () => {
  const db = () => (useNuxtApp() as any).$firebaseDb
  const authStore = useAuthStore()

  const projects = ref<Project[]>([])
  const tasks = ref<ProjectTask[]>([])

  let projectUnsub: Unsubscribe | null = null
  let taskUnsub: Unsubscribe | null = null

  function subscribeProjects() {
    projectUnsub?.()
    const q = query(collection(db(), 'projects'), orderBy('updatedAt', 'desc'))
    projectUnsub = onSnapshot(q, (snap) => {
      projects.value = snap.docs.map(d => ({
        id: d.id,
        ...d.data(),
        createdAt: d.data().createdAt?.toDate() ?? new Date(),
        updatedAt: d.data().updatedAt?.toDate() ?? new Date(),
      } as Project))
    })
  }

  function subscribeTasks(projectId: string) {
    taskUnsub?.()
    const q = query(
      collection(db(), 'project_tasks'),
      where('projectId', '==', projectId),
      orderBy('order', 'asc'),
    )
    taskUnsub = onSnapshot(q, (snap) => {
      tasks.value = snap.docs.map(d => ({
        id: d.id,
        ...d.data(),
        createdAt: d.data().createdAt?.toDate() ?? new Date(),
        updatedAt: d.data().updatedAt?.toDate() ?? new Date(),
        dueDate: d.data().dueDate?.toDate?.() ?? undefined,
      } as ProjectTask))
    })
  }

  async function createProject(name: string, description?: string): Promise<string> {
    const user = authStore.user
    if (!user) throw new Error('Not authenticated')

    // Create linked channel
    const chatStore = useChatStore()
    const channelId = await chatStore.createChannel(
      `proj-${name.toLowerCase().replace(/\s+/g, '-')}`,
      `Channel for project: ${name}`,
    )

    const ref = await addDoc(collection(db(), 'projects'), {
      name,
      description: description ?? '',
      status: 'active',
      channelId: channelId ?? null,
      createdBy: user.uid,
      createdByName: user.displayName,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    return ref.id
  }

  async function updateProject(id: string, updates: Partial<Pick<Project, 'name' | 'description' | 'status'>>) {
    await setDoc(doc(db(), 'projects', id), {
      ...updates,
      updatedAt: serverTimestamp(),
    }, { merge: true })
  }

  async function deleteProject(id: string) {
    await deleteDoc(doc(db(), 'projects', id))
  }

  async function createTask(projectId: string, title: string): Promise<string> {
    const user = authStore.user
    if (!user) throw new Error('Not authenticated')
    const order = tasks.value.length
    const ref = await addDoc(collection(db(), 'project_tasks'), {
      projectId,
      title,
      description: '',
      status: 'todo',
      order,
      createdBy: user.uid,
      createdByName: user.displayName,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    return ref.id
  }

  async function updateTask(id: string, updates: Partial<Pick<ProjectTask, 'title' | 'description' | 'status' | 'assigneeId' | 'assigneeName'>>) {
    await setDoc(doc(db(), 'project_tasks', id), {
      ...updates,
      updatedAt: serverTimestamp(),
    }, { merge: true })
  }

  async function deleteTask(id: string) {
    await deleteDoc(doc(db(), 'project_tasks', id))
  }

  function unsubscribeAll() {
    projectUnsub?.()
    taskUnsub?.()
  }

  const todoTasks = computed(() => tasks.value.filter(t => t.status === 'todo'))
  const inProgressTasks = computed(() => tasks.value.filter(t => t.status === 'in-progress'))
  const doneTasks = computed(() => tasks.value.filter(t => t.status === 'done'))

  return {
    projects,
    tasks,
    todoTasks,
    inProgressTasks,
    doneTasks,
    subscribeProjects,
    subscribeTasks,
    createProject,
    updateProject,
    deleteProject,
    createTask,
    updateTask,
    deleteTask,
    unsubscribeAll,
  }
})
