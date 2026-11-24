import { Search, SlidersHorizontal, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { SingerCard } from '../components/SingerCard'
import { Chips } from '../components/ui'
import { EVENTS, FAQ, GENRES, LANDINGS, PERFORMER_TYPES, minPrice, type Landing } from '../data/catalog'
import type { EventType, Genre, PerformerType, Singer } from '../data/types'
import { usePublic } from '../lib/data'
import { Link, paths } from '../lib/router'
import { crumbsLd, faqLd, Seo } from '../lib/seo'
import { SITE_URL } from '../lib/site'

function SingerList({ initial }: { initial?: Landing['filter'] }) {
  const { singers, ready } = usePublic()
  const [q, setQ] = useState('')
  const [genres, setGenres] = useState<Genre[]>(initial?.genre ? [initial.genre] : [])
  const [event, setEvent] = useState<EventType | ''>(initial?.event ?? '')
  const [types, setTypes] = useState<PerformerType[]>([])
  const [sort, setSort] = useState<'top' | 'low' | 'high'>('top')
  const [open, setOpen] = useState(false)
  useEffect(() => { try { const v = sessionStorage.getItem('lss_q'); if (v) { setQ(v); sessionStorage.removeItem('lss_q') } } catch { /* ignore */ } }, [])

  const list = useMemo(() => {
    const t = q.trim().toLowerCase()
    const r = singers.filter((s) =>
      (!genres.length || genres.some((g) => s.genres.includes(g))) && (!event || s.eventTypes.includes(event)) && (!types.length || types.includes(s.performerType)) &&
      (!t || [s.stageName, s.tagline, ...s.genres, ...s.eventTypes, ...s.languages].join(' ').toLowerCase().includes(t)))
    const by: Record<string, (a: Singer, b: Singer) => number> = { top: (a, b) => b.rating * Math.log(b.reviewCount + 2) - a.rating * Math.log(a.reviewCount + 2), low: (a, b) => minPrice(a.packages) - minPrice(b.packages), high: (a, b) => minPrice(b.packages) - minPrice(a.packages) }
    return r.sort(by[sort])
  }, [singers, q, genres, event, types, sort])
  const active = genres.length + types.length + (event ? 1 : 0)

  return (
    <>
      <div className="sticky top-16 z-20 -mx-4 border-b border-line bg-white/95 px-4 py-3 backdrop-blur-lg sm:mx-0 sm:rounded-2xl sm:border sm:px-3">
        <div className="flex gap-2">
          <label className="relative flex-1"><span className="sr-only">Search</span>
            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, genre, language" className="field !min-h-12 !pl-10" type="search" />
          </label>
          <button onClick={() => setOpen(!open)} className="btn btn-outline relative !min-h-12 !px-3.5" aria-expanded={open}><SlidersHorizontal size={18} /><span className="hidden sm:inline">Filters</span>{active > 0 && <span className="absolute -right-1.5 -top-1.5 grid size-5 place-items-center rounded-full bg-green text-[11px] text-white">{active}</span>}</button>
        </div>
        {open && (
          <div className="sheet-in mt-3 grid gap-4 pb-1">
            <div><p className="label">Genre</p><div className="no-scrollbar -mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0"><Chips options={GENRES} value={genres} onChange={setGenres} /></div></div>
            <div className="grid gap-3 sm:grid-cols-3">
              <label><span className="label">Occasion</span><select className="field" value={event} onChange={(e) => setEvent(e.target.value as EventType)}><option value="">Any occasion</option>{EVENTS.map((x) => <option key={x}>{x}</option>)}</select></label>
              <div><span className="label">Act</span><Chips options={PERFORMER_TYPES} value={types} onChange={setTypes} /></div>
              <label><span className="label">Sort by</span><select className="field" value={sort} onChange={(e) => setSort(e.target.value as 'top')}><option value="top">Top rated</option><option value="low">Price: low to high</option><option value="high">Price: high to low</option></select></label>
            </div>
            {active > 0 && <button onClick={() => { setGenres([]); setEvent(''); setTypes([]) }} className="btn btn-ghost btn-sm justify-self-start"><X size={15} /> Clear filters</button>}
          </div>
        )}
      </div>
      <p className="mt-4 text-sm muted">{ready ? `${list.length} ${list.length === 1 ? 'singer' : 'singers'} available` : 'Loading singers…'}</p>
      <div className="mt-3 grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">{list.map((s, i) => <SingerCard key={s.id} s={s} i={i} />)}</div>
      {ready && !list.length && (
        <div className="card mt-4 p-8 text-center">
          <p className="font-semibold">No singers match these filters</p>
          <p className="mt-1 text-sm muted">Try removing a filter, or tell us what you need and we will find someone.</p>
        </div>
      )}
    </>
  )
}

const itemList = (singers: Singer[]) => ({ '@context': 'https://schema.org', '@type': 'ItemList', itemListElement: singers.slice(0, 20).map((s, i) => ({ '@type': 'ListItem', position: i + 1, url: `${SITE_URL}${paths.singer(s.slug)}`, name: s.stageName })) })

export default function Singers() {
  const { singers } = usePublic()
  return (
    <div className="wrap py-6 sm:py-10">
      <Seo title="Singers in Shimla | Compare Prices & Book Live Singers" description="Browse all verified live singers and bands in Shimla. Filter by genre, occasion and budget, then book online with a 30% advance." path={paths.singers} jsonLd={[itemList(singers), crumbsLd([['Home', '/'], ['Singers in Shimla', paths.singers]])]} />
      <h1 className="text-[clamp(26px,4vw,40px)] font-extrabold">Live singers in Shimla</h1>
      <p className="mt-2 max-w-2xl muted">All profiles are checked by our team. Prices are fixed and shown upfront.</p>
      <div className="mt-5"><SingerList /></div>
    </div>
  )
}

export function LandingPage({ l }: { l: Landing }) {
  const { singers } = usePublic()
  const match = singers.filter((s) => (!l.filter.genre || s.genres.includes(l.filter.genre)) && (!l.filter.event || s.eventTypes.includes(l.filter.event)))
  return (
    <div className="wrap py-6 sm:py-10">
      <Seo title={`${l.title} – LiveSinger Shimla`} description={l.description} path={paths.landing(l.slug)} jsonLd={[itemList(match), faqLd(FAQ.slice(0, 3)), crumbsLd([['Home', '/'], ['Singers', paths.singers], [l.h1, paths.landing(l.slug)]])]} />
      <nav className="text-sm muted" aria-label="Breadcrumb"><Link to="/" className="hover:text-ink">Home</Link> / <Link to={paths.singers} className="hover:text-ink">Singers</Link> / <span className="text-ink">{l.h1}</span></nav>
      <h1 className="mt-3 text-[clamp(26px,4vw,40px)] font-extrabold">{l.h1}</h1>
      <p className="mt-2 max-w-3xl text-[16px] muted">{l.intro}</p>
      <div className="mt-5"><SingerList key={l.slug} initial={l.filter} /></div>
      <section className="mt-12 grid gap-8 md:grid-cols-2">
        <div>
          <h2 className="text-xl font-bold">Booking {l.h1.toLowerCase().replace(' in shimla', '')} in Shimla</h2>
          <div className="mt-3 space-y-3 text-[15px] muted">
            {FAQ.slice(0, 3).map((f) => <p key={f.q}><b className="text-ink">{f.q}</b><br />{f.a}</p>)}
          </div>
        </div>
        <div>
          <h2 className="text-xl font-bold">Related searches</h2>
          <ul className="mt-3 flex flex-wrap gap-2">{LANDINGS.filter((x) => x.slug !== l.slug).map((x) => <li key={x.slug}><Link to={paths.landing(x.slug)} className="chip">{x.h1}</Link></li>)}</ul>
        </div>
      </section>
    </div>
  )
}
