export default defineNuxtConfig({
  modules: ['@nuxt/ui'],
  css: ['~/assets/css/photoshop.css'],
  ssr: false,
  future: {
    compatibilityVersion: 4,
  },
  app: {
    head: {
      title: 'Adobe Photoshop 1.0',
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1' }
      ]
    }
  },
  compatibilityDate: '2025-01-01'
})
