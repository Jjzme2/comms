export default defineNuxtConfig({
  devtools: { enabled: true },
  ssr: false,

  devServer: {
    port: 4200,
  },
  compatibilityDate: '2026-06-18',

  experimental: {
    // Required for ssr:false to work with Vite 7's Environment API —
    // without it, vite-builder can't resolve the Nitro server entry from the client config.
    viteEnvironmentApi: true,
  },

  modules: [
    '@nuxt/ui',
    '@pinia/nuxt',
    '@vueuse/nuxt',
  ],

  ui: {
    primary: 'indigo',
    gray: 'cool',
  },

  colorMode: {
    preference: 'dark',
  },

  runtimeConfig: {
    r2AccountId: '',
    r2AccessKeyId: '',
    r2SecretAccessKey: '',
    r2BucketName: '',
    r2Endpoint: '',
    resendApiKey: '',
    resendFrom: '',
    public: {
      appUrl: '',
      firebaseApiKey: '',
      firebaseAuthDomain: '',
      firebaseProjectId: '',
      firebaseStorageBucket: '',
      firebaseMessagingSenderId: '',
      firebaseAppId: '',
      r2PublicUrl: '',
      // Comma-separated list of emails that get admin role on first registration
      adminEmails: '',
    },
  },

  typescript: {
    strict: true,
  },
})
