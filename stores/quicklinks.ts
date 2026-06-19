import { defineStore } from 'pinia'
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  type Unsubscribe,
} from 'firebase/firestore'
import type { QuickLink } from '~/types'

export const useQuicklinksStore = defineStore('quicklinks', () => {
  const db = () => (useNuxtApp() as any).$firebaseDb
  const authStore = useAuthStore()

  const links = ref<QuickLink[]>([])
  const search = ref('')
  const activeTag = ref('')

  let unsub: Unsubscribe | null = null

  function subscribe() {
    unsub?.()
    const q = query(collection(db(), 'quicklinks'), orderBy('createdAt', 'desc'))
    unsub = onSnapshot(q, (snap) => {
      links.value = snap.docs.map(d => ({
        id: d.id,
        ...d.data(),
        createdAt: d.data().createdAt?.toDate() ?? new Date(),
      } as QuickLink))
    })
  }

  const filteredLinks = computed(() => {
    let result = links.value
    if (activeTag.value) {
      result = result.filter(l => l.tags.includes(activeTag.value))
    }
    if (search.value) {
      const q = search.value.toLowerCase()
      result = result.filter(
        l =>
          l.title.toLowerCase().includes(q) ||
          l.url.toLowerCase().includes(q) ||
          (l.description?.toLowerCase().includes(q) ?? false),
      )
    }
    return result
  })

  const allTags = computed(() =>
    [...new Set(links.value.flatMap(l => l.tags))].sort(),
  )

  async function addLink(payload: Pick<QuickLink, 'title' | 'url' | 'description' | 'tags'>) {
    const user = authStore.user
    if (!user) return
    await addDoc(collection(db(), 'quicklinks'), {
      ...payload,
      addedBy: user.uid,
      addedByName: user.displayName,
      createdAt: serverTimestamp(),
    })
  }

  async function deleteLink(id: string) {
    await deleteDoc(doc(db(), 'quicklinks', id))
  }

  function unsubscribe() {
    unsub?.()
  }

  return { links, search, activeTag, filteredLinks, allTags, subscribe, addLink, deleteLink, unsubscribe }
})
