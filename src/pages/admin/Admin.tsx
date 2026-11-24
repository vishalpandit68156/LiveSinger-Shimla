import { Activity as ActivityIcon, AtSign, CalendarCheck, CalendarDays, Check, CheckCircle2, ChevronRight, Clock, IndianRupee, Inbox, LayoutGrid, Mail, MessageSquare, Phone, Search, ShieldCheck, UserPlus, Users, X } from 'lucide-react'
import { DashShell, Empty, Panel, Stat } from '../../components/DashShell'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Photo } from '../../components/Photo'
import { Progress, Stars, StatusBadge } from '../../components/ui'
import { inr } from '../../data/catalog'
import type { Activity, Booking, Feedback, Singer, SingerPrivate, SingerStatus } from '../../data/types'
import { useAuth } from '../../lib/auth'
import { completion } from '../../lib/completion'
import { repo, type AdminSinger } from '../../lib/repo'
import { Link, paths } from '../../lib/router'
import { Seo } from '../../lib/seo'
import { NeedLogin } from '../dashboard/Dashboard'

const ago = (iso: string) => {
  const m = Math.round((Date.now() - new Date(iso).getTime()) / 60000)
  if (m < 60) return `${Math.max(1, m)} min ago`
  if (m < 1440) return `${Math.round(m / 60)} h ago`
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}
const when = (iso: string) => new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })

type Rows = { singer: Singer; priv: SingerPrivate | null }[]
function useAdminData() {
  const [singers, setSingers] = useState<Rows | null>(null)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [feedback, setFeedback] = useState<Feedback[]>([])
  const [activity, setActivity] = useState<Activity[]>([])
  const load = () => Promise.all([repo.adminSingers().then(setSingers).catch(() => setSingers([])), repo.adminBookings().then(setBookings).catch(() => {}), repo.adminFeedback().then(setFeedback).catch(() => {}), repo.adminActivity().then(setActivity).catch(() => {})])
  useEffect(() => { load() }, [])
  return { singers, bookings, feedback, activity, reload: load }
}

function Shell({ children, title, action }: { children: ReactNode; title: string; action?: ReactNode }) {
  const { email } = useAuth()
  const [counts, setCounts] = useState({ pending: 0, requests: 0 })
  useEffect(() => {
    Promise.all([repo.adminSingers(), repo.adminBookings()]).then(([s, b]) => setCounts({ pending: s.filter((x) => x.singer.status === 'pending_review').length, requests: b.filter((x) => x.status === 'requested').length })).catch(() => {})
  }, [title])
  const nav = [
    { to: paths.admin, label: 'Overview', icon: LayoutGrid, exact: true },
    { to: '/admin/singers', label: 'Singers', icon: Users, badge: counts.pending || undefined },
    { to: '/admin/bookings', label: 'Bookings', icon: CalendarDays, badge: counts.requests || undefined },
    { to: '/admin/feedback', label: 'Feedback', icon: MessageSquare },
  ]
  return (
    <DashShell nav={nav} title={title} action={action} user={{ name: 'LiveSinger team', sub: email ?? '' }}>
      <Seo title="Admin – LiveSinger Shimla" description="Admin dashboard" path={paths.admin} noindex />
      <div className="sheet-in">{children}</div>
    </DashShell>
  )
}

export function AdminGate({ children }: { children: ReactNode }) {
  const { ready, email, isAdmin } = useAuth()
  if (!ready) return <p className="py-24 text-center muted">Loading…</p>
  if (!email) return <NeedLogin next={location.pathname.startsWith('/admin') ? location.pathname : paths.admin} />
  if (!isAdmin) return <div className="wrap py-24 text-center"><ShieldCheck className="mx-auto text-muted" /><h1 className="mt-3 text-xl font-bold">Admins only</h1><p className="muted">You are logged in as {email}.</p></div>
  return <>{children}</>
}

function SingerRow({ singer: s, priv }: Rows[number]) {
  const { pct } = completion(s, priv)
  return (
    <Link to={paths.adminSinger(s.id)} className="flex min-h-[72px] items-center gap-3 px-4 py-3 hover:bg-soft">
      <Photo src={s.avatar} alt="" name={s.stageName} className="size-12 shrink-0 rounded-full" />
      <div className="flex-1">
        <b className="block truncate">{s.stageName}</b>
        <span className="block truncate text-sm muted">{priv?.fullName} · {s.performerType} · {ago(s.createdAt)}</span>
      </div>
      <div className="hidden w-[70px] text-right text-sm sm:block"><b>{pct}%</b><span className="block text-xs muted">complete</span></div>
      <span className="shrink-0 sm:w-[110px]"><StatusBadge s={s.status} /></span>
      <ChevronRight size={18} className="shrink-0 text-muted" />
    </Link>
  )
}

