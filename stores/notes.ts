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
  or,
  serverTimestamp,
  type Unsubscribe,
} from 'firebase/firestore'
import type { Note } from '~/types'

export const useNotesStore = defineStore('notes', () => {
  const db = () => (useNuxtApp() as any).$firebaseDb
  const authStore = useAuthStore()

  const notes = ref<Note[]>([])
  let unsub: Unsubscribe | null = null

  function subscribe() {
    unsub?.()
    const user = authStore.user
    if (!user) return

    // Flat notes collection: fetch own notes + notes shared with 'all'
    const q = query(
      collection(db(), 'notes'),
      or(
        where('authorId', '==', user.uid),
        where('sharedWith', '==', 'all'),
      ),
      orderBy('updatedAt', 'desc'),
    )
    unsub = onSnapshot(q, (snap) => {
      notes.value = snap.docs.map(d => ({
        id: d.id,
        ...d.data(),
        createdAt: d.data().createdAt?.toDate() ?? new Date(),
        updatedAt: d.data().updatedAt?.toDate() ?? new Date(),
      } as Note))
    })
  }

  async function createNote(): Promise<string> {
    const user = authStore.user
    if (!user) throw new Error('Not authenticated')
    const ref = await addDoc(collection(db(), 'notes'), {
      title: 'Untitled note',
      content: '',
      authorId: user.uid,
      authorName: user.displayName,
      sharedWith: [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    return ref.id
  }

  async function saveNote(id: string, updates: Partial<Pick<Note, 'title' | 'content' | 'sharedWith'>>) {
    await setDoc(doc(db(), 'notes', id), {
      ...updates,
      updatedAt: serverTimestamp(),
    }, { merge: true })
  }

  async function deleteNote(id: string) {
    await deleteDoc(doc(db(), 'notes', id))
  }

  function unsubscribe() {
    unsub?.()
  }

  return { notes, subscribe, createNote, saveNote, deleteNote, unsubscribe }
})
