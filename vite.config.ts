import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, loadEnv } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// PREVIEW=1: self-contained preview build (relative paths, #routes, no service worker)
const preview = process.env.PREVIEW === '1'

export default defineConfig(({ command, mode, isSsrBuild }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  // A real (production) build must talk to Supabase. Never ship the demo login/data by accident.
  if (command === 'build' && !preview && env.VITE_DEMO !== '1' && !(env.VITE_SUPABASE_URL && env.VITE_SUPABASE_ANON_KEY)) {
    throw new Error('VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set for a production build (see README → Supabase setup). For a demo build set VITE_DEMO=1.')
  }
  return {
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
}
})