const ACT_ICON = { singer: UserPlus, booking: CalendarDays, approved: CheckCircle2, feedback: MessageSquare }

export function AdminOverview() {
  const { singers, bookings, feedback, activity } = useAdminData()
  if (!singers) return <Shell title="Overview"><p className="muted">Loading…</p></Shell>
  const pending = singers.filter((x) => x.singer.status === 'pending_review')
  const live = singers.filter((x) => x.singer.status === 'approved').length
  const requests = bookings.filter((b) => b.status === 'requested')
  const month = new Date().toISOString().slice(0, 7)
  const won = bookings.filter((b) => (b.status === 'confirmed' || b.status === 'completed'))
  const monthValue = won.filter((b) => b.eventDate.startsWith(month) || b.createdAt.startsWith(month)).reduce((a, b) => a + b.total, 0)
  const commission = Math.round(won.reduce((a, b) => a + b.total, 0) * 0.2)
  const pipe = [['New requests', requests.length, 'bg-amber-400'], ['Confirmed', bookings.filter((b) => b.status === 'confirmed').length, 'bg-green'], ['Completed', bookings.filter((b) => b.status === 'completed').length, 'bg-ink'], ['Cancelled', bookings.filter((b) => b.status === 'cancelled').length, 'bg-red-300']] as const
  const total = Math.max(1, bookings.length)
  const name = (id: string) => singers.find((x) => x.singer.id === id)?.singer.stageName ?? 'Singer'

  return (
    <Shell title="Overview">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Waiting for review" value={pending.length} tone={pending.length ? 'amber' : 'ink'} icon={Clock} sub="Singer profiles" />
        <Stat label="Booking requests" value={requests.length} tone={requests.length ? 'amber' : 'ink'} icon={CalendarDays} sub="Need a call back" />
        <Stat label="Live singers" value={live} tone="green" icon={Users} />
        <Stat label="Bookings this month" value={inr(monthValue)} icon={IndianRupee} sub={`Est. commission to date ${inr(commission)}`} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.3fr_1fr]">
        <Panel title="Review queue" action={<Link to="/admin/singers" className="text-sm font-semibold text-green-dark">All singers</Link>}>
          {pending.length ? <div className="divide-y divide-line">{pending.map((r) => <SingerRow key={r.singer.id} {...r} />)}</div> : <Empty icon={Check} title="All caught up" text="No singer profiles are waiting for review." />}
        </Panel>
        <Panel title="Booking pipeline" action={<Link to="/admin/bookings" className="text-sm font-semibold text-green-dark">Manage</Link>}>
          <div className="p-4">
            <div className="flex h-3 overflow-hidden rounded-full bg-soft">{pipe.map(([l, n, c]) => n ? <span key={l} className={c} style={{ width: `${(n / total) * 100}%` }} /> : null)}</div>
            <ul className="mt-4 grid grid-cols-2 gap-3">{pipe.map(([l, n, c]) => <li key={l} className="flex items-center gap-2 text-sm"><span className={`size-2.5 rounded-full ${c}`} /><span className="flex-1 muted">{l}</span><b>{n}</b></li>)}</ul>
          </div>
          {requests.length > 0 && <div className="divide-y divide-line border-t border-line">{requests.slice(0, 3).map((b) => (
            <Link key={b.id} to="/admin/bookings" className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-soft"><span className="flex-1"><b className="block">{name(b.singerId)} · {new Date(b.eventDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</b><span className="muted">{b.contact.org || b.contact.name} · {ago(b.createdAt)}</span></span><b>{inr(b.total)}</b></Link>
          ))}</div>}
        </Panel>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Panel title="Recent activity">
          {activity.length ? <ul className="divide-y divide-line">{activity.slice(0, 8).map((a) => { const I = ACT_ICON[a.kind] ?? ActivityIcon; const row = <><span className={`grid size-9 shrink-0 place-items-center rounded-xl ${a.kind === 'approved' ? 'bg-mint text-green-dark' : 'bg-soft text-muted'}`}><I size={17} /></span><span className="flex-1 text-[15px]">{a.title}</span><span className="shrink-0 text-xs muted">{ago(a.at)}</span></>
            return <li key={a.id}>{a.link ? <Link to={a.link} className="flex items-center gap-3 px-4 py-3 hover:bg-soft">{row}</Link> : <div className="flex items-center gap-3 px-4 py-3">{row}</div>}</li> })}</ul> : <Empty icon={ActivityIcon} title="No activity yet" />}
        </Panel>
        <Panel title="Latest feedback" action={<Link to="/admin/feedback" className="text-sm font-semibold text-green-dark">All</Link>}>
          {feedback.length ? <ul className="divide-y divide-line">{feedback.slice(0, 4).map((f) => <li key={f.id} className="px-4 py-3"><div className="flex items-center justify-between gap-2"><b className="text-[15px]">{f.from}</b>{f.rating > 0 && <Stars value={f.rating} size={12} />}</div>{f.message && <p className="mt-1 line-clamp-2 text-sm muted">{f.message}</p>}</li>)}</ul> : <Empty icon={MessageSquare} title="No feedback yet" />}
        </Panel>
      </div>
    </Shell>
  )
}

