import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { DEMO_ADMIN, demoSession } from './session'
import { sb } from './supabase'

type Auth = {
  ready: boolean; email: string | null; isAdmin: boolean; demo: boolean
  sendCode(email: string): Promise<void>; verify(email: string, code: string): Promise<void>; logout(): Promise<void>
}
const Ctx = createContext<Auth>(null!)
export const useAuth = () => useContext(Ctx)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false)
  const [email, setEmail] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    if (!sb) { const s = demoSession.get(); setEmail(s?.email ?? null); setIsAdmin(s?.email === DEMO_ADMIN); setReady(true); return }
    const apply = async (e: string | null) => {
      setEmail(e)
      setIsAdmin(e ? !!(await sb!.rpc('is_admin')).data : false)
      setReady(true)
    }
    sb.auth.getSession().then(({ data }) => apply(data.session?.user.email ?? null))
    const { data } = sb.auth.onAuthStateChange((_e, s) => { apply(s?.user.email ?? null) })
    return () => data.subscription.unsubscribe()
  }, [])

  const value: Auth = {
    ready, email, isAdmin, demo: !sb,
    async sendCode(e) {
      if (!sb) return
      const { error } = await sb.auth.signInWithOtp({ email: e, options: { shouldCreateUser: true } })
      if (error) throw error
    },
    async verify(e, code) {
      if (!sb) {
        if (!/^\d{6}$/.test(code)) throw new Error('Enter the 6 digit code')
        demoSession.set({ email: e.toLowerCase() }); setEmail(e.toLowerCase()); setIsAdmin(e.toLowerCase() === DEMO_ADMIN); return
      }
      const { error } = await sb.auth.verifyOtp({ email: e, token: code, type: 'email' })
      if (error) throw error
    },
    async logout() { if (sb) await sb.auth.signOut(); else { demoSession.set(null); setEmail(null); setIsAdmin(false) } },
  }
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
