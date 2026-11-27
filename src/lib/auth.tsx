import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { DEMO_ADMIN, demoSession } from './session'
import { configured, demoAllowed, sb } from './supabase'

type Auth = {
  ready: boolean; email: string | null; isAdmin: boolean
  /** demo = preview login (no emails). notConfigured = production build without Supabase keys. */
  demo: boolean; notConfigured: boolean
  sendCode(email: string): Promise<void>; verify(email: string, code: string): Promise<void>; logout(): Promise<void>
}
const Ctx = createContext<Auth>(null!)
export const useAuth = () => useContext(Ctx)

const NOT_SET_UP = 'Login is not set up yet. Please try again later.'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false)
  const [email, setEmail] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    if (!sb) {
      const s = demoAllowed ? demoSession.get() : null
      setEmail(s?.email ?? null); setIsAdmin(s?.email === DEMO_ADMIN); setReady(true); return
    }
    let alive = true
    const apply = async (e: string | null) => {
      let admin = false
      if (e) { const { data, error } = await sb!.rpc('is_admin'); admin = !error && !!data }
      if (!alive) return
      setEmail(e); setIsAdmin(admin); setReady(true)
    }
    sb.auth.getSession().then(({ data }) => apply(data.session?.user.email ?? null))
    // Supabase calls inside onAuthStateChange can deadlock, so run them after the callback returns.
    const { data } = sb.auth.onAuthStateChange((_e, s) => { setTimeout(() => apply(s?.user.email ?? null), 0) })
    return () => { alive = false; data.subscription.unsubscribe() }
  }, [])

  const value: Auth = {
    ready, email, isAdmin, demo: demoAllowed, notConfigured: !configured && !demoAllowed,
    async sendCode(e) {
      if (!sb) { if (demoAllowed) return; throw new Error(NOT_SET_UP) }
      const { error } = await sb.auth.signInWithOtp({ email: e.toLowerCase(), options: { shouldCreateUser: true } })
      if (error) throw error
    },
    async verify(e, code) {
      if (!sb) {
        if (!demoAllowed) throw new Error(NOT_SET_UP)
        if (!/^\d{6}$/.test(code)) throw new Error('Enter the 6 digit code')
        demoSession.set({ email: e.toLowerCase() }); setEmail(e.toLowerCase()); setIsAdmin(e.toLowerCase() === DEMO_ADMIN); return
      }
      const { error } = await sb.auth.verifyOtp({ email: e.toLowerCase(), token: code, type: 'email' })
      if (error) throw error
    },
    async logout() {
      if (sb) await sb.auth.signOut()
      else demoSession.set(null)
      setEmail(null); setIsAdmin(false)
    },
  }
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
