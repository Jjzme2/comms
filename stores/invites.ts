import { defineStore } from 'pinia'
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  type Unsubscribe,
} from 'firebase/firestore'
import type { Invite } from '~/types'

export const useInvitesStore = defineStore('invites', () => {
  const db = () => (useNuxtApp() as any).$firebaseDb
  const authStore = useAuthStore()

  const invites = ref<(Invite & { email: string })[]>([])
  let unsub: Unsubscribe | null = null

  function subscribe() {
    unsub?.()
    const q = query(collection(db(), 'invites'), orderBy('invitedAt', 'desc'))
    unsub = onSnapshot(q, (snap) => {
      invites.value = snap.docs.map(d => ({
        email: d.id,
        ...d.data(),
        invitedAt: d.data().invitedAt?.toDate() ?? new Date(),
      } as Invite & { email: string }))
    })
  }

  async function addInvite(email: string): Promise<{ emailSent: boolean; emailError?: string }> {
    const user = authStore.user
    if (!user) return { emailSent: false, emailError: 'Not authenticated' }
    const normalised = email.trim().toLowerCase()
    await setDoc(doc(db(), 'invites', normalised), {
      invitedBy: user.uid,
      invitedByName: user.displayName,
      invitedAt: serverTimestamp(),
      status: 'pending',
    })

    try {
      await $fetch('/api/invites/send-email', {
        method: 'POST',
        body: { email: normalised, inviterName: user.displayName ?? 'Someone' },
      })
      return { emailSent: true }
    } catch (e: any) {
      return { emailSent: false, emailError: e?.data?.message ?? e?.message ?? 'Email not sent' }
    }
  }

  async function revokeInvite(email: string) {
    await deleteDoc(doc(db(), 'invites', email.toLowerCase()))
  }

  function unsubscribe() {
    unsub?.()
  }

  return { invites, subscribe, addInvite, revokeInvite, unsubscribe }
})
