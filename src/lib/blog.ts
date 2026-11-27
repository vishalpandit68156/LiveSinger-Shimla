// Blog posts live as Markdown files in src/content/blog/<slug>.md (the file name is the URL slug).
// Each file starts with a small front-matter block:
//   ---
//   title: Page title (also the <title> and H1)
//   description: Meta description, 140-160 characters
//   date: 2026-11-26
//   keywords: live singer Shimla, singer live show
//   ---
// Add a file, run the build, and the post gets its own pre-rendered page, a card on /blog and a sitemap entry.
import { toHref } from './router'

export interface Post { slug: string; title: string; description: string; date: string; keywords: string[]; body: string; readMins: number }

const files = import.meta.glob('../content/blog/*.md', { query: '?raw', import: 'default', eager: true }) as Record<string, string>

function parse(file: string, raw: string): Post {
  const slug = file.split('/').pop()!.replace(/\.md$/, '')
  const m = raw.replace(/\r\n/g, '\n').match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/)
  const meta: Record<string, string> = {}
  for (const line of (m?.[1] ?? '').split('\n')) {
    const i = line.indexOf(':')
    if (i > 0) meta[line.slice(0, i).trim()] = line.slice(i + 1).trim()
  }
  const body = (m?.[2] ?? raw).trim()
  return {
    slug, body,
    title: meta.title || slug, description: meta.description || '', date: meta.date || '',
    keywords: (meta.keywords || '').split(',').map((k) => k.trim()).filter(Boolean),
    readMins: Math.max(1, Math.round(body.split(/\s+/).length / 200)),
  }
}

export const POSTS: Post[] = Object.entries(files).map(([f, raw]) => parse(f, raw)).sort((a, b) => b.date.localeCompare(a.date))

// Formatted by hand so the pre-rendered HTML and the browser always match (no locale differences).
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
export const formatDate = (d: string) => { const [y, m, day] = d.split('-').map(Number); return y && m && day ? `${day} ${MONTHS[m - 1]} ${y}` : d }

// Small Markdown renderer for our own posts: ## / ### headings, paragraphs, - and 1. lists, > quotes, **bold**, *italic*, [links](/path).
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
function inline(s: string) {
  return esc(s)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, text, url: string) =>
      url.startsWith('/') ? `<a href="${toHref(url)}" data-internal="${url}">${text}</a>` : `<a href="${url}" rel="noopener" target="_blank">${text}</a>`)
}

export function markdownToHtml(md: string) {
  const out: string[] = []
  // A heading line is always its own block, even without a blank line after it.
  const blocks = md.replace(/^(#{2,3}\s.*)$/gm, '\n$1\n').split(/\n\s*\n/)
  for (const block of blocks) {
    const lines = block.trim().split('\n')
    if (!lines[0]) continue
    const h = lines[0].match(/^(#{2,3})\s+(.*)$/)
    if (h && lines.length === 1) { out.push(`<h${h[1].length}>${inline(h[2])}</h${h[1].length}>`); continue }
    if (lines.every((l) => /^[-*]\s+/.test(l))) { out.push(`<ul>${lines.map((l) => `<li>${inline(l.replace(/^[-*]\s+/, ''))}</li>`).join('')}</ul>`); continue }
    if (lines.every((l) => /^\d+\.\s+/.test(l))) { out.push(`<ol>${lines.map((l) => `<li>${inline(l.replace(/^\d+\.\s+/, ''))}</li>`).join('')}</ol>`); continue }
    if (lines.every((l) => l.startsWith('>'))) { out.push(`<blockquote>${inline(lines.map((l) => l.replace(/^>\s?/, '')).join(' '))}</blockquote>`); continue }
    out.push(`<p>${inline(lines.join(' '))}</p>`)
  }
  return out.join('\n')
}
