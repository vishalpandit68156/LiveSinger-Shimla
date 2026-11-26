import { createContext, useContext, useEffect } from 'react'
import { KEYWORDS, SITE_NAME, SITE_URL } from './site'

export type SeoData = { title: string; description: string; path: string; image?: string; jsonLd?: object[]; noindex?: boolean; type?: 'website' | 'article'; keywords?: string[] }
// During prerender the page writes its tags here; in the browser we update <head> directly.
export const SeoCollector = createContext<{ data?: SeoData } | null>(null)

export function Seo(d: SeoData) {
  const collector = useContext(SeoCollector)
  if (collector) collector.data = d
  useEffect(() => {
    document.title = d.title
    const set = (sel: string, attr: string, key: string, val: string) => {
      let el = document.head.querySelector<HTMLElement>(sel)
      if (!el) { el = document.createElement(sel.startsWith('link') ? 'link' : 'meta'); el.setAttribute(attr, key); document.head.appendChild(el) }
      el.setAttribute(sel.startsWith('link') ? 'href' : 'content', val)
    }
    set('meta[name="description"]', 'name', 'description', d.description)
    set('meta[property="og:title"]', 'property', 'og:title', d.title)
    set('meta[property="og:description"]', 'property', 'og:description', d.description)
    set('meta[name="robots"]', 'name', 'robots', d.noindex ? 'noindex' : 'index,follow')
    set('link[rel="canonical"]', 'rel', 'canonical', SITE_URL + d.path)
  }, [d.title, d.description, d.path, d.noindex])
  return null
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')
export function headHtml(d: SeoData) {
  const url = SITE_URL + d.path
  const img = d.image || `${SITE_URL}/og-image.png`
  return [
    `<title>${esc(d.title)}</title>`,
    `<meta name="description" content="${esc(d.description)}">`,
    `<meta name="keywords" content="${esc((d.keywords?.length ? d.keywords : KEYWORDS).join(', '))}">`,
    `<meta name="robots" content="${d.noindex ? 'noindex' : 'index,follow'}">`,
    `<link rel="canonical" href="${url}">`,
    `<meta property="og:type" content="${d.type ?? 'website'}"><meta property="og:site_name" content="${SITE_NAME}">`,
    `<meta property="og:title" content="${esc(d.title)}"><meta property="og:description" content="${esc(d.description)}">`,
    `<meta property="og:url" content="${url}"><meta property="og:image" content="${esc(img)}"><meta property="og:locale" content="en_IN">`,
    `<meta name="twitter:card" content="summary_large_image">`,
    `<meta name="geo.region" content="IN-HP"><meta name="geo.placename" content="Shimla">`,
    ...(d.jsonLd ?? []).map((j) => `<script type="application/ld+json">${JSON.stringify(j).replace(/</g, '\\u003c')}</script>`),
  ].join('\n    ')
}

export const orgLd = () => ({
  '@context': 'https://schema.org', '@type': 'EntertainmentBusiness', name: SITE_NAME, url: SITE_URL,
  description: 'Book verified live singers and bands in Shimla for hotels, weddings and events.',
  areaServed: ['Shimla', 'Kufri', 'Mashobra', 'Chail', 'Naldehra', 'Narkanda'],
  address: { '@type': 'PostalAddress', addressLocality: 'Shimla', addressRegion: 'Himachal Pradesh', addressCountry: 'IN' },
})
export const faqLd = (faq: { q: string; a: string }[]) => ({
  '@context': 'https://schema.org', '@type': 'FAQPage',
  mainEntity: faq.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
})
export const crumbsLd = (items: [string, string][]) => ({
  '@context': 'https://schema.org', '@type': 'BreadcrumbList',
  itemListElement: items.map(([name, path], i) => ({ '@type': 'ListItem', position: i + 1, name, item: SITE_URL + path })),
})
