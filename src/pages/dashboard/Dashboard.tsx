import qrcode from 'qrcode-generator'
import { AlertCircle, CalendarCheck, CalendarDays, CheckCircle2, ChevronRight, Circle, Clock, Copy, Download, Eye, Home, IndianRupee, Lightbulb, LifeBuoy, Mail, MapPin, MessageCircle, PartyPopper, Send, Share2, Star, UserRound, Users } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { DashShell, Empty, Panel, Stat, type NavItem } from '../../components/DashShell'
import { LoginForm } from '../../components/LoginForm'
import { Photo } from '../../components/Photo'
import { Progress, StatusBadge, Verified } from '../../components/ui'
import { inr, minPrice } from '../../data/catalog'
import type { Singer, SingerBooking, SingerPrivate } from '../../data/types'
import { completion } from '../../lib/completion'
import { repo } from '../../lib/repo'
import { Link, navigate, paths } from '../../lib/router'
import { Seo } from '../../lib/seo'
import { SITE_EMAIL, SITE_URL } from '../../lib/site'
import { useMine } from './useMine'

export function NeedLogin({ next }: { next: string }) {
  useEffect(() => { try { sessionStorage.setItem('lss_next', next) } catch { /* ignore */ } }, [next])
  return (
    <div className="grid min-h-dvh place-items-center bg-soft px-4 py-10">
      <div className="card w-full max-w-md p-6 sm:p-8"><h1 className="text-2xl font-bold">Log in to continue</h1><p className="mt-1 muted">Use the email you registered with.</p><div className="mt-6"><LoginForm /></div></div>
    </div>
  )
}

const TABS: Record<string, string> = { home: 'Home', profile: 'My profile', bookings: 'My gigs', share: 'Share', help: 'Help' }
const fmtDay = (d: string) => new Date(d + 'T00:00:00')
const today = () => new Date().toISOString().slice(0, 10)

export default function Dashboard({ tab }: { tab: string }) {
  const { loading, singer: s, priv, email } = useMine()
  const [gigs, setGigs] = useState<SingerBooking[] | null>(null)
  useEffect(() => { if (!loading && email && !s) navigate(paths.join, true) }, [loading, email, s])
  useEffect(() => { if (s) repo.myBookings().then(setGigs).catch(() => setGigs([])) }, [s])

  if (!loading && !email) return <NeedLogin next={paths.dashboard} />
  if (loading || !s || !priv) return <p className="py-24 text-center muted">Loading your dashboard…</p>

  const upcoming = (gigs ?? []).filter((g) => g.status === 'confirmed' && g.eventDate >= today()).sort((a, b) => a.eventDate.localeCompare(b.eventDate))
  const nav: NavItem[] = [
    { to: paths.dashboard, label: 'Home', icon: Home, exact: true },
    { to: '/dashboard/profile', label: 'Profile', icon: UserRound },
    { to: '/dashboard/bookings', label: 'Gigs', icon: CalendarDays, badge: upcoming.length || undefined },
    { to: '/dashboard/share', label: 'Share', icon: Share2 },
    { to: '/dashboard/help', label: 'Help', icon: LifeBuoy },
  ]
  const body = tab === 'profile' ? <ProfileTab s={s} p={priv} /> : tab === 'bookings' ? <GigsTab gigs={gigs} /> : tab === 'share' ? <ShareTab s={s} /> : tab === 'help' ? <HelpTab /> : <HomeTab s={s} p={priv} gigs={gigs} upcoming={upcoming} />

  return (
    <DashShell nav={nav} title={tab === 'home' ? `Hi, ${s.stageName.split(' ')[0]}` : TABS[tab] ?? 'Dashboard'} user={{ name: s.stageName, sub: priv.email, avatar: s.avatar }}
      action={<span className="hidden sm:inline-flex"><StatusBadge s={s.status} /></span>}>
      <Seo title="Singer dashboard – LiveSinger Shimla" description="Manage your singer profile" path={paths.dashboard} noindex />
      <div className="sheet-in" key={tab}>{body}</div>
    </DashShell>
  )
}

