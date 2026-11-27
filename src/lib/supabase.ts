import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

// True when the Supabase env vars are set: real login (email code) and real data.
export const configured = !!(url && key)
// Demo data and preview login shortcuts are only allowed in local dev or the explicit preview build (VITE_DEMO=1).
// A production build never falls back to demo: vite.config.ts stops the build if Supabase is not configured.
export const demoAllowed = !configured && (import.meta.env.DEV || import.meta.env.VITE_DEMO === '1')

export const sb = configured && typeof window !== 'undefined'
  ? createClient(url!, key!)
  : null
