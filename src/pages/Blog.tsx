import { ArrowRight, Calendar, Clock } from 'lucide-react'
import type { MouseEvent } from 'react'
import { formatDate, markdownToHtml, POSTS, type Post } from '../lib/blog'
import { Link, navigate, paths } from '../lib/router'
import { crumbsLd, orgLd, Seo } from '../lib/seo'
import { SITE_NAME, SITE_URL } from '../lib/site'
import { NotFound } from './Static'

export function BlogIndex() {
  const ld = { '@context': 'https://schema.org', '@type': 'Blog', name: `${SITE_NAME} Blog`, url: SITE_URL + paths.blog, blogPost: POSTS.map((p) => ({ '@type': 'BlogPosting', headline: p.title, url: SITE_URL + paths.post(p.slug), datePublished: p.date })) }
  return (
    <div className="wrap max-w-4xl py-8 sm:py-12">
      <Seo title="Live Singer Shimla Blog | Tips for Hotels, Weddings & Singers" description="Guides on booking a live singer in Shimla for hotels, weddings and events, live show prices, and how singers in Shimla can get more live show bookings." path={paths.blog} jsonLd={[ld, crumbsLd([['Home', '/'], ['Blog', paths.blog]])]} />
      <nav className="text-sm muted" aria-label="Breadcrumb"><Link to="/" className="hover:text-ink">Home</Link> / <span className="text-ink">Blog</span></nav>
      <h1 className="mt-3 text-[clamp(28px,4vw,40px)] font-extrabold">Live music in Shimla: guides and tips</h1>
      <p className="mt-2 max-w-2xl text-[17px] muted">For hotels, resorts and families planning a live show in Shimla, and for singers who want more bookings.</p>
      <div className="mt-8 grid gap-4">{POSTS.map((p) => <PostCard key={p.slug} p={p} />)}</div>
    </div>
  )
}

function PostCard({ p }: { p: Post }) {
  return (
    <Link to={paths.post(p.slug)} className="card card-hover block p-5 sm:p-6">
      <Meta p={p} />
      <h2 className="mt-2 text-[clamp(19px,2.4vw,23px)] font-bold">{p.title}</h2>
      <p className="mt-2 muted">{p.description}</p>
      <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-green-dark">Read article <ArrowRight size={15} /></span>
    </Link>
  )
}

const Meta = ({ p }: { p: Post }) => (
  <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] muted">
    <span className="inline-flex items-center gap-1.5"><Calendar size={14} /> <time dateTime={p.date}>{formatDate(p.date)}</time></span>
    <span className="inline-flex items-center gap-1.5"><Clock size={14} /> {p.readMins} min read</span>
  </p>
)

// Internal links inside the article HTML use the app router instead of a full page load.
function onArticleClick(e: MouseEvent<HTMLElement>) {
  const a = (e.target as HTMLElement).closest('a[data-internal]')
  if (!a || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0 || import.meta.env.VITE_HASH === '1') return
  e.preventDefault(); navigate(a.getAttribute('data-internal')!)
}

export function BlogPost({ slug }: { slug: string }) {
  const p = POSTS.find((x) => x.slug === slug)
  if (!p) return <NotFound />
  const url = SITE_URL + paths.post(p.slug)
  const ld = {
    '@context': 'https://schema.org', '@type': 'BlogPosting', headline: p.title, description: p.description, datePublished: p.date, dateModified: p.date,
    mainEntityOfPage: url, url, keywords: p.keywords.join(', '), inLanguage: 'en-IN',
    author: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL }, publisher: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
  }
  const more = POSTS.filter((x) => x.slug !== p.slug).slice(0, 3)
  return (
    <article className="wrap max-w-3xl py-8 sm:py-12">
      <Seo title={p.title.length > 50 ? p.title : `${p.title} – ${SITE_NAME}`} description={p.description} path={paths.post(p.slug)} type="article" keywords={p.keywords} jsonLd={[ld, orgLd(), crumbsLd([['Home', '/'], ['Blog', paths.blog], [p.title, paths.post(p.slug)]])]} />
      <nav className="text-sm muted" aria-label="Breadcrumb"><Link to="/" className="hover:text-ink">Home</Link> / <Link to={paths.blog} className="hover:text-ink">Blog</Link></nav>
      <h1 className="mt-3 text-[clamp(28px,4.4vw,42px)] font-extrabold">{p.title}</h1>
      <div className="mt-3"><Meta p={p} /></div>
      <div className="prose-blog mt-8" onClick={onArticleClick} dangerouslySetInnerHTML={{ __html: markdownToHtml(p.body) }} />
      <aside className="card mt-10 grid gap-4 bg-mint p-6 sm:grid-cols-2">
        <div>
          <b className="block text-[17px]">Need a live singer in Shimla?</b>
          <p className="mt-1 text-sm muted">Verified singers, fixed prices, book with a 30% advance.</p>
          <Link to={paths.singers} className="btn btn-primary btn-sm mt-3">Find a singer</Link>
        </div>
        <div>
          <b className="block text-[17px]">Are you a singer?</b>
          <p className="mt-1 text-sm muted">Create your free profile and get booked by Shimla hotels and families.</p>
          <Link to={paths.join} className="btn btn-outline btn-sm mt-3">Join as a singer</Link>
        </div>
      </aside>
      {more.length > 0 && (
        <section className="mt-12">
          <h2 className="text-xl font-bold">More from the blog</h2>
          <div className="mt-4 grid gap-4">{more.map((x) => <PostCard key={x.slug} p={x} />)}</div>
        </section>
      )}
    </article>
  )
}
