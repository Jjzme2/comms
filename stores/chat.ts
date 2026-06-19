import { defineStore } from 'pinia'
import {
  collection,
  doc,
  addDoc,
  setDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  getDocs,
  type Unsubscribe,
} from 'firebase/firestore'
import type { Channel, Message } from '~/types'

export const useChatStore = defineStore('chat', () => {
  const db = () => (useNuxtApp() as any).$firebaseDb
  const authStore = useAuthStore()

  const channels = ref<Channel[]>([])
  const messages = ref<Message[]>([])
  const activeChannelId = ref<string | null>(null)

  let channelUnsub: Unsubscribe | null = null
  let messageUnsub: Unsubscribe | null = null

  function subscribeChannels() {
    channelUnsub?.()
    const q = query(collection(db(), 'channels'), orderBy('createdAt', 'asc'))
    channelUnsub = onSnapshot(q, (snap) => {
      channels.value = snap.docs.map(d => ({ id: d.id, ...d.data() } as Channel))
    })
  }

  // Flat structure: messages/{id} with channelId field
  function subscribeMessages(channelId: string) {
    messageUnsub?.()
    activeChannelId.value = channelId
    const q = query(
      collection(db(), 'messages'),
      where('channelId', '==', channelId),
      orderBy('createdAt', 'asc'),
      limit(100),
    )
    messageUnsub = onSnapshot(q, (snap) => {
      messages.value = snap.docs.map(d => ({
        id: d.id,
        ...d.data(),
        createdAt: d.data().createdAt?.toDate() ?? new Date(),
      } as Message))
    })
  }

  async function sendMessage(channelId: string, content: string, extras: Partial<Message> = {}) {
    const user = authStore.user
    if (!user) return
    const d = db()
    await addDoc(collection(d, 'messages'), {
      channelId,
      content,
      type: extras.type ?? 'text',
      authorId: user.uid,
      authorName: user.displayName,
      authorPhoto: user.photoURL ?? null,
      fileUrl: extras.fileUrl ?? null,
      fileName: extras.fileName ?? null,
      fileSize: extras.fileSize ?? null,
      fileType: extras.fileType ?? null,
      r2Key: extras.r2Key ?? null,
      reactions: {},
      createdAt: serverTimestamp(),
    })
    await setDoc(doc(d, 'channels', channelId), {
      lastMessage: {
        content: content || extras.fileName || 'File',
        authorName: user.displayName,
        createdAt: serverTimestamp(),
      },
    }, { merge: true })
  }

  async function toggleReaction(messageId: string, emoji: string) {
    const user = authStore.user
    if (!user) return
    const msg = messages.value.find(m => m.id === messageId)
    if (!msg) return
    const current = msg.reactions[emoji] ?? []
    const updated = current.includes(user.uid)
      ? current.filter(id => id !== user.uid)
      : [...current, user.uid]
    await setDoc(doc(db(), 'messages', messageId), {
      reactions: { ...msg.reactions, [emoji]: updated },
    }, { merge: true })
  }

  async function createChannel(name: string, description?: string) {
    const user = authStore.user
    if (!user) return
    const ref = await addDoc(collection(db(), 'channels'), {
      name,
      description: description ?? '',
      createdBy: user.uid,
      createdAt: serverTimestamp(),
    })
    return ref.id
  }

  async function ensureGeneralChannel() {
    const d = db()
    const q = query(collection(d, 'channels'), where('name', '==', 'general'))
    const snap = await getDocs(q)
    if (snap.empty) {
      const user = authStore.user
      await addDoc(collection(d, 'channels'), {
        name: 'general',
        description: 'The main channel',
        createdBy: user?.uid ?? 'system',
        createdAt: serverTimestamp(),
      })
    }
  }

  function unsubscribeAll() {
    channelUnsub?.()
    messageUnsub?.()
  }

  return {
    channels,
    messages,
    activeChannelId,
    subscribeChannels,
    subscribeMessages,
    sendMessage,
    toggleReaction,
    createChannel,
    ensureGeneralChannel,
    unsubscribeAll,
  }
})