/* ───────── Home ───────── */
function StatusCard({ s }: { s: Singer }) {
  if (s.status === 'approved') return (
    <div className="card flex flex-wrap items-center gap-4 border-green/25 bg-mint/60 p-5">
      <CheckCircle2 size={28} className="shrink-0 text-green" />
      <div className="min-w-[200px] flex-1"><b className="text-[17px]">Your page is live</b><p className="text-sm text-ink/70">Clients can find and book you. Keep your photos and stories fresh.</p></div>
      <Link to={paths.singer(s.slug)} className="btn btn-outline btn-sm">View my page</Link>
    </div>
  )
  if (s.status === 'rejected' || s.status === 'suspended') return (
    <div className="card border-red-200 bg-red-50/60 p-5">
      <div className="flex gap-3"><AlertCircle size={26} className="shrink-0 text-red-600" /><div><b className="text-[17px]">{s.status === 'rejected' ? 'A few changes needed' : 'Profile paused'}</b>{s.adminNote && <p className="mt-1 text-[15px]">“{s.adminNote}”</p>}<p className="mt-1 text-sm muted">{s.status === 'rejected' ? 'Update your profile and it goes back to our team for review automatically.' : `Contact ${SITE_EMAIL}.`}</p></div></div>
    </div>
  )
  const steps = [['Registered', 'done'], ['Team review', 'now'], ['Live + contract', 'next']] as const
  return (
    <div className="card p-5">
      <div className="flex items-start gap-3"><Clock size={24} className="mt-0.5 shrink-0 text-amber-500" /><div><b className="text-[17px]">Your profile is under review</b><p className="text-sm muted">Usually within 24 hours. You'll get an email when you're approved, then your artist contract the next day.</p></div></div>
      <ol className="mt-4 grid grid-cols-3 gap-2">
        {steps.map(([t, st], i) => (
          <li key={t} className="flex flex-col gap-2">
            <span className={`h-1.5 rounded-full ${st === 'done' ? 'bg-green' : st === 'now' ? 'bg-amber-400' : 'bg-line'}`} />
            <span className={`text-xs font-semibold sm:text-sm ${st === 'next' ? 'muted' : ''}`}>{i + 1}. {t}</span>
          </li>
        ))}
      </ol>
    </div>
  )
}

function HomeTab({ s, p, gigs, upcoming }: { s: Singer; p: SingerPrivate; gigs: SingerBooking[] | null; upcoming: SingerBooking[] }) {
  const [welcome, setWelcome] = useState(false)
  useEffect(() => { try { if (sessionStorage.getItem('lss_welcome')) { setWelcome(true); sessionStorage.removeItem('lss_welcome') } } catch { /* ignore */ } }, [])
  const { pct, sections } = completion(s, p)
  const next = sections.find((x) => !x.done)
  const done = (gigs ?? []).filter((g) => g.status === 'completed')
  const earned = done.reduce((a, g) => a + g.payout, 0)
  return (
    <div className="grid gap-4">
      {welcome && <div className="card flex gap-3 border-green/30 bg-mint p-4"><PartyPopper className="shrink-0 text-green-dark" /><div><b>Welcome to LiveSinger Shimla!</b><p className="text-sm text-ink/75">Your profile is created. Complete the steps below while our team reviews it.</p></div></div>}
      <StatusCard s={s} />

      <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <Panel>
          <div className="flex items-center gap-4 p-5">
            <Progress pct={pct} size={84} />
            <div className="flex-1">
              <p className="text-sm muted">Profile strength</p>
              <b className="text-lg">{pct === 100 ? 'Complete. Great job!' : pct >= 70 ? 'Almost there' : 'Let’s finish your profile'}</b>
              <p className="text-sm muted">Clients trust complete profiles with prices and photos much more.</p>
            </div>
          </div>
          {next && (
            <Link to={paths.edit(next.key)} className="flex items-center gap-3 border-t border-line bg-soft/60 px-5 py-4 hover:bg-soft">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-green text-white"><ChevronRight size={20} /></span>
              <span className="flex-1"><span className="block text-xs font-semibold text-green-dark">NEXT STEP · +{next.weight}%</span><b className="block">{next.title}</b><span className="text-sm muted">{next.hint}</span></span>
            </Link>
          )}
        </Panel>
        <div className="grid grid-cols-2 gap-3">
          <Stat label="Profile views" value={s.viewCount ?? 0} icon={Eye} sub={s.status === 'approved' ? 'All time' : 'Starts after approval'} />
          <Stat label="Upcoming gigs" value={upcoming.length} icon={CalendarCheck} tone={upcoming.length ? 'green' : 'ink'} />
          <Stat label="Gigs done" value={done.length} icon={Users} />
          <Stat label="Earned" value={inr(earned)} icon={IndianRupee} sub="After commission" />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Next gigs" action={<Link to="/dashboard/bookings" className="text-sm font-semibold text-green-dark">All gigs</Link>}>
          {gigs === null ? <p className="p-5 text-sm muted">Loading…</p> : upcoming.length ? <div className="divide-y divide-line">{upcoming.slice(0, 3).map((g) => <GigRow key={g.id} g={g} />)}</div>
            : <Empty icon={CalendarDays} title="No upcoming gigs yet" text={s.status === 'approved' ? 'Share your page to get your first booking.' : 'Bookings start once your profile is live.'} />}
        </Panel>
        <Panel title="Get more bookings">
          <ul className="divide-y divide-line">
            {[
              ['Put your link in your Instagram bio', '/dashboard/share'],
              ['Post a story after every gig', paths.edit('stories')],
              ['Add a wedding package with clear inclusions', paths.edit('pricing')],
              ['Use bright, recent performance photos', paths.edit('gallery')],
            ].map(([t, to]) => <li key={t}><Link to={to} className="flex min-h-[52px] items-center gap-3 px-4 py-2 text-[15px] hover:bg-soft"><Lightbulb size={18} className="shrink-0 text-amber-500" /><span className="flex-1">{t}</span><ChevronRight size={17} className="text-muted" /></Link></li>)}
          </ul>
        </Panel>
      </div>
    </div>
  )
}

