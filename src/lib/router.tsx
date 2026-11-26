import { createContext, useContext, useEffect, useState, type AnchorHTMLAttributes, type ReactNode } from 'react'

// Real URLs in production (good for SEO). The offline preview can only use #names, so VITE_HASH=1 maps
// "/singer/aarav-rana" <-> "#singer--aarav-rana".
const HASH = import.meta.env.VITE_HASH === '1'

export function toHref(path: string) {
  if (!HASH) return path
  return path === '/' ? '#home' : '#' + path.replace(/^\//, '').replace(/\//g, '--')
}
function readPath() {
  if (typeof window === 'undefined') return '/'
  if (!HASH) return location.pathname.replace(/\/+$/, '') || '/'
  const h = location.hash.slice(1)
  return !h || h === 'home' ? '/' : '/' + h.split('--').join('/')
}
export function navigate(path: string, replace = false) {
  if (HASH) { if (replace) location.replace(toHref(path)); else location.hash = toHref(path).slice(1); return }
  history[replace ? 'replaceState' : 'pushState'](null, '', path)
  dispatchEvent(new Event('lss:navigate'))
}

const Ctx = createContext('/')
export const usePath = () => useContext(Ctx)

export function RouterProvider({ initial, children }: { initial?: string; children: ReactNode }) {
  const [path, setPath] = useState(initial ?? readPath())
  useEffect(() => {
    const on = () => { setPath(readPath()); window.scrollTo(0, 0) }
    addEventListener('popstate', on); addEventListener('hashchange', on); addEventListener('lss:navigate', on)
    return () => { removeEventListener('popstate', on); removeEventListener('hashchange', on); removeEventListener('lss:navigate', on) }
  }, [])
  return <Ctx.Provider value={path}>{children}</Ctx.Provider>
}

export function Link({ to, children, ...rest }: { to: string } & AnchorHTMLAttributes<HTMLAnchorElement>) {
  return (
    <a href={toHref(to)} {...rest} onClick={(e) => {
      rest.onClick?.(e)
      if (HASH || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return
      e.preventDefault(); navigate(to)
    }}>{children}</a>
  )
}

export type Route =
  | { name: 'home' } | { name: 'singers' } | { name: 'landing'; slug: string } | { name: 'singer'; slug: string }
  | { name: 'book'; slug: string; pkg?: string } | { name: 'login' } | { name: 'join' }
  | { name: 'dashboard'; tab: string } | { name: 'dash-edit'; section: string }
  | { name: 'admin' } | { name: 'admin-singers' } | { name: 'admin-singer'; id: string } | { name: 'admin-bookings' } | { name: 'admin-feedback' }
  | { name: 'how' } | { name: 'blog' } | { name: 'post'; slug: string } | { name: 'notfound' }

export function match(path: string): Route {
  const p = path.split('/').filter(Boolean)
  const [a, b, c] = p
  if (!a) return { name: 'home' }
  if (a === 'singers' && !b) return { name: 'singers' }
  if (a === 'shimla' && b) return { name: 'landing', slug: b }
  if (a === 'singer' && b) return { name: 'singer', slug: b }
  if (a === 'book' && b) return { name: 'book', slug: b, pkg: c }
  if (a === 'login') return { name: 'login' }
  if (a === 'join') return { name: 'join' }
  if (a === 'how-it-works') return { name: 'how' }
  if (a === 'blog') return b ? { name: 'post', slug: b } : { name: 'blog' }
  if (a === 'dashboard') return b === 'edit' && c ? { name: 'dash-edit', section: c } : { name: 'dashboard', tab: b ?? 'home' }
  if (a === 'admin') {
    if (b === 'singers') return { name: 'admin-singers' }
    if (b === 'singer' && c) return { name: 'admin-singer', id: c }
    if (b === 'bookings') return { name: 'admin-bookings' }
    if (b === 'feedback') return { name: 'admin-feedback' }
    return { name: 'admin' }
  }
  return { name: 'notfound' }
}

export const paths = {
  home: '/', singers: '/singers', login: '/login', join: '/join', how: '/how-it-works', blog: '/blog', post: (slug: string) => `/blog/${slug}`, dashboard: '/dashboard', admin: '/admin',
  singer: (slug: string) => `/singer/${slug}`, book: (slug: string, pkg?: string) => `/book/${slug}${pkg ? '/' + pkg : ''}`,
  landing: (slug: string) => `/shimla/${slug}`, edit: (section: string) => `/dashboard/edit/${section}`,
  adminSinger: (id: string) => `/admin/singer/${id}`,
}
