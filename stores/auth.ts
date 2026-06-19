import { defineStore } from 'pinia'
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  type Auth,
  type User as FirebaseUser,
} from 'firebase/auth'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import type { AppUser } from '~/types'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<AppUser | null>(null)
  const loading = ref(true)
  const error = ref<string | null>(null)

  // Lazy Firebase access — only called on the client after the plugin has run
  function fb() {
    const nuxt = useNuxtApp() as any
    return { auth: nuxt.$firebaseAuth, db: nuxt.$firebaseDb }
  }

  function isAdminEmail(email: string): boolean {
    const config = useRuntimeConfig()
    const list = (config.public.adminEmails as string)
      .split(',')
      .map(e => e.trim().toLowerCase())
      .filter(Boolean)
    return list.includes(email.toLowerCase())
  }

  async function loadOrCreateUserProfile(firebaseUser: FirebaseUser) {
    const { db } = fb()
    const snap = await getDoc(doc(db, 'users', firebaseUser.uid))
    if (snap.exists()) {
      user.value = { uid: firebaseUser.uid, ...snap.data() } as AppUser
    } else {
      const role = isAdminEmail(firebaseUser.email ?? '') ? 'admin' : 'member'
      const profile = {
        email: (firebaseUser.email ?? '').toLowerCase(),
        displayName: firebaseUser.displayName ?? firebaseUser.email?.split('@')[0] ?? 'User',
        photoURL: firebaseUser.photoURL ?? null,
        role,
        createdAt: serverTimestamp(),
      }
      await setDoc(doc(db, 'users', firebaseUser.uid), profile)
      user.value = { uid: firebaseUser.uid, ...profile, createdAt: new Date() } as AppUser
    }
  }

  let initialized = false
  function init(auth: Auth) {
    if (initialized) return
    initialized = true
    onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        await loadOrCreateUserProfile(firebaseUser)
      } else {
        user.value = null
      }
      loading.value = false
    })
  }

  async function checkInvite(email: string): Promise<boolean> {
    const { db } = fb()
    const snap = await getDoc(doc(db, 'invites', email.toLowerCase()))
    return snap.exists()
  }

  async function login(email: string, password: string) {
    error.value = null
    const { auth } = fb()
    const cred = await signInWithEmailAndPassword(auth, email, password)
    await loadOrCreateUserProfile(cred.user)
  }

  async function register(email: string, password: string, displayName: string) {
    error.value = null
    const { auth, db } = fb()

    const invited = await checkInvite(email)
    if (!invited) throw new Error('No invite found for this email address.')

    const cred = await createUserWithEmailAndPassword(auth, email, password)
    await updateProfile(cred.user, { displayName })

    const role = isAdminEmail(email) ? 'admin' : 'member'

    const profile: Omit<AppUser, 'uid'> = {
      email: email.toLowerCase(),
      displayName,
      role,
      createdAt: new Date(),
    }
    await setDoc(doc(db, 'users', cred.user.uid), {
      ...profile,
      createdAt: serverTimestamp(),
    })
    await setDoc(doc(db, 'invites', email.toLowerCase()), { status: 'accepted' }, { merge: true })

    user.value = { uid: cred.user.uid, ...profile }
  }

  async function logout() {
    const { auth } = fb()
    await signOut(auth)
    user.value = null
    await navigateTo('/login')
  }

  const isAdmin = computed(() => user.value?.role === 'admin')

  return { user, loading, error, init, login, register, logout, isAdmin, checkInvite }
})