/* ───────── Gigs ───────── */
function GigRow({ g }: { g: SingerBooking }) {
  const d = fmtDay(g.eventDate)
  const badge = { confirmed: ['badge-green', 'Confirmed'], completed: ['badge-gray', 'Done'], cancelled: ['badge-red', 'Cancelled'], requested: ['badge-amber', 'Pending'] }[g.status]
  return (
    <div className="flex items-center gap-3 px-4 py-3.5">
      <div className="grid w-14 shrink-0 place-items-center rounded-xl border border-line bg-white py-1.5 text-center leading-tight">
        <span className="text-[11px] font-bold uppercase text-green-dark">{d.toLocaleDateString('en-IN', { month: 'short' })}</span>
        <span className="text-xl font-extrabold">{d.getDate()}</span>
      </div>
      <div className="flex-1">
        <b className="block truncate text-[15px]">{g.eventType} · {g.packageName}</b>
        <span className="flex items-center gap-1 truncate text-sm muted"><MapPin size={13} className="shrink-0" />{g.venue} · {g.startTime.slice(0, 5)}</span>
      </div>
      <div className="text-right"><b className="block text-[15px]">{inr(g.payout)}</b><span className={`badge ${badge[0]}`}>{badge[1]}</span></div>
    </div>
  )
}

function GigsTab({ gigs }: { gigs: SingerBooking[] | null }) {
  const [view, setView] = useState<'upcoming' | 'past'>('upcoming')
  const list = useMemo(() => (gigs ?? []).filter((g) => (view === 'upcoming' ? g.eventDate >= today() && g.status === 'confirmed' : g.eventDate < today() || g.status !== 'confirmed')).sort((a, b) => (view === 'upcoming' ? a.eventDate.localeCompare(b.eventDate) : b.eventDate.localeCompare(a.eventDate))), [gigs, view])
  const earned = (gigs ?? []).filter((g) => g.status === 'completed').reduce((a, g) => a + g.payout, 0)
  return (
    <div className="grid gap-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Stat label="Upcoming" value={(gigs ?? []).filter((g) => g.status === 'confirmed' && g.eventDate >= today()).length} tone="green" />
        <Stat label="Completed" value={(gigs ?? []).filter((g) => g.status === 'completed').length} />
        <div className="col-span-2 sm:col-span-1"><Stat label="Total earned" value={inr(earned)} sub="Paid to your UPI after each show" /></div>
      </div>
      <div className="flex gap-2">{(['upcoming', 'past'] as const).map((v) => <button key={v} className="chip" aria-pressed={view === v} onClick={() => setView(v)}>{v === 'upcoming' ? 'Upcoming' : 'Past'}</button>)}</div>
      <Panel>
        {gigs === null ? <p className="p-5 muted">Loading…</p> : list.length ? <div className="divide-y divide-line">{list.map((g) => <GigRow key={g.id} g={g} />)}</div>
          : <Empty icon={CalendarDays} title={view === 'upcoming' ? 'No upcoming gigs' : 'No past gigs yet'} text="Confirmed bookings appear here with date, venue and your payout." />}
      </Panel>
      <p className="flex gap-2 text-sm muted"><AlertCircle size={16} className="mt-0.5 shrink-0" />Our team shares client details and timings with you before each event. Amounts shown are your payout after the platform commission.</p>
    </div>
  )
}

