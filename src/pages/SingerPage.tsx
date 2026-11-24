import { AtSign, Check, Clock, Languages, Lock, MapPin, Share2, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Photo } from '../components/Photo'
import { StoryViewer } from '../components/StoryViewer'
import { Stars, Verified } from '../components/ui'
import { ADVANCE_PCT, inr, minPrice } from '../data/catalog'
import type { Singer } from '../data/types'
import { usePublic } from '../lib/data'
import { repo } from '../lib/repo'
import { Link, paths } from '../lib/router'
import { crumbsLd, Seo } from '../lib/seo'
import { SITE_URL } from '../lib/site'

const personLd = (s: Singer, rv: { author: string; rating: number; text: string; date: string }[]) => ({
  '@context': 'https://schema.org', '@type': s.performerType === 'Solo singer' ? 'Person' : 'MusicGroup', name: s.stageName,
  url: `${SITE_URL}${paths.singer(s.slug)}`, image: s.avatar || s.cover, description: s.bio || s.tagline, jobTitle: s.performerType === 'Solo singer' ? 'Live singer' : undefined,
  genre: s.genres, address: { '@type': 'PostalAddress', addressLocality: s.city, addressRegion: 'Himachal Pradesh', addressCountry: 'IN' },
  sameAs: s.instagram ? [`https://instagram.com/${s.instagram}`] : undefined,
  makesOffer: s.packages.map((p) => ({ '@type': 'Offer', name: p.name, price: p.price, priceCurrency: 'INR', availability: 'https://schema.org/InStock' })),
  ...(s.reviewCount ? { aggregateRating: { '@type': 'AggregateRating', ratingValue: s.rating, reviewCount: s.reviewCount } } : {}),
  review: rv.slice(0, 3).map((r) => ({ '@type': 'Review', author: { '@type': 'Person', name: r.author }, reviewRating: { '@type': 'Rating', ratingValue: r.rating }, reviewBody: r.text, datePublished: r.date })),
})

