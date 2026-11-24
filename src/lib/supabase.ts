import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined
// null = demo mode (data stays in this browser). Set both env vars to go live.
export const sb = url && key && typeof window !== 'undefined' ? createClient(url, key) : null