/* ───────── Profile ───────── */
function ProfileTab({ s, p }: { s: Singer; p: SingerPrivate }) {
  const { pct, sections } = completion(s, p)
  return (
    <div className="grid gap-4 lg:grid-cols-[340px_1fr]">
      <div className="grid h-fit gap-3">
        <div className="card overflow-hidden">
          <div className="relative"><Photo src={s.cover || s.gallery[0]?.url} alt="" name={s.stageName} className="aspect-[16/9] w-full" /><span className="badge absolute left-3 top-3 bg-white/95 text-ink">How clients see you</span></div>
          <div className="-mt-9 px-4 pb-4">
            <Photo src={s.avatar} alt="" name={s.stageName} className="size-[72px] rounded-full border-4 border-white" />
            <h2 className="mt-1 flex items-center gap-1.5 text-lg font-bold">{s.stageName} {s.verified && <Verified />}</h2>
            <p className="text-sm muted">{s.tagline || 'Add a one-line intro in “About you”'}</p>
            <div className="mt-3 flex items-center justify-between border-t border-line pt-3 text-sm">
              <span className="muted">{s.genres.slice(0, 2).join(' · ') || 'No genres yet'}</span>
              <b>{s.packages.length ? `From ${inr(minPrice(s.packages))}` : 'No price yet'}</b>
            </div>
          </div>
        </div>
        {s.status === 'approved' ? <Link to={paths.singer(s.slug)} className="btn btn-outline">Open my public page</Link> : <p className="text-center text-sm muted">Your public page goes live after approval.</p>}
      </div>
      <Panel title={`Profile sections · ${pct}%`}>
        <ul className="divide-y divide-line">
          {sections.map((x) => (
            <li key={x.key}>
              <Link to={paths.edit(x.key)} className="flex min-h-[64px] items-center gap-3 px-4 py-2.5 hover:bg-soft">
                {x.done ? <CheckCircle2 size={22} className="shrink-0 text-green" /> : <Circle size={22} className="shrink-0 text-line" />}
                <span className="flex-1"><b className="block text-[15px]">{x.title}</b><span className="text-sm muted">{x.hint}</span></span>
                <span className={`text-sm font-semibold ${x.done ? 'text-muted' : 'text-green-dark'}`}>{x.done ? 'Edit' : `Add +${x.weight}%`}</span>
                <ChevronRight size={17} className="text-muted" />
              </Link>
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  )
}

/* ───────── Share ───────── */
function ShareTab({ s }: { s: Singer }) {
  const link = `${SITE_URL}${paths.singer(s.slug)}`
  const [copied, setCopied] = useState(false)
  const svg = useMemo(() => { const q = qrcode(0, 'M'); q.addData(link); q.make(); return q.createSvgTag({ cellSize: 6, margin: 2, scalable: true }) }, [link])
  const live = s.status === 'approved'
  const copy = async () => { try { await navigator.clipboard.writeText(link); setCopied(true); setTimeout(() => setCopied(false), 2000) } catch { /* ignore */ } }
  const share = async () => { try { await navigator.share({ title: `${s.stageName} – live singer in Shimla`, url: link }) } catch { copy() } }
  const msg = encodeURIComponent(`Hi! You can check my performances and book me for your event here: ${link}`)
  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
      <div className="grid h-fit gap-4">
        {!live && <p className="card flex gap-3 border-amber-200 bg-amber-50 p-4 text-sm"><Clock size={18} className="shrink-0 text-amber-600" />Your link starts working as soon as your profile is approved. You can prepare your posts now.</p>}
        <Panel title="Your booking link">
          <div className="p-4">
            <div className="flex items-center gap-2 rounded-xl border border-line bg-soft p-2 pl-3"><span className="flex-1 truncate text-[15px] font-medium">{link.replace(/^https?:\/\//, '')}</span><button onClick={copy} className="btn btn-dark btn-sm"><Copy size={15} />{copied ? 'Copied' : 'Copy'}</button></div>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
              <a href={`https://wa.me/?text=${msg}`} target="_blank" rel="noopener" className="btn btn-outline btn-sm"><MessageCircle size={16} /> WhatsApp</a>
              <button onClick={share} className="btn btn-outline btn-sm"><Share2 size={16} /> Share</button>
              <a href={`mailto:?subject=${encodeURIComponent('Book me for your event')}&body=${msg}`} className="btn btn-outline btn-sm col-span-2 sm:col-span-1"><Mail size={16} /> Email</a>
            </div>
          </div>
        </Panel>
        <Panel title="Where to use it">
          <ul className="grid gap-3 p-4 text-[15px]">
            <li className="flex gap-3"><Star size={18} className="mt-0.5 shrink-0 text-green" /><span><b>Instagram bio:</b> “Bookings 👉 {link.replace(/^https?:\/\//, '')}”</span></li>
            <li className="flex gap-3"><Star size={18} className="mt-0.5 shrink-0 text-green" /><span><b>WhatsApp status</b> after every show, with a short video.</span></li>
            <li className="flex gap-3"><Star size={18} className="mt-0.5 shrink-0 text-green" /><span><b>QR code</b> on a small standee near the stage. Guests scan it to book you for their own events.</span></li>
          </ul>
        </Panel>
      </div>
      <Panel title="QR code" className="h-fit">
        <div className="p-5 text-center">
          <div className="mx-auto w-full max-w-[220px] rounded-2xl border border-line bg-white p-3 [&_svg]:h-auto [&_svg]:w-full" dangerouslySetInnerHTML={{ __html: svg }} />
          <p className="mt-3 text-sm muted">Scan to open {s.stageName}'s booking page</p>
          <a href={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`} download={`${s.slug}-qr.svg`} className="btn btn-outline btn-sm mt-3"><Download size={15} /> Download QR</a>
        </div>
      </Panel>
    </div>
  )
}

/* ───────── Help ───────── */
function HelpTab() {
  const [rating, setRating] = useState(0)
  const [msg, setMsg] = useState('')
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)
  const faq = [
    ['When do I get paid?', 'Your payout is sent to your UPI ID after each completed show. The exact timeline is in your artist contract.'],
    ['How much commission does LiveSinger take?', 'A fixed percentage per booking, written in your artist contract. You only pay when you get booked.'],
    ['Can a client contact me directly?', 'No. Clients book through the platform so we can guarantee the show and your payment. Sharing your number with clients breaks the contract.'],
    ['How do I block dates I’m busy?', 'Message our team for now. A calendar is coming soon.'],
  ]
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Panel title="Send us feedback" className="h-fit">
        {sent ? <Empty icon={CheckCircle2} title="Thanks for your feedback" text="Our team reads every message." /> : (
          <form className="p-4" onSubmit={async (e) => { e.preventDefault(); if (!rating && !msg.trim()) return; setBusy(true); await repo.sendFeedback({ rating, message: msg.trim() }).catch(() => {}); setBusy(false); setSent(true) }}>
            <p className="text-sm muted">How is your experience so far?</p>
            <div className="mt-2 flex gap-1" role="radiogroup" aria-label="Rating">{[1, 2, 3, 4, 5].map((n) => <button type="button" key={n} onClick={() => setRating(n)} role="radio" aria-checked={rating === n} aria-label={`${n} stars`} className={`grid size-11 place-items-center rounded-xl text-[26px] leading-none ${n <= rating ? 'text-amber-400' : 'text-gray-300'}`}>★</button>)}</div>
            <textarea value={msg} onChange={(e) => setMsg(e.target.value)} className="field mt-3" placeholder="Ideas, problems, anything we can improve" />
            <button disabled={busy || (!rating && !msg.trim())} className="btn btn-dark btn-sm mt-3"><Send size={15} /> Send feedback</button>
          </form>
        )}
      </Panel>
      <div className="grid h-fit gap-4">
        <Panel title="Common questions">
          <div className="divide-y divide-line">{faq.map(([q, a]) => <details key={q} className="group px-4 py-3 [&_summary::-webkit-details-marker]:hidden"><summary className="flex min-h-8 cursor-pointer list-none items-center justify-between gap-3 font-semibold">{q}<ChevronRight size={17} className="shrink-0 text-muted transition group-open:rotate-90" /></summary><p className="mt-2 text-[15px] muted">{a}</p></details>)}</div>
        </Panel>
        <Panel title="Talk to our team"><div className="p-4 text-[15px]"><p className="muted">We usually reply within a few hours.</p><a href={`mailto:${SITE_EMAIL}`} className="btn btn-outline btn-sm mt-3"><Mail size={15} /> {SITE_EMAIL}</a></div></Panel>
      </div>
    </div>
  )
}
