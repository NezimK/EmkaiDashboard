import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.png', 'apple-touch-icon.png', 'pwa-192.png', 'pwa-512.png'],
      manifest: {
        name: 'IMMO Copilot Dashboard',
        short_name: 'IMMO Copilot',
        description: 'Dashboard de gestion de leads immobiliers',
        theme_color: '#C5A065',
        background_color: '#0F0F0F',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          {
            src: '/pwa-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/pwa-512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: '/pwa-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*supabase\.co/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 // 1 heure
              }
            }
          }
        ]
      }
    })
  ],
  server: {
    host: '0.0.0.0', // Accessible sur le réseau local
    proxy: {
      // Proxy pour n8n webhooks (rewrite spécifique)
      '/api/n8n': {
        target: 'https://n8n.emkai.fr',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/n8n/, ''),
        secure: true,
      },
      // Toutes les autres routes API → saas-backend local
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      // OAuth callbacks (servies par le backend, pas par /api)
      '/auth': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
})
