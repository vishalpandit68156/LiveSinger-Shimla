// Demo-mode login (no backend). Real mode uses Supabase email codes.
export type DemoSession = { email: string }
export const DEMO_ADMIN = 'admin@livesingershimla.com'
export const demoSession = {
  get(): DemoSession | null { try { return JSON.parse(localStorage.getItem('lss_demo_session') || 'null') } catch { return null } },
  set(s: DemoSession | null) { try { if (s) localStorage.setItem('lss_demo_session', JSON.stringify(s)); else localStorage.removeItem('lss_demo_session') } catch { /* ignore */ } },
}
