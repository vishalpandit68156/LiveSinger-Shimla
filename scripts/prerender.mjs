// Pre-renders every public page to static HTML (fast first paint + full SEO), and writes sitemap.xml + robots.txt.
// Run after: vite build && vite build --ssr src/entry-server.tsx --outDir dist-ssr
import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

const dist = path.resolve('dist')
const { render, routes, seedData } = await import(pathToFileURL(path.resolve('dist-ssr/entry-server.js')).href)
const SITE = (process.env.VITE_SITE_URL || 'https://livesingershimla.com').replace(/\/$/, '')

async function loadData() {
  const url = process.env.VITE_SUPABASE_URL, key = process.env.VITE_SUPABASE_ANON_KEY
  if (!url || !key) return seedData()
  const { createClient } = await import('@supabase/supabase-js')
  const sb = createClient(url, key)
  const { data: rows, error } = await sb.from('singers').select('*, packages(*), media(*)').eq('status', 'approved')
  if (error) throw error
  const { toSinger } = await import(pathToFileURL(path.resolve('dist-ssr/entry-server.js')).href)
  const { data: rv } = await sb.from('reviews').select('*').eq('approved', true)
  return { singers: rows.map(toSinger), reviews: (rv ?? []).map((r) => ({ id: r.id, singerId: r.singer_id, author: r.author, org: r.org, rating: r.rating, text: r.text, date: r.created_at })) }
}

const data = await loadData()
const template = fs.readFileSync(path.join(dist, 'index.html'), 'utf8')
const dataTag = `<script>window.__LSS_DATA__=${JSON.stringify(data).replace(/</g, '\\u003c')}</script>`

// SPA shell for private pages (dashboard, admin, booking): no content, noindex
fs.writeFileSync(path.join(dist, '200.html'), template.replace('<!--seo-->', '<title>LiveSinger Shimla</title><meta name="robots" content="noindex">').replace('<!--app-->', '').replace('<!--data-->', dataTag))

const list = routes(data)
for (const r of list) {
  const { html, head } = render(r, data)
  const out = template.replace('<!--seo-->', head).replace('<!--app-->', html).replace('<!--data-->', dataTag)
  const file = r === '/' ? path.join(dist, 'index.html') : path.join(dist, r, 'index.html')
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(file, out)
}
const indexable = list.filter((r) => !['/login'].includes(r))
const today = new Date().toISOString().slice(0, 10)
fs.writeFileSync(path.join(dist, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${indexable.map((r) => `  <url><loc>${SITE}${r === '/' ? '/' : r}</loc><lastmod>${today}</lastmod><priority>${r === '/' ? '1.0' : r.startsWith('/shimla') ? '0.9' : '0.7'}</priority></url>`).join('\n')}\n</urlset>\n`)
fs.writeFileSync(path.join(dist, 'robots.txt'), `User-agent: *\nAllow: /\nDisallow: /dashboard\nDisallow: /admin\nDisallow: /book/\nDisallow: /login\n\nSitemap: ${SITE}/sitemap.xml\n`)
console.log(`prerendered ${list.length} pages`)
