import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// PREVIEW=1: self-contained preview build (relative paths, #routes, no service worker)
const preview = process.env.PREVIEW === '1'

export default defineConfig(({ isSsrBuild }) => ({
  base: preview ? './' : '/',
  plugins: [
    react(),
    tailwindcss(),
    !preview && !isSsrBuild &&
      VitePWA({
        registerType: 'autoUpdate',
        workbox: { navigateFallback: '/200.html', globPatterns: ['**/*.{js,css,svg,woff2}'] },
        manifest: {
          name: 'LiveSinger Shimla', short_name: 'LiveSinger', description: 'Book live singers in Shimla',
          theme_color: '#ffffff', background_color: '#ffffff', display: 'standalone', start_url: '/',
          icons: [{ src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml' }],
        },
      }),
  ],
}))
