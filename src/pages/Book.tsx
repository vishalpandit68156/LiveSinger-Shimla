import { CheckCircle2, Lock } from 'lucide-react'
import { useState } from 'react'
import { Photo } from '../components/Photo'
import { AppBar, Field } from '../components/ui'
import { ADVANCE_PCT, EVENTS, inr } from '../data/catalog'
import type { EventType, Singer } from '../data/types'
import { repo } from '../lib/repo'
import { Link, paths } from '../lib/router'
import { Seo } from '../lib/seo'

const STEPS = ['Event', 'Package', 'Your details', 'Review']
const phoneOk = (p: string) => /^[6-9]\d{9}$/.test(p)

export default function Book({ s, pkg }: { s: Singer; pkg?: string }) {
  const [at, setAt] = useState(0)
  const [f, setF] = useState({ date: '', time: '20:00', eventType: 'Hotel & Resort' as EventType, venue: '', guests: '', pkg: s.packages.find((p) => p.id === pkg)?.id ?? s.packages[0]?.id, name: '', org: '', phone: '', email: '', notes: '' })
  const [errs, setErrs] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState<string | null>(null)
  const p = s.packages.find((x) => x.id === f.pkg) ?? s.packages[0]
  const adv = Math.round((p.price * ADVANCE_PCT) / 100)
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => { setF({ ...f, [k]: e.target.value }); setErrs({ ...errs, [k]: '' }) }
  const today = new Date().toISOString().slice(0, 10)

  const validate = () => {
    const e: Record<string, string> = {}
    if (at === 0) { if (!f.date) e.date = 'Choose the event date'; if (!f.venue.trim()) e.venue = 'Where is the event?' }
    if (at === 2) {
      if (!f.name.trim()) e.name = 'Enter your name'
      if (!phoneOk(f.phone)) e.phone = 'Enter a 10 digit mobile number'
      if (f.email && !/^\S+@\S+\.\S+$/.test(f.email)) e.email = 'Check the email address'
    }
    setErrs(e); return !Object.keys(e).length
  }
  const next = async () => {
    if (!validate()) return
    if (at < 3) { setAt(at + 1); window.scrollTo({ top: 0 }); return }
    setBusy(true)
    try {
      const r = await repo.createBooking({ singerId: s.id, packageId: p.id, eventDate: f.date, startTime: f.time, eventType: f.eventType, venue: f.venue.trim(), guests: Number(f.guests) || 0, notes: f.notes.trim(), contact: { name: f.name.trim(), org: f.org.trim(), phone: f.phone, email: f.email.trim() }, total: p.price, advancePct: ADVANCE_PCT, advanceAmount: adv })
      setDone(r.code)
    } catch (e) { setErrs({ form: (e as Error).message || 'Something went wrong. Please try again.' }) } finally { setBusy(false) }
  }

  if (done) return (
    <div className="wrap grid min-h-[70dvh] place-items-center py-10">
      <Seo title="Booking request sent – LiveSinger Shimla" description="Your booking request has been sent." path={paths.book(s.slug)} noindex />
      <div className="card sheet-in w-full max-w-md p-7 text-center">
        <CheckCircle2 size={56} className="mx-auto text-green" />
        <h1 className="mt-4 text-2xl font-bold">Request sent</h1>
        <p className="mt-2 muted">Booking reference <b className="text-ink">{done}</b></p>
        <ol className="mt-5 space-y-3 text-left text-[15px]">
          <li className="flex gap-3"><span className="grid size-6 shrink-0 place-items-center rounded-full bg-mint text-xs font-bold text-green-dark">1</span>We confirm {s.stageName}'s availability for {new Date(f.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long' })}.</li>
          <li className="flex gap-3"><span className="grid size-6 shrink-0 place-items-center rounded-full bg-mint text-xs font-bold text-green-dark">2</span>You get a secure link on {f.phone} to pay the {inr(adv)} advance.</li>
          <li className="flex gap-3"><span className="grid size-6 shrink-0 place-items-center rounded-full bg-mint text-xs font-bold text-green-dark">3</span>Your date is locked. Pay {inr(p.price - adv)} after the show.</li>
        </ol>
        <Link to={paths.singers} className="btn btn-outline mt-6 w-full">Browse more singers</Link>
      </div>
    </div>
  )

  return (
    <div className="min-h-dvh bg-soft pb-28">
      <Seo title={`Book ${s.stageName} – LiveSinger Shimla`} description={`Send a booking request for ${s.stageName}.`} path={paths.book(s.slug)} noindex />
      <AppBar title={`Book ${s.stageName}`} back={at === 0 ? paths.singer(s.slug) : undefined} />
      <div className="wrap max-w-2xl py-4">
        <div className="card flex items-center gap-3 p-3">
          <Photo src={s.avatar} alt="" name={s.stageName} className="size-14 shrink-0 rounded-xl" />
          <div className="flex-1"><b className="block text-[15px]">{p.name}</b><span className="text-sm muted">{p.durationHrs} hours · {s.stageName}</span></div>
          <div className="text-right"><b className="block">{inr(p.price)}</b><span className="text-xs font-semibold text-green-dark">{inr(adv)} advance</span></div>
        </div>
        <div className="mt-4 flex gap-1.5" aria-label={`Step ${at + 1} of 4`}>{STEPS.map((x, i) => <span key={x} className={`h-1.5 flex-1 rounded-full ${i <= at ? 'bg-green' : 'bg-line'}`} />)}</div>
        <p className="mt-2 text-sm font-semibold">Step {at + 1} of 4 · {STEPS[at]}</p>

        <div className="card sheet-in mt-3 grid gap-4 p-5" key={at}>
          {at === 0 && <>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Date" error={errs.date}><input type="date" min={today} value={f.date} onChange={set('date')} className="field" aria-invalid={!!errs.date} /></Field>
              <Field label="Start time"><input type="time" value={f.time} onChange={set('time')} className="field" /></Field>
            </div>
            <Field label="Occasion"><select value={f.eventType} onChange={set('eventType')} className="field">{EVENTS.map((x) => <option key={x}>{x}</option>)}</select></Field>
            <Field label="Venue" error={errs.venue} help="Hotel, resort or address in Shimla"><input value={f.venue} onChange={set('venue')} className="field" placeholder="e.g. Hotel name, Mall Road" aria-invalid={!!errs.venue} /></Field>
            <Field label="Number of guests" optional><input value={f.guests} onChange={set('guests')} inputMode="numeric" className="field" placeholder="Approx." /></Field>
          </>}
          {at === 1 && s.packages.map((x) => (
            <label key={x.id} className={`flex cursor-pointer items-start gap-3 rounded-2xl border-[1.5px] p-4 transition ${f.pkg === x.id ? 'border-green bg-mint/50' : 'border-line'}`}>
              <input type="radio" name="pkg" checked={f.pkg === x.id} onChange={() => setF({ ...f, pkg: x.id })} className="mt-1 size-5 accent-[#17a34a]" />
              <span className="flex-1"><b className="block">{x.name}</b><span className="text-sm muted">{x.durationHrs} hours · {x.includes.join(', ')}</span></span>
              <b className="whitespace-nowrap">{inr(x.price)}</b>
            </label>
          ))}
          {at === 2 && <>
            <Field label="Your name" error={errs.name}><input value={f.name} onChange={set('name')} className="field" autoComplete="name" aria-invalid={!!errs.name} /></Field>
            <Field label="Hotel or company" optional><input value={f.org} onChange={set('org')} className="field" autoComplete="organization" /></Field>
            <Field label="Mobile number" error={errs.phone} help="We call or WhatsApp you to confirm">
              <div className="flex"><span className="grid place-items-center rounded-l-[14px] border-[1.5px] border-r-0 border-line bg-soft px-3 text-[15px] font-medium">+91</span>
                <input value={f.phone} onChange={(e) => set('phone')({ target: { value: e.target.value.replace(/\D/g, '').slice(0, 10) } })} inputMode="numeric" autoComplete="tel-national" className="field !rounded-l-none" aria-invalid={!!errs.phone} /></div>
            </Field>
            <Field label="Email" optional error={errs.email}><input type="email" value={f.email} onChange={set('email')} className="field" autoComplete="email" /></Field>
            <Field label="Anything we should know?" optional><textarea value={f.notes} onChange={set('notes')} className="field" placeholder="Song requests, sound needs, theme" /></Field>
          </>}
          {at === 3 && <>
            <dl className="divide-y divide-line text-[15px]">
              {[['Singer', s.stageName], ['Package', `${p.name} · ${p.durationHrs} hours`], ['Date', `${new Date(f.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })} at ${f.time}`], ['Venue', f.venue], ['Contact', `${f.name}, +91 ${f.phone}`], ['Total', inr(p.price)], [`Advance (${ADVANCE_PCT}%)`, inr(adv)], ['After the show', inr(p.price - adv)]].map(([a, b]) => (
                <div key={a} className="flex justify-between gap-4 py-2.5"><dt className="muted">{a}</dt><dd className={`text-right font-semibold ${a.startsWith('Advance') ? 'text-green-dark' : ''}`}>{b}</dd></div>
              ))}
            </dl>
            <p className="flex gap-2 rounded-xl bg-soft p-3 text-sm muted"><Lock size={16} className="mt-0.5 shrink-0" /> Nothing is charged now. After we confirm availability you get a secure payment link for the advance.</p>
          </>}
          {errs.form && <p className="err">{errs.form}</p>}
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="wrap flex max-w-2xl gap-3 py-3">
          {at > 0 && <button onClick={() => setAt(at - 1)} className="btn btn-outline">Back</button>}
          <button onClick={next} disabled={busy} className="btn btn-primary flex-1">{busy ? 'Sending…' : at === 3 ? 'Send booking request' : 'Continue'}</button>
        </div>
      </div>
    </div>
  )
}