export function AdminSingers() {
  const { singers } = useAdminData()
  const [tab, setTab] = useState<SingerStatus | 'all'>('pending_review')
  const [q, setQ] = useState('')
  const list = useMemo(() => (singers ?? []).filter((x) => (tab === 'all' || x.singer.status === tab) && [x.singer.stageName, x.priv?.fullName, x.priv?.email, x.priv?.phone].join(' ').toLowerCase().includes(q.toLowerCase())), [singers, tab, q])
  const count = (s: SingerStatus) => (singers ?? []).filter((x) => x.singer.status === s).length
  const tabs: [SingerStatus | 'all', string][] = [['pending_review', `Pending (${count('pending_review')})`], ['approved', `Live (${count('approved')})`], ['rejected', `Changes needed (${count('rejected')})`], ['all', 'All']]
  return (
    <Shell title="Singers">
      <div className="no-scrollbar flex gap-2 overflow-x-auto">{tabs.map(([k, l]) => <button key={k} onClick={() => setTab(k)} className="chip" aria-pressed={tab === k}>{l}</button>)}</div>
      <label className="relative mt-3 block"><Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, email or phone" className="field !pl-10" type="search" /></label>
      <div className="card mt-4 divide-y divide-line overflow-hidden">
        <div className="hidden items-center gap-3 bg-soft px-4 py-2 text-xs font-semibold uppercase text-muted sm:flex"><span className="w-12" /><span className="flex-1">Singer</span><span className="w-[70px] text-right">Profile</span><span className="w-[110px]">Status</span><span className="w-[18px]" /></div>
        {singers === null ? <p className="p-5 muted">Loading…</p> : list.length ? list.map((r) => <SingerRow key={r.singer.id} {...r} />) : <p className="flex items-center gap-2 p-5 text-sm muted"><Inbox size={16} /> Nothing here.</p>}
      </div>
    </Shell>
  )
}

const TEMPLATE = { approval: 'Approval email', contract: 'Artist contract email', rejection: 'Changes requested email' }

