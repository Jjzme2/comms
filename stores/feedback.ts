import { defineStore } from 'pinia'
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  type Unsubscribe,
} from 'firebase/firestore'
import type { Feedback, FeedbackType } from '~/types'

export const useFeedbackStore = defineStore('feedback', () => {
  const db = () => (useNuxtApp() as any).$firebaseDb
  const authStore = useAuthStore()

  const items = ref<Feedback[]>([])
  let unsub: Unsubscribe | null = null

  async function submit(type: FeedbackType, title: string, description: string) {
    const user = authStore.user
    if (!user) throw new Error('Not authenticated')
    await addDoc(collection(db(), 'feedback'), {
      type,
      title,
      description,
      authorId: user.uid,
      authorName: user.displayName,
      status: 'open',
      createdAt: serverTimestamp(),
    })
  }

  function subscribe() {
    unsub?.()
    const q = query(collection(db(), 'feedback'), orderBy('createdAt', 'desc'))
    unsub = onSnapshot(q, (snap) => {
      items.value = snap.docs.map(d => ({
        id: d.id,
        ...d.data(),
        createdAt: d.data().createdAt?.toDate() ?? new Date(),
      } as Feedback))
    })
  }

  function unsubscribe() {
    unsub?.()
  }

  return { items, submit, subscribe, unsubscribe }
})
