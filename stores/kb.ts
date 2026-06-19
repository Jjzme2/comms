import { defineStore } from 'pinia'
import {
  collection,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  where,
  orderBy,
  increment,
  serverTimestamp,
  type Unsubscribe,
} from 'firebase/firestore'
import type { KbTopic, KbComment } from '~/types'

export const useKbStore = defineStore('kb', () => {
  const db = () => (useNuxtApp() as any).$firebaseDb
  const authStore = useAuthStore()

  const topics = ref<KbTopic[]>([])
  const comments = ref<KbComment[]>([])
  let topicsUnsub: Unsubscribe | null = null
  let commentsUnsub: Unsubscribe | null = null

  function subscribeTopics() {
    topicsUnsub?.()
    // Pinned topics first, then by newest
    const q = query(
      collection(db(), 'kb_topics'),
      orderBy('createdAt', 'desc'),
    )
    topicsUnsub = onSnapshot(q, (snap) => {
      const all = snap.docs.map(d => ({
        id: d.id,
        ...d.data(),
        createdAt: d.data().createdAt?.toDate() ?? new Date(),
        updatedAt: d.data().updatedAt?.toDate() ?? new Date(),
      } as KbTopic))
      // Sort pinned first client-side (avoids composite index requirement)
      topics.value = all.sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.createdAt.getTime() - a.createdAt.getTime())
    })
  }

  function subscribeComments(topicId: string) {
    commentsUnsub?.()
    const q = query(
      collection(db(), 'kb_comments'),
      where('topicId', '==', topicId),
      orderBy('createdAt', 'asc'),
    )
    commentsUnsub = onSnapshot(q, (snap) => {
      comments.value = snap.docs.map(d => ({
        id: d.id,
        ...d.data(),
        createdAt: d.data().createdAt?.toDate() ?? new Date(),
        updatedAt: d.data().updatedAt?.toDate() ?? new Date(),
      } as KbComment))
    })
  }

  async function createTopic(title: string, content: string, tags: string[]): Promise<string> {
    const user = authStore.user
    if (!user) throw new Error('Not authenticated')
    const ref = await addDoc(collection(db(), 'kb_topics'), {
      title,
      content,
      tags,
      pinned: false,
      commentCount: 0,
      authorId: user.uid,
      authorName: user.displayName,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    return ref.id
  }

  async function saveTopic(id: string, updates: Partial<Pick<KbTopic, 'title' | 'content' | 'tags'>>) {
    await setDoc(doc(db(), 'kb_topics', id), {
      ...updates,
      updatedAt: serverTimestamp(),
    }, { merge: true })
  }

  async function deleteTopic(id: string) {
    await deleteDoc(doc(db(), 'kb_topics', id))
  }

  async function togglePin(id: string, pinned: boolean) {
    await setDoc(doc(db(), 'kb_topics', id), { pinned }, { merge: true })
  }

  async function addComment(topicId: string, content: string, parentId: string | null = null): Promise<string> {
    const user = authStore.user
    if (!user) throw new Error('Not authenticated')
    const ref = await addDoc(collection(db(), 'kb_comments'), {
      topicId,
      parentId: parentId ?? null,
      content,
      authorId: user.uid,
      authorName: user.displayName,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    await updateDoc(doc(db(), 'kb_topics', topicId), {
      commentCount: increment(1),
    })
    return ref.id
  }

  async function saveComment(id: string, content: string) {
    await setDoc(doc(db(), 'kb_comments', id), {
      content,
      updatedAt: serverTimestamp(),
    }, { merge: true })
  }

  async function deleteComment(id: string, topicId: string) {
    await deleteDoc(doc(db(), 'kb_comments', id))
    await updateDoc(doc(db(), 'kb_topics', topicId), {
      commentCount: increment(-1),
    })
  }

  async function uploadImage(file: File): Promise<string> {
    const user = authStore.user
    if (!user) throw new Error('Not authenticated')

    const r2Key = `kb-images/${user.uid}/${Date.now()}-${file.name}`

    const { url: putUrl } = await $fetch<{ url: string }>('/api/r2/presign', {
      method: 'POST',
      body: { key: r2Key, contentType: file.type },
    })

    await fetch(putUrl, {
      method: 'PUT',
      headers: { 'Content-Type': file.type },
      body: file,
    })

    const { url } = await $fetch<{ url: string }>('/api/r2/view', {
      method: 'POST',
      body: { key: r2Key },
    })
    return url
  }

  function unsubscribeTopics() { topicsUnsub?.() }
  function unsubscribeComments() { commentsUnsub?.() }

  return {
    topics,
    comments,
    subscribeTopics,
    subscribeComments,
    createTopic,
    saveTopic,
    deleteTopic,
    togglePin,
    addComment,
    saveComment,
    deleteComment,
    uploadImage,
    unsubscribeTopics,
    unsubscribeComments,
  }
})
