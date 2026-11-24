import { renderToString } from 'react-dom/server'
import { LANDINGS } from './data/catalog'
import type { PublicData } from './lib/data'
import { headHtml, SeoCollector, type SeoData } from './lib/seo'
import Root from './Root'

export function render(path: string, data: PublicData) {
  const collector: { data?: SeoData } = {}
  const html = renderToString(<SeoCollector.Provider value={collector}><Root path={path} data={data} /></SeoCollector.Provider>)
  return { html, head: collector.data ? headHtml(collector.data) : '' }
}

export function routes(data: PublicData) {
  return ['/', '/singers', '/how-it-works', '/join', '/login', ...LANDINGS.map((l) => `/shimla/${l.slug}`), ...data.singers.map((s) => `/singer/${s.slug}`)]
}
export { seedData } from './lib/data'
export { toSinger } from './lib/repo/supabase'