export default function SingerPage({ s }: { s: Singer }) {
  const { reviews } = usePublic()
  const rv = reviews.filter((r) => r.singerId === s.id)
  const [story, setStory] = useState<number | null>(null)
  const [photo, setPhoto] = useState<number | null>(null)
  const [shared, setShared] = useState(false)
  useEffect(() => repo.trackView(s.id), [s.id])
  const from = minPrice(s.packages)
  const share = async () => {
    const url = `${SITE_URL}${paths.singer(s.slug)}`
    try { if (navigator.share) await navigator.share({ title: `${s.stageName} – live singer in Shimla`, url }); else { await navigator.clipboard.writeText(url); setShared(true); setTimeout(() => setShared(false), 2000) } } catch { /* cancelled */ }
  }
  const main = s.genres[0] ?? 'live'

  return (
    <div className="pb-20 md:pb-0">
      <Seo title={`${s.stageName} – ${main} ${s.performerType === 'Band' ? 'Band' : 'Singer'} in Shimla | Book Online`} description={`${s.stageName} is a verified ${s.genres.slice(0, 2).join(' & ')} ${s.performerType.toLowerCase()} in ${s.city}. ${s.tagline}. Packages from ${inr(from)}. Book online with LiveSinger Shimla.`} path={paths.singer(s.slug)} image={s.cover || s.avatar}
        jsonLd={[personLd(s, rv), crumbsLd([['Home', '/'], ['Singers', paths.singers], [s.stageName, paths.singer(s.slug)]])]} />

      <div className="wrap pt-4 sm:pt-6">
        <div className="relative overflow-hidden rounded-3xl bg-soft">
          <Photo src={s.cover || s.avatar} alt={`${s.stageName} performing live`} name={s.stageName} eager className="aspect-[16/10] w-full sm:aspect-[21/8]" />
          <button onClick={share} className="btn btn-outline btn-sm absolute right-3 top-3 !bg-white/95"><Share2 size={16} /> {shared ? 'Link copied' : 'Share'}</button>
        </div>
      </div>

      <div className="wrap grid gap-8 lg:grid-cols-[1fr_360px]">
        <div>
          <div className="-mt-12 flex items-end gap-4 px-2 sm:-mt-16">
            <button onClick={() => s.stories.length && setStory(0)} className={`${s.stories.length ? 'ring-story' : ''} shrink-0 rounded-full bg-white p-1`} aria-label={s.stories.length ? 'View stories' : s.stageName}>
              <Photo src={s.avatar} alt={s.stageName} name={s.stageName} className="size-24 rounded-full border-4 border-white sm:size-32" />
            </button>
          </div>
          <div className="mt-3 px-1">
            <h1 className="flex flex-wrap items-center gap-2 text-[clamp(26px,4vw,38px)] font-extrabold">{s.stageName} {s.verified && <Verified size={24} />}</h1>
            <p className="mt-1 text-[17px] muted">{s.tagline}</p>
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-sm muted">
              {s.reviewCount > 0 && <span className="flex items-center gap-1.5"><Stars value={s.rating} /> <b className="text-ink">{s.rating.toFixed(1)}</b> ({s.reviewCount} reviews)</span>}
              <span className="flex items-center gap-1"><MapPin size={14} /> {s.city}</span>
              <span className="flex items-center gap-1"><Languages size={14} /> {s.languages.join(', ')}</span>
              {s.experienceYears > 0 && <span className="flex items-center gap-1"><Clock size={14} /> {s.experienceYears} years</span>}
            </div>
          </div>

          {s.stories.length > 0 && (
            <div className="no-scrollbar mt-6 flex gap-4 overflow-x-auto px-1 pb-1">
              {s.stories.map((st, i) => (
                <button key={st.id} onClick={() => setStory(i)} className="flex w-[76px] shrink-0 flex-col items-center gap-1.5">
                  <span className="ring-story"><Photo src={st.url} alt="" name={st.caption ?? 'Story'} className="size-[68px] rounded-full border-[3px] border-white" /></span>
                  <span className="line-clamp-1 text-xs font-medium">{st.caption}</span>
                </button>
              ))}
            </div>
          )}

          <section className="mt-8"><h2 className="text-xl font-bold">About</h2>
            <p className="mt-2 text-[16px] leading-relaxed text-ink/85">{s.bio}</p>
            <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
              <div className="card p-4"><dt className="muted">Genres</dt><dd className="mt-1 font-semibold">{s.genres.join(', ')}</dd></div>
              <div className="card p-4"><dt className="muted">Best for</dt><dd className="mt-1 font-semibold">{s.eventTypes.join(', ')}</dd></div>
            </dl>
            {s.instagram && <a href={`https://instagram.com/${s.instagram}`} target="_blank" rel="noopener nofollow" className="btn btn-outline btn-sm mt-4"><AtSign size={16} /> Watch on Instagram</a>}
          </section>

          <section className="mt-10" id="packages"><h2 className="text-xl font-bold">Packages and prices</h2>
            <div className="mt-4 grid gap-3">
              {s.packages.map((p) => (
                <div key={p.id} className="card flex flex-col gap-3 p-5 sm:flex-row sm:items-center">
                  <div className="flex-1">
                    <h3 className="text-[17px] font-bold">{p.name} <span className="text-sm font-medium muted">· {p.durationHrs} hours</span></h3>
                    <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm muted">{p.includes.map((x) => <li key={x} className="flex items-center gap-1"><Check size={14} className="text-green" />{x}</li>)}</ul>
                  </div>
                  <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end">
                    <b className="text-[22px]">{inr(p.price)}</b>
                    <Link to={paths.book(s.slug, p.id)} className="btn btn-primary btn-sm">Select</Link>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {s.gallery.length > 0 && (
            <section className="mt-10"><h2 className="text-xl font-bold">Photos</h2>
              <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
                {s.gallery.map((g, i) => <button key={g.id} onClick={() => setPhoto(i)} className={`overflow-hidden rounded-2xl bg-soft ${i === 0 ? 'col-span-2 row-span-2' : ''}`}><Photo src={g.url} alt={g.caption ?? `${s.stageName} live`} name={g.caption ?? s.stageName} className="aspect-square size-full transition duration-300 hover:scale-[1.03]" /></button>)}
              </div>
            </section>
          )}

          <section className="mt-10"><h2 className="text-xl font-bold">Reviews</h2>
            {rv.length ? (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {rv.map((r) => <figure key={r.id} className="card p-5"><Stars value={r.rating} /><blockquote className="mt-2 text-[15px]">“{r.text}”</blockquote><figcaption className="mt-3 text-sm"><b>{r.author}</b> <span className="muted">· {r.org}</span></figcaption></figure>)}
              </div>
            ) : <p className="card mt-4 p-5 text-sm muted">No reviews yet. Reviews appear after completed bookings.</p>}
          </section>
        </div>

        <aside className="hidden lg:block">
          <div className="card sticky top-24 mt-6 p-5">
            <p className="text-sm muted">Packages from</p>
            <p className="text-[28px] font-extrabold">{inr(from)}</p>
            <Link to={paths.book(s.slug)} className="btn btn-primary mt-4 w-full">Check availability</Link>
            <ul className="mt-4 space-y-2 text-sm muted">
              <li className="flex gap-2"><Check size={16} className="mt-0.5 shrink-0 text-green" /> Pay only {ADVANCE_PCT}% to confirm</li>
              <li className="flex gap-2"><Check size={16} className="mt-0.5 shrink-0 text-green" /> No login needed</li>
              <li className="flex gap-2"><Lock size={16} className="mt-0.5 shrink-0 text-green" /> Booking and payment handled by LiveSinger Shimla</li>
            </ul>
          </div>
        </aside>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white px-4 py-3 lg:hidden" style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}>
        <div className="flex items-center gap-3">
          <div className="flex-1"><p className="text-xs muted">From</p><p className="text-lg font-extrabold leading-tight">{inr(from)}</p></div>
          <Link to={paths.book(s.slug)} className="btn btn-primary flex-1">Check availability</Link>
        </div>
      </div>

      {story !== null && <StoryViewer name={s.stageName} avatar={s.avatar} items={s.stories} start={story} onClose={() => setStory(null)} />}
      {photo !== null && (
        <div className="fixed inset-0 z-[60] grid place-items-center bg-black/90 p-3" onClick={() => setPhoto(null)} role="dialog">
          <button className="absolute right-3 top-3 grid size-11 place-items-center rounded-full bg-white/15 text-white" aria-label="Close"><X /></button>
          <Photo src={s.gallery[photo].url} alt={s.gallery[photo].caption ?? ''} name={s.gallery[photo].caption ?? s.stageName} className="sheet-in max-h-[85dvh] w-full max-w-3xl rounded-2xl" />
        </div>
      )}
    </div>
  )
}