export function AdminSingerDetail({ id }: { id: string }) {
  const [d, setD] = useState<AdminSinger | null | undefined>(undefined)
  const [sheet, setSheet] = useState<null | 'reject' | 'approve' | 'suspend'>(null)
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const load = () => repo.adminSinger(id).then(setD).catch(() => setD(null))
  useEffect(() => { load() }, [id]) // eslint-disable-line react-hooks/exhaustive-deps
  if (d === undefined) return <Shell title="Singer"><p className="muted">Loading…</p></Shell>
  if (!d) return <Shell title="Singer"><p className="muted">Singer not found.</p></Shell>
  const { singer: s, priv: p, emails } = d
  const { pct, sections } = completion(s, p)
  const act = async (status: SingerStatus) => { setBusy(true); await repo.setStatus(s.id, status, note.trim()); setBusy(false); setSheet(null); setNote(''); load() }
  const Row = ({ k, v }: { k: string; v: ReactNode }) => <div className="flex justify-between gap-4 py-2.5 text-[15px]"><dt className="shrink-0 muted">{k}</dt><dd className="text-right font-medium">{v || <span className="muted">Not added</span>}</dd></div>

  return (
    <Shell title="Review singer">
      <Link to="/admin/singers" className="text-sm font-semibold text-muted">← All singers</Link>
      <div className="mt-3 flex items-center gap-4">
        <Photo src={s.avatar} alt="" name={s.stageName} className="size-16 shrink-0 rounded-full sm:size-20" />
        <div className="flex-1"><h1 className="text-2xl font-bold">{s.stageName}</h1><p className="text-sm muted">Registered {when(s.createdAt)}</p></div>
        <StatusBadge s={s.status} />
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_340px]">
        <div className="grid gap-4">
          <div className="card p-5">
            <h2 className="font-bold">Registration details</h2>
            <dl className="mt-2 divide-y divide-line">
              <Row k="Full name" v={p?.fullName} /><Row k="Stage name" v={s.stageName} /><Row k="Act" v={s.performerType} /><Row k="Based in" v={s.city} />
              <Row k="Email" v={p?.email && <a href={`mailto:${p.email}`} className="text-green-dark">{p.email}</a>} />
              <Row k="Mobile" v={p?.phone && <a href={`tel:+91${p.phone}`} className="text-green-dark">+91 {p.phone}</a>} />
              <Row k="WhatsApp" v={p?.whatsapp && <a href={`https://wa.me/91${p.whatsapp}`} target="_blank" rel="noopener" className="text-green-dark">+91 {p.whatsapp}</a>} />
              <Row k="Instagram" v={s.instagram && <a href={`https://instagram.com/${s.instagram}`} target="_blank" rel="noopener" className="inline-flex items-center gap-1 text-green-dark"><AtSign size={14} />{s.instagram}</a>} />
              <Row k="Payout UPI" v={p?.payoutUpi} /><Row k="ID proof" v={p?.idProof ? 'Uploaded' : ''} />
              <Row k="Contract" v={p?.contractSignedAt ? `Signed ${when(p.contractSignedAt)}` : 'Not signed yet'} />
            </dl>
          </div>
          <div className="card p-5">
            <h2 className="font-bold">Public profile</h2>
            {s.tagline && <p className="mt-2 font-semibold">{s.tagline}</p>}
            <p className="mt-1 text-[15px] muted">{s.bio || 'No bio yet.'}</p>
            <div className="mt-3 flex flex-wrap gap-1.5">{[...s.genres, ...s.eventTypes].map((x) => <span key={x} className="badge badge-gray">{x}</span>)}</div>
            <h3 className="mt-5 text-sm font-bold">Packages</h3>
            {s.packages.length ? <ul className="mt-1 divide-y divide-line text-[15px]">{s.packages.map((x) => <li key={x.id} className="flex justify-between py-2"><span>{x.name} · {x.durationHrs}h</span><b>{inr(x.price)}</b></li>)}</ul> : <p className="text-sm muted">None yet</p>}
            <h3 className="mt-5 text-sm font-bold">Photos ({s.gallery.length}) · Stories ({s.stories.length})</h3>
            <div className="mt-2 grid grid-cols-4 gap-1.5 sm:grid-cols-6">{[...s.gallery, ...s.stories].map((m) => m.kind === 'video' ? <video key={m.id} src={m.url} className="aspect-square w-full rounded-lg object-cover" muted /> : <Photo key={m.id} src={m.url} alt="" name={m.caption ?? 'Photo'} className="aspect-square w-full rounded-lg" />)}</div>
          </div>
        </div>

        <div className="grid h-fit gap-4">
          <div className="card p-5">
            <div className="flex items-center gap-3"><Progress pct={pct} size={60} /><div><b>Profile {pct}% complete</b><p className="text-sm muted">{sections.filter((x) => !x.done).length} sections missing</p></div></div>
            <ul className="mt-3 space-y-1.5 text-sm">{sections.map((x) => <li key={x.key} className="flex items-center gap-2">{x.done ? <Check size={15} className="text-green" /> : <X size={15} className="text-red-500" />}{x.title}</li>)}</ul>
          </div>
          <div className="card p-5">
            <h2 className="font-bold">Emails</h2>
            {emails.length ? <ul className="mt-3 space-y-3">{emails.map((e) => <li key={e.id} className="flex gap-3 text-sm"><Mail size={16} className={`mt-0.5 shrink-0 ${e.sentAt ? 'text-green' : 'text-amber-500'}`} /><span><b className="block">{TEMPLATE[e.template]}</b><span className="muted">{e.sentAt ? `Sent ${when(e.sentAt)}` : `Scheduled for ${when(e.sendAfter)}`} · {e.to}</span></span></li>)}</ul>
              : <p className="mt-2 text-sm muted">On approval, the singer gets an approval email right away and the artist contract 24 hours later.</p>}
          </div>
          {s.adminNote && <div className="card p-5 text-sm"><b>Last note to singer</b><p className="mt-1 muted">“{s.adminNote}”</p></div>}
          {s.status === 'approved' && <Link to={paths.singer(s.slug)} className="btn btn-outline">Open public page</Link>}
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-[58px] z-30 border-t border-line bg-white md:static md:mt-5 md:border-0 md:bg-transparent">
        <div className="flex gap-3 px-4 py-3 md:px-0">
          {s.status !== 'approved' && <><button onClick={() => setSheet('reject')} className="btn btn-outline flex-1 md:flex-none">Request changes</button><button onClick={() => setSheet('approve')} className="btn btn-primary flex-1 md:flex-none"><Check size={18} /> Approve</button></>}
          {s.status === 'approved' && <button onClick={() => setSheet('suspend')} className="btn btn-outline flex-1 !text-red-700 md:flex-none">Suspend profile</button>}
        </div>
      </div>

      {sheet && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40 sm:items-center" onClick={() => setSheet(null)}>
          <div className="sheet-in w-full max-w-md rounded-t-3xl bg-white p-6 sm:rounded-3xl" onClick={(e) => e.stopPropagation()} style={{ paddingBottom: 'max(24px, env(safe-area-inset-bottom))' }}>
            {sheet === 'approve' && <><h2 className="text-xl font-bold">Approve {s.stageName}?</h2><p className="mt-2 text-[15px] muted">The profile goes live now. {p?.email} gets the approval email immediately and the artist contract 24 hours later.</p>{pct < 70 && <p className="mt-3 rounded-xl bg-amber-50 p-3 text-sm text-amber-900">Profile is only {pct}% complete. You can still approve it.{!s.packages.length && ' It stays out of search results until the singer adds prices.'}</p>}</>}
            {sheet === 'reject' && <><h2 className="text-xl font-bold">Request changes</h2><p className="mt-1 text-[15px] muted">The singer sees this note on their dashboard and by email.</p><textarea value={note} onChange={(e) => setNote(e.target.value)} className="field mt-3" placeholder="e.g. Please add 3 clear performance photos and your prices." autoFocus /></>}
            {sheet === 'suspend' && <><h2 className="text-xl font-bold">Suspend {s.stageName}?</h2><p className="mt-1 text-[15px] muted">The public page goes offline until you approve again.</p><textarea value={note} onChange={(e) => setNote(e.target.value)} className="field mt-3" placeholder="Reason (internal and shown to singer)" /></>}
            <div className="mt-5 flex gap-3">
              <button onClick={() => setSheet(null)} className="btn btn-outline flex-1">Cancel</button>
              <button disabled={busy || (sheet === 'reject' && !note.trim())} onClick={() => act(sheet === 'approve' ? 'approved' : sheet === 'reject' ? 'rejected' : 'suspended')} className={`btn flex-1 ${sheet === 'approve' ? 'btn-primary' : 'btn-dark'}`}>{busy ? 'Saving…' : sheet === 'approve' ? 'Approve' : sheet === 'reject' ? 'Send to singer' : 'Suspend'}</button>
            </div>
          </div>
        </div>
      )}
    </Shell>
  )
}

