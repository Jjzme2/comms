export default defineNuxtRouteMiddleware(async (to) => {
  if (import.meta.server) return

  const authStore = useAuthStore()

  // Block navigation until Firebase has confirmed auth state.
  // On first load this waits for onAuthStateChanged to fire; on subsequent
  // navigations loading is already false so this resolves immediately.
  if (authStore.loading) {
    await until(() => !authStore.loading).toBeTruthy()
  }

  if (!authStore.user && to.path !== '/login') {
    return navigateTo('/login')
  }
  if (authStore.user && to.path === '/login') {
    return navigateTo('/chat')
  }
})
