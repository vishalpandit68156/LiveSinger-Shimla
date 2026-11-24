import { ExternalLink, LogOut, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { useAuth } from '../lib/auth'
import { Link, navigate, usePath } from '../lib/router'
import { Logo } from './Layout'
import { Photo } from './Photo'

export type NavItem = { to: string; label: string; icon: LucideIcon; badge?: number; exact?: boolean; mobile?: boolean }

const isOn = (path: string, n: NavItem) => (n.exact ? path === n.to : path === n.to || path.startsWith(n.to + '/'))

/** App-style shell for dashboards: sidebar on desktop, top bar + bottom tabs on phones. */
export function DashShell({ nav, title, user, children, action }: { nav: NavItem[]; title: string; user: { name: string; sub: string; avatar?: string }; children: ReactNode; action?: ReactNode }) {
  const path = usePath()
  const { logout } = useAuth()
  const out = async () => { await logout(); navigate('/') }
  const mobileNav = nav.filter((n) => n.mobile !== false).slice(0, 5)
  return (
    <div className="min-h-dvh bg-soft md:grid md:grid-cols-[256px_1fr]">
      <aside className="sticky top-0 hidden h-dvh flex-col border-r border-line bg-white md:flex">
        <div className="flex h-16 items-center px-5"><Logo /></div>
        <nav className="flex-1 space-y-1 px-3 py-3" aria-label="Dashboard">
          {nav.map((n) => {
            const on = isOn(path, n)
            return (
              <Link key={n.to} to={n.to} className={`flex min-h-11 items-center gap-3 rounded-xl px-3 text-[15px] font-semibold transition ${on ? 'bg-mint text-green-dark' : 'text-muted hover:bg-soft hover:text-ink'}`}>
                <n.icon size={19} strokeWidth={on ? 2.4 : 2} /> <span className="flex-1">{n.label}</span>
                {!!n.badge && <span className="grid min-w-6 place-items-center rounded-full bg-green px-1.5 text-xs font-bold text-white">{n.badge}</span>}
              </Link>
            )
          })}
        </nav>
        <div className="border-t border-line p-3">
          <Link to="/" className="flex min-h-10 items-center gap-2 rounded-xl px-3 text-sm text-muted hover:bg-soft"><ExternalLink size={16} /> Go to website</Link>
          <div className="mt-2 flex items-center gap-3 rounded-xl p-2">
            <Photo src={user.avatar} alt="" name={user.name} className="size-10 shrink-0 rounded-full" />
            <div className="flex-1"><b className="block truncate text-sm">{user.name}</b><span className="block truncate text-xs muted">{user.sub}</span></div>
            <button onClick={out} className="grid size-10 place-items-center rounded-full text-muted hover:bg-soft" aria-label="Log out"><LogOut size={17} /></button>
          </div>
        </div>
      </aside>

      <div className="min-w-0 pb-24 md:pb-10">
        <header className="sticky top-0 z-30 border-b border-line bg-white/90 backdrop-blur-lg">
          <div className="mx-auto flex h-14 max-w-5xl items-center gap-3 px-4 sm:px-6 md:h-16">
            <span className="md:hidden"><Photo src={user.avatar} alt="" name={user.name} className="size-9 rounded-full" /></span>
            <h1 className="flex-1 truncate text-[18px] font-bold md:text-xl">{title}</h1>
            {action}
            <button onClick={out} className="grid size-10 place-items-center rounded-full text-muted hover:bg-soft md:hidden" aria-label="Log out"><LogOut size={18} /></button>
          </div>
        </header>
        <main className="mx-auto max-w-5xl px-4 py-5 sm:px-6 sm:py-6">{children}</main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white/95 backdrop-blur-lg md:hidden" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }} aria-label="Dashboard tabs">
        <div className="grid" style={{ gridTemplateColumns: `repeat(${mobileNav.length}, minmax(0, 1fr))` }}>
          {mobileNav.map((n) => {
            const on = isOn(path, n)
            return (
              <Link key={n.to} to={n.to} className={`relative flex min-h-[58px] flex-col items-center justify-center gap-0.5 text-[11.5px] font-semibold ${on ? 'text-green-dark' : 'text-muted'}`}>
                <n.icon size={21} strokeWidth={on ? 2.4 : 2} />{n.label}
                {!!n.badge && <span className="absolute right-[calc(50%-20px)] top-1.5 grid min-w-[18px] place-items-center rounded-full bg-green px-1 text-[10px] font-bold text-white">{n.badge}</span>}
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}

export function Stat({ label, value, sub, tone = 'ink', icon: I }: { label: string; value: ReactNode; sub?: string; tone?: 'ink' | 'green' | 'amber'; icon?: LucideIcon }) {
  const c = { ink: 'text-ink', green: 'text-green-dark', amber: 'text-amber-600' }[tone]
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between gap-2"><p className="text-sm font-medium muted">{label}</p>{I && <I size={17} className="text-muted" />}</div>
      <p className={`mt-1.5 text-[26px] font-extrabold leading-none ${c}`}>{value}</p>
      {sub && <p className="mt-1.5 text-xs muted">{sub}</p>}
    </div>
  )
}

export function Panel({ title, action, children, className = '' }: { title?: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`card overflow-hidden ${className}`}>
      {title && <div className="flex min-h-[52px] items-center justify-between gap-3 border-b border-line px-4"><h2 className="font-bold">{title}</h2>{action}</div>}
      {children}
    </section>
  )
}

export function Empty({ icon: I, title, text, children }: { icon: LucideIcon; title: string; text?: string; children?: ReactNode }) {
  return <div className="grid place-items-center px-5 py-10 text-center"><span className="grid size-12 place-items-center rounded-2xl bg-soft text-muted"><I size={22} /></span><p className="mt-3 font-semibold">{title}</p>{text && <p className="mt-1 max-w-xs text-sm muted">{text}</p>}{children}</div>
}