export function AdminBookings() {
  const { bookings, singers, reload } = useAdminData()
  const [tab, setTab] = useState<Booking['status']>('requested')
  const [busy, setBusy] = useState('')
  const name = (id: string) => singers?.find((x) => x.singer.id === id)?.singer.stageName ?? 'Singer'
  const pkg = (b: Booking) => singers?.find((x) => x.singer.id === b.singerId)?.singer.packages.find((p) => p.id === b.packageId)?.name ?? 'Package'
  const list = bookings.filter((b) => b.status === tab).sort((a, b) => (tab === 'requested' ? b.createdAt.localeCompare(a.createdAt) : a.eventDate.localeCompare(b.eventDate)))
  const count = (st: Booking['status']) => bookings.filter((b) => b.status === st).length
  const act = async (b: Booking, patch: Partial<Pick<Booking, 'status' | 'paymentStatus'>>) => { setBusy(b.id); await repo.updateBooking(b.id, patch); await reload(); setBusy('') }
  const tabs: [Booking['status'], string][] = [['requested', 'New'], ['confirmed', 'Confirmed'], ['completed', 'Completed'], ['cancelled', 'Cancelled']]
  return (
    <Shell title="Bookings">
      <div className="no-scrollbar flex gap-2 overflow-x-auto">{tabs.map(([k, l]) => <button key={k} onClick={() => setTab(k)} className="chip" aria-pressed={tab === k}>{l} ({count(k)})</button>)}</div>
      {tab === 'requested' && count('requested') > 0 && <p className="mt-3 text-sm muted">Call the client, confirm the singer is free, send the advance link. When the advance is paid, confirm the booking.</p>}
      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        {list.map((b) => {
          const d = new Date(b.eventDate + 'T00:00:00')
          return (
            <div key={b.id} className="card p-4">
              <div className="flex items-start gap-3">
                <div className="grid w-14 shrink-0 place-items-center rounded-xl border border-line py-1.5 text-center leading-tight"><span className="text-[11px] font-bold uppercase text-green-dark">{d.toLocaleDateString('en-IN', { month: 'short' })}</span><span className="text-xl font-extrabold">{d.getDate()}</span></div>
                <div className="min-w-0 flex-1"><div className="flex flex-wrap items-baseline justify-between gap-x-3"><b>{name(b.singerId)}</b><b>{inr(b.total)}</b></div><span className="text-sm muted">{pkg(b)} · {b.eventType} · {b.startTime.slice(0, 5)}</span><span className="block text-sm muted">{b.venue}{b.guests ? ` · ${b.guests} guests` : ''}</span><span className="mt-1.5 inline-flex"><span className={`badge ${b.paymentStatus === 'paid' ? 'badge-green' : b.paymentStatus === 'refunded' ? 'badge-gray' : 'badge-amber'}`}>{b.paymentStatus === 'paid' ? 'Advance paid' : b.paymentStatus === 'refunded' ? 'Refunded' : `Advance ${inr(b.advanceAmount)} due`}</span></span></div>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 rounded-xl bg-soft px-3 py-2 text-sm">
                <span><b>{b.contact.name}</b>{b.contact.org ? `, ${b.contact.org}` : ''}</span>
                <a href={`tel:+91${b.contact.phone}`} className="inline-flex items-center gap-1 font-semibold text-green-dark"><Phone size={14} />+91 {b.contact.phone}</a>
                <a href={`https://wa.me/91${b.contact.phone}`} target="_blank" rel="noopener" className="font-semibold text-green-dark">WhatsApp</a>
                <span className="muted">{b.code} · {ago(b.createdAt)}</span>
              </div>
              {b.notes && <p className="mt-2 text-sm"><span className="muted">Note: </span>{b.notes}</p>}
              <div className="mt-3 flex flex-wrap gap-2">
                {b.status === 'requested' && <><button disabled={busy === b.id} onClick={() => act(b, { status: 'confirmed', paymentStatus: 'paid' })} className="btn btn-primary btn-sm"><CalendarCheck size={15} /> Advance paid, confirm</button><button disabled={busy === b.id} onClick={() => act(b, { status: 'cancelled' })} className="btn btn-outline btn-sm">Decline</button></>}
                {b.status === 'confirmed' && <><button disabled={busy === b.id} onClick={() => act(b, { status: 'completed' })} className="btn btn-dark btn-sm"><Check size={15} /> Mark show done</button><button disabled={busy === b.id} onClick={() => act(b, { status: 'cancelled', paymentStatus: 'refunded' })} className="btn btn-outline btn-sm">Cancel and refund</button></>}
              </div>
            </div>
          )
        })}
      </div>
      {!list.length && <Panel className="mt-4"><Empty icon={Inbox} title="Nothing here" text={tab === 'requested' ? 'New booking requests from clients show up here.' : undefined} /></Panel>}
    </Shell>
  )
}

export function AdminFeedback() {
  const { feedback } = useAdminData()
  return (
    <Shell title="Feedback">
      <div className="grid gap-3 lg:grid-cols-2">
        {feedback.map((f) => <div key={f.id} className="card p-4"><div className="flex items-center justify-between gap-3"><b>{f.from}</b><span className="text-sm muted">{ago(f.createdAt)}</span></div>{f.rating > 0 && <div className="mt-1"><Stars value={f.rating} /></div>}{f.message && <p className="mt-2 text-[15px]">{f.message}</p>}</div>)}
        {!feedback.length && <p className="card p-5 text-sm muted">No feedback yet.</p>}
      </div>
    </Shell>
  )
}
