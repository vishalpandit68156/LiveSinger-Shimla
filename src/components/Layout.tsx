import { Home, LayoutDashboard, LogIn, LogOut, Mic, Search, ShieldCheck, User } from 'lucide-react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { LANDINGS } from '../data/catalog'
import { useAuth } from '../lib/auth'
import { Link, paths, usePath } from '../lib/router'
import { SITE_EMAIL, SITE_NAME } from '../lib/site'

export function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2.5" aria-label={`${SITE_NAME} home`}>
      <span className="grid size-9 place-items-center rounded-xl bg-ink text-white"><Mic size={18} /></span>
      <span className="text-[17px] font-bold leading-none tracking-tight">LiveSinger<span className="text-green"> Shimla</span></span>
    </Link>
  )
}

function AccountButton() {
  const { ready, email, isAdmin, logout } = useAuth()
  const [open, setOpen] = useState(false)
  const box = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const close = (e: Event) => { if (!box.current?.contains(e.target as Node)) setOpen(false) }
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('pointerdown', close)
    document.addEventListener('keydown', esc)
    return () => { document.removeEventListener('pointerdown', close); document.removeEventListener('keydown', esc) }
  }, [open])
  if (!ready) return <span className="h-10 w-10" />
  if (!email) return <Link to={paths.login} className="btn btn-outline btn-sm"><LogIn size={16} /> Log in</Link>
  return (
    <div className="relative" ref={box}>
      <button onClick={() => setOpen(!open)} aria-label="Account menu" aria-haspopup="menu" aria-expanded={open}
        className={`grid h-10 w-10 place-items-center rounded-full border transition ${open ? 'border-green bg-mint text-green-dark' : 'border-line bg-soft text-ink hover:border-green/50'}`}>
        <User size={19} />
      </button>
      {open && (
        <div role="menu" className="card sheet-in absolute right-0 top-12 z-50 w-60 p-1.5" onClick={() => setOpen(false)}>
          <div className="px-3 pb-2 pt-1.5"><span className="block text-xs muted">Signed in as</span><span className="block truncate text-sm font-semibold">{email}</span></div>
          <div className="mb-1 border-t border-line" />
          {isAdmin && <Link to={paths.admin} className="flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-medium hover:bg-soft"><ShieldCheck size={16} /> Admin dashboard</Link>}
          <Link to={paths.dashboard} className="flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-medium hover:bg-soft"><LayoutDashboard size={16} /> Singer dashboard</Link>
          <button onClick={() => logout()} className="flex min-h-11 w-full items-center gap-2 rounded-xl px-3 text-sm font-medium text-red-700 hover:bg-red-50"><LogOut size={16} /> Log out</button>
        </div>
      )}
    </div>
  )
}

export function Header() {
  const path = usePath()
  const nav = [[paths.singers, 'Find singers'], [paths.how, 'How it works'], [paths.join, 'For singers']] as const
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white/90 backdrop-blur-lg">
      <div className="wrap flex h-16 items-center justify-between gap-4">
        <Logo />
        <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
          {nav.map(([to, l]) => <Link key={to} to={to} className={`rounded-xl px-3 py-2 text-[15px] font-medium hover:bg-soft ${path.startsWith(to) ? 'text-ink' : 'text-muted'}`}>{l}</Link>)}
        </nav>
        <AccountButton />
      </div>
    </header>
  )
}

export function BottomNav() {
  const path = usePath()
  const { email, isAdmin } = useAuth()
  const items = [
    { to: '/', label: 'Home', I: Home, on: path === '/' },
    { to: paths.singers, label: 'Singers', I: Search, on: path.startsWith('/singer') || path.startsWith('/shimla') },
    { to: email ? (isAdmin ? paths.admin : paths.dashboard) : paths.join, label: email ? 'Account' : 'For singers', I: email ? User : Mic, on: path.startsWith('/dashboard') || path.startsWith('/admin') || path === '/join' },
  ]
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white/95 backdrop-blur-lg md:hidden" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }} aria-label="App">
      <div className="grid grid-cols-3">
        {items.map(({ to, label, I, on }) => (
          <Link key={label} to={to} className={`flex min-h-[58px] flex-col items-center justify-center gap-0.5 text-[11.5px] font-semibold ${on ? 'text-green-dark' : 'text-muted'}`}>
            <I size={21} strokeWidth={on ? 2.4 : 2} /> {label}
          </Link>
        ))}
      </div>
    </nav>
  )
}

export function Footer() {
  return (
    <footer className="mt-10 border-t border-line bg-soft">
      <div className="wrap grid gap-8 py-10 pb-28 sm:grid-cols-2 md:grid-cols-4 md:pb-10">
        <div className="sm:col-span-2 md:col-span-1">
          <Logo />
          <p className="mt-3 text-sm muted">Book verified live singers, bands and Sufi acts in Shimla for hotels, weddings and events.</p>
          <p className="mt-3 text-sm muted">{SITE_EMAIL}</p>
        </div>
        <div>
          <h3 className="text-sm font-bold">Popular searches</h3>
          <ul className="mt-3 space-y-2 text-sm muted">{LANDINGS.slice(0, 4).map((l) => <li key={l.slug}><Link to={paths.landing(l.slug)} className="hover:text-ink">{l.h1}</Link></li>)}</ul>
        </div>
        <div>
          <h3 className="text-sm font-bold">More in Shimla</h3>
          <ul className="mt-3 space-y-2 text-sm muted">{LANDINGS.slice(4).map((l) => <li key={l.slug}><Link to={paths.landing(l.slug)} className="hover:text-ink">{l.h1}</Link></li>)}</ul>
        </div>
        <div>
          <h3 className="text-sm font-bold">Company</h3>
          <ul className="mt-3 space-y-2 text-sm muted">
            <li><Link to={paths.how} className="hover:text-ink">How booking works</Link></li>
            <li><Link to={paths.join} className="hover:text-ink">Join as a singer</Link></li>
            <li><Link to={paths.login} className="hover:text-ink">Log in</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-line py-4 text-center text-xs muted">© {new Date().getFullYear()} {SITE_NAME}. Shimla, Himachal Pradesh.</div>
    </footer>
  )
}

export function PublicShell({ children }: { children: ReactNode }) {
  return <><Header /><main className="min-h-[60vh] pb-16 md:pb-0">{children}</main><Footer /><BottomNav /></>
}
