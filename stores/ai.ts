import { defineStore } from 'pinia'
import {
  collection,
  addDoc,
  setDoc,
  doc,
  onSnapshot,
  query,
  where,
  orderBy,
  serverTimestamp,
  type Unsubscribe,
} from 'firebase/firestore'
import type { LLMSession, LLMMessage } from '~/types'

export const useAiStore = defineStore('ai', () => {
  const db = () => (useNuxtApp() as any).$firebaseDb
  const authStore = useAuthStore()

  const sessions = ref<LLMSession[]>([])
  const messages = ref<LLMMessage[]>([])
  const activeSessionId = ref<string | null>(null)
  const streaming = ref(false)
  const streamingContent = ref('')

  let sessionUnsub: Unsubscribe | null = null
  let messageUnsub: Unsubscribe | null = null

  function subscribeSessions() {
    sessionUnsub?.()
    const user = authStore.user
    if (!user) return
    const q = query(
      collection(db(), 'ai_sessions'),
      where('authorId', '==', user.uid),
      orderBy('updatedAt', 'desc'),
    )
    sessionUnsub = onSnapshot(q, (snap) => {
      sessions.value = snap.docs.map(d => ({
        id: d.id,
        ...d.data(),
        createdAt: d.data().createdAt?.toDate() ?? new Date(),
        updatedAt: d.data().updatedAt?.toDate() ?? new Date(),
      } as LLMSession))
    })
  }

  // Flat structure: ai_messages/{id} with sessionId field
  function subscribeMessages(sessionId: string) {
    messageUnsub?.()
    activeSessionId.value = sessionId
    const q = query(
      collection(db(), 'ai_messages'),
      where('sessionId', '==', sessionId),
      orderBy('createdAt', 'asc'),
    )
    messageUnsub = onSnapshot(q, (snap) => {
      messages.value = snap.docs.map(d => ({
        id: d.id,
        ...d.data(),
        createdAt: d.data().createdAt?.toDate() ?? new Date(),
      } as LLMMessage))
    })
  }

  async function createSession(model: string, endpoint: string, provider: string): Promise<string> {
    const user = authStore.user
    if (!user) throw new Error('Not authenticated')
    const ref = await addDoc(collection(db(), 'ai_sessions'), {
      title: 'New conversation',
      model,
      endpoint,
      provider,
      authorId: user.uid,
      authorName: user.displayName,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    return ref.id
  }

  async function saveMessage(sessionId: string, role: 'user' | 'assistant', content: string, model: string) {
    await addDoc(collection(db(), 'ai_messages'), {
      sessionId,
      role,
      content,
      model,
      createdAt: serverTimestamp(),
    })
    // Update session title from first user message
    if (role === 'user' && messages.value.length === 0) {
      await setDoc(doc(db(), 'ai_sessions', sessionId), {
        title: content.slice(0, 60),
        updatedAt: serverTimestamp(),
      }, { merge: true })
    } else {
      await setDoc(doc(db(), 'ai_sessions', sessionId), {
        updatedAt: serverTimestamp(),
      }, { merge: true })
    }
  }

  function unsubscribeAll() {
    sessionUnsub?.()
    messageUnsub?.()
  }

  return {
    sessions,
    messages,
    activeSessionId,
    streaming,
    streamingContent,
    subscribeSessions,
    subscribeMessages,
    createSession,
    saveMessage,
    unsubscribeAll,
  }
})
