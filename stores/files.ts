import { defineStore } from 'pinia'
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  deleteDoc,
  doc,
  serverTimestamp,
  type Unsubscribe,
} from 'firebase/firestore'
import type { FileItem } from '~/types'

export const useFilesStore = defineStore('files', () => {
  const db = () => (useNuxtApp() as any).$firebaseDb
  const authStore = useAuthStore()

  const files = ref<FileItem[]>([])
  const uploading = ref(false)
  const uploadProgress = ref(0)

  let unsub: Unsubscribe | null = null

  function subscribe() {
    unsub?.()
    const q = query(collection(db(), 'files'), orderBy('uploadedAt', 'desc'))
    unsub = onSnapshot(q, (snap) => {
      files.value = snap.docs.map(d => ({
        id: d.id,
        ...d.data(),
        uploadedAt: d.data().uploadedAt?.toDate() ?? new Date(),
      } as FileItem))
    })
  }

  async function uploadFile(file: File, tags: string[] = []) {
    const user = authStore.user
    if (!user) return

    uploading.value = true
    uploadProgress.value = 0

    try {
      // 1. Get presigned PUT URL from server
      const ext = file.name.split('.').pop() ?? ''
      const r2Key = `files/${user.uid}/${Date.now()}-${file.name}`

      const { url } = await $fetch<{ url: string }>('/api/r2/presign', {
        method: 'POST',
        body: { key: r2Key, contentType: file.type },
      })

      // 2. Upload directly to R2
      await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      })

      uploadProgress.value = 80

      // 3. Save metadata to Firestore (flat files collection)
      await addDoc(collection(db(), 'files'), {
        name: file.name,
        size: file.size,
        type: file.type,
        ext,
        r2Key,
        uploadedBy: user.uid,
        uploaderName: user.displayName,
        tags,
        uploadedAt: serverTimestamp(),
      })

      uploadProgress.value = 100
    } finally {
      uploading.value = false
    }
  }

  async function getFileUrl(r2Key: string): Promise<string> {
    const config = useRuntimeConfig()
    if (config.public.r2PublicUrl) {
      return `${config.public.r2PublicUrl}/${r2Key}`
    }
    const { url } = await $fetch<{ url: string }>('/api/r2/view', {
      method: 'POST',
      body: { key: r2Key },
    })
    return url
  }

  async function deleteFile(fileId: string) {
    await deleteDoc(doc(db(), 'files', fileId))
  }

  function unsubscribe() {
    unsub?.()
  }

  return { files, uploading, uploadProgress, subscribe, uploadFile, getFileUrl, deleteFile, unsubscribe }
})
