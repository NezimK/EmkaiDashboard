import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Proxy pour n8n webhooks - contourne CORS en développement
      '/api/n8n': {
        target: 'https://n8n.emkai.fr',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/n8n/, ''),
        secure: true,
      },
    },
  },
})
