import type { Auth } from 'firebase/auth'
import type { Firestore } from 'firebase/firestore'

export function useFirebase() {
  const nuxt = useNuxtApp()
  return {
    auth: nuxt.$firebaseAuth as Auth,
    db: nuxt.$firebaseDb as Firestore,
  }
}
