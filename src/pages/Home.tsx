import { ArrowRight, Briefcase, CalendarCheck, Clapperboard, Gem, Hotel, LayoutGrid, Mic, Mic2, Moon, Mountain, Music2, Search, ShieldCheck, Wallet, type LucideIcon } from 'lucide-react'
import { useState } from 'react'
import { SingerCard } from '../components/SingerCard'
import { Section, Stars, TextLink } from '../components/ui'
import { FAQ, LANDINGS } from '../data/catalog'
import { usePublic } from '../lib/data'
import { Link, navigate, paths } from '../lib/router'
import { faqLd, orgLd, Seo } from '../lib/seo'
import { SITE_URL } from '../lib/site'

export default function Home() {
  const { singers, reviews } = usePublic()
  const [q, setQ] = useState('')
  const top = [...singers].sort((a, b) => b.rating * b.reviewCount - a.rating * a.reviewCount)
  const recent = reviews.slice(0, 6).map((r) => ({ r, s: singers.find((x) => x.id === r.singerId) })).filter((x) => x.s)

  return (
    <>
      <Seo title="Live Singer in Shimla | Book Top Singers & Bands Online – LiveSinger Shimla" description="Book the best live singers in Shimla for hotels, weddings, parties and live shows. Verified Bollywood, Sufi and Pahari singers with fixed prices. Pay a 30% advance and we handle the rest." path="/"
        jsonLd={[orgLd(), faqLd(FAQ), { '@context': 'https://schema.org', '@type': 'WebSite', name: 'LiveSinger Shimla', url: SITE_URL, potentialAction: { '@type': 'SearchAction', target: `${SITE_URL}/singers?q={query}`, 'query-input': 'required name=query' } }]} />

      <section className="relative overflow-hidden border-b border-line bg-gradient-to-b from-mint/70 via-white to-white">
        <div className="wrap relative flex min-h-[460px] flex-col items-center justify-center py-12 text-center sm:h-[500px] sm:min-h-0">
          <span className="fade-up badge badge-green">Shimla · Kufri · Mashobra · Chail</span>
          <h1 className="fade-up mt-4 max-w-3xl text-[clamp(32px,5.6vw,56px)] font-extrabold leading-[1.08]">Book live singers in Shimla</h1>
          <p className="fade-up mt-3 max-w-xl text-[17px] muted">Verified singers and bands for hotels, weddings and parties. Real prices, real reviews.</p>
          <form className="fade-up mt-7 flex w-full max-w-2xl items-center gap-2 rounded-full border border-line bg-white p-1.5 pl-1.5 shadow-[0_10px_30px_-12px_rgba(22,163,74,.35)] focus-within:border-green/60" onSubmit={(e) => { e.preventDefault(); try { sessionStorage.setItem('lss_q', q) } catch { /* ignore */ } navigate(paths.singers) }} role="search">
            <span className="grid size-11 shrink-0 place-items-center rounded-full bg-mint text-green-dark"><Mic size={20} /></span>
            <label className="flex-1"><span className="sr-only">Search singers</span>
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Sufi night, wedding band, Bollywood…" className="min-h-11 w-full bg-transparent text-[16px] outline-none" />
            </label>
            <button className="btn btn-primary !rounded-full"><Search size={17} /><span className="hidden sm:inline">Find singers</span></button>
          </form>
          <div className="fade-up mt-4 flex flex-wrap justify-center gap-2">
            {LANDINGS.slice(1, 6).map((l) => { const I = OCCASION_ICON[l.slug] || Music2; return (
              <Link key={l.slug} to={paths.landing(l.slug)} className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white/80 px-3 py-1.5 text-[13px] font-medium text-ink/80 hover:border-green/50 hover:text-green-dark"><I size={14} className="text-green" />{l.h1.replace(' in Shimla', '').replace(' Singers', '')}</Link>
            ) })}
          </div>
          <ul className="fade-up mt-6 flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm font-medium text-ink/75">
            {[[ShieldCheck, 'Verified singers'], [Wallet, 'Fixed prices'], [CalendarCheck, '30% advance to book']].map(([I, t]) => (
              <li key={t as string} className="flex items-center gap-1.5"><I size={16} className="text-green" />{t as string}</li>
            ))}
          </ul>
        </div>
      </section>

      <Section title="Find a singer by occasion" sub="Popular searches in Shimla">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {LANDINGS.slice(1).concat(LANDINGS[0]).map((l) => { const I = OCCASION_ICON[l.slug] || Music2; return (
            <Link key={l.slug} to={paths.landing(l.slug)} className="card card-hover group flex flex-col gap-3 p-4 sm:p-5">
              <span className="grid size-12 place-items-center rounded-2xl bg-mint text-green-dark transition group-hover:bg-green group-hover:text-white"><I size={23} strokeWidth={1.9} /></span>
              <span className="flex items-end justify-between gap-2"><span className="text-[15px] font-semibold leading-snug">{l.h1.replace(' in Shimla', '')}</span><ArrowRight size={17} className="mb-0.5 shrink-0 text-green transition group-hover:translate-x-0.5" /></span>
            </Link>
          ) })}
          <Link to={paths.singers} className="card card-hover group flex flex-col gap-3 border-dashed p-4 sm:p-5">
            <span className="grid size-12 place-items-center rounded-2xl bg-soft text-ink/70 transition group-hover:bg-ink group-hover:text-white"><LayoutGrid size={23} strokeWidth={1.9} /></span>
            <span className="flex items-end justify-between gap-2"><span className="text-[15px] font-semibold leading-snug">Browse all singers</span><ArrowRight size={17} className="mb-0.5 shrink-0 text-green" /></span>
          </Link>
        </div>
      </Section>

      <Section title="Top singers in Shimla" sub="Highly rated by hotels and families" action={<TextLink to={paths.singers}>See all</TextLink>} className="!pt-0">
        <div className="grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4">{top.slice(0, 8).map((s, i) => <SingerCard key={s.id} s={s} i={i} />)}</div>
      </Section>

      <section className="bg-soft py-12 sm:py-16">
        <div className="wrap">
          <h2 className="text-[clamp(22px,3.2vw,32px)] font-bold">How booking works</h2>
          <ol className="mt-6 grid gap-4 md:grid-cols-3">
            {[
              ['Choose a singer', 'Compare profiles, photos, prices and reviews. No login needed.'],
              ['Send your request', 'Pick a package and date. We confirm availability, usually within a few hours.'],
              ['Pay 30% and enjoy', 'Pay a small advance to lock the date. The rest is paid after the show.'],
            ].map(([t, d], i) => (
              <li key={t} className="card p-5">
                <span className="grid size-9 place-items-center rounded-full bg-mint text-sm font-bold text-green-dark">{i + 1}</span>
                <h3 className="mt-3 text-[17px] font-bold">{t}</h3>
                <p className="mt-1 text-[15px] muted">{d}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {recent.length > 0 && (
        <Section title="What clients say">
          <div className="no-scrollbar -mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
            {recent.map(({ r, s }) => (
              <figure key={r.id} className="card w-[300px] shrink-0 snap-start p-5">
                <Stars value={r.rating} />
                <blockquote className="mt-3 text-[15px]">“{r.text}”</blockquote>
                <figcaption className="mt-4 text-sm"><b>{r.author}</b><span className="block muted">{r.org} · booked <Link to={paths.singer(s!.slug)} className="font-semibold text-green-dark">{s!.stageName}</Link></span></figcaption>
              </figure>
            ))}
          </div>
        </Section>
      )}

      <Section title="Questions about booking a singer in Shimla" className="!pt-0">
        <div className="grid gap-3 md:grid-cols-2">
          {FAQ.map((f) => (
            <details key={f.q} className="card group p-5 [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex cursor-pointer list-none items-start justify-between gap-4 text-[16px] font-semibold">{f.q}<span className="text-green transition group-open:rotate-45">+</span></summary>
              <p className="mt-3 text-[15px] muted">{f.a}</p>
            </details>
          ))}
        </div>
      </Section>

      <section className="wrap pb-14">
        <div className="card flex flex-col items-start justify-between gap-5 bg-ink p-6 text-white sm:flex-row sm:items-center sm:p-10">
          <div>
            <h2 className="text-[clamp(22px,3vw,30px)] font-bold">Are you a singer in Shimla?</h2>
            <p className="mt-2 max-w-lg text-white/75">Create your free profile in 2 minutes. Get bookings from hotels and families, with payments handled for you.</p>
          </div>
          <Link to={paths.join} className="btn btn-primary">Create singer profile</Link>
        </div>
      </section>
    </>
  )
}

const OCCASION_ICON: Record<string, LucideIcon> = {
  'live-singers': Mic2,
  'wedding-singers': Gem,
  'hotel-live-music': Hotel,
  'sufi-singers': Moon,
  'bollywood-singers': Clapperboard,
  'pahari-folk-singers': Mountain,
  'corporate-event-singers': Briefcase,
}
