import { BadgeIndianRupee, Camera, Check, ShieldCheck, Sparkles, Users } from 'lucide-react'
import { useEffect, useState } from 'react'
import { LoginForm } from '../components/LoginForm'
import { AppBar, Chips, Field } from '../components/ui'
import { PERFORMER_TYPES } from '../data/catalog'
import type { PerformerType } from '../data/types'
import { useAuth } from '../lib/auth'
import { repo } from '../lib/repo'
import { navigate, paths } from '../lib/router'
import { Seo } from '../lib/seo'
import { Header } from '../components/Layout'

const CITIES = ['Shimla', 'Kufri', 'Mashobra', 'Solan', 'Chail', 'Narkanda', 'Chandigarh', 'Other']
export const igHandle = (v: string) => v.trim().replace(/^https?:\/\/(www\.)?instagram\.com\//i, '').replace(/^@/, '').replace(/[/?#].*$/, '')

export default function Join() {
  const { ready, email, isAdmin } = useAuth()
  const [checking, setChecking] = useState(true)
  useEffect(() => {
    if (!ready) return
    if (!email) { setChecking(false); return }
    repo.mine().then((m) => { if (m) navigate(paths.dashboard, true); else setChecking(false) }).catch(() => setChecking(false))
  }, [ready, email])

  const seo = <Seo title="Join as a Singer – Get Gigs in Shimla | LiveSinger Shimla" description="Singers and bands in Shimla: create a free profile, get bookings from hotels, weddings and events, and get paid on time." path={paths.join} />
  if (!ready || (email && checking)) return <><Header />{seo}<p className="py-24 text-center muted">Loading…</p></>
  if (!email) return (
    <><Header />
    <div className="wrap grid gap-8 py-8 md:grid-cols-[1.1fr_1fr] md:py-14">
      {seo}
      <div>
        <span className="badge badge-green">For singers and bands</span>
        <h1 className="mt-3 text-[clamp(28px,4.4vw,46px)] font-extrabold">Get more gigs in Shimla</h1>
        <p className="mt-3 max-w-lg text-[17px] muted">Create your free profile in 2 minutes. Hotels, families and companies book you through LiveSinger Shimla and we handle the payments.</p>
        <ul className="mt-6 grid gap-4">
          {[[Sparkles, 'Your own profile page', 'A shareable page with your photos, stories, prices and reviews.'], [Users, 'Bookings from real clients', 'Hotels, resorts and wedding families across Shimla.'], [BadgeIndianRupee, 'Paid on time', 'Clients pay an advance upfront. Your payout comes after the show.'], [ShieldCheck, 'Free to join', 'We earn a small commission only when you get booked.']].map(([I, t, d]) => (
            <li key={t as string} className="flex gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-mint text-green-dark"><I size={20} /></span><span><b className="block">{t as string}</b><span className="text-[15px] muted">{d as string}</span></span></li>
          ))}
        </ul>
      </div>
      <div className="card h-fit p-6 sm:p-8">
        <h2 className="text-xl font-bold">Start with your email</h2>
        <p className="mt-1 text-sm muted">We send a one-time code. No password needed.</p>
        <div className="mt-5"><LoginForm onDone={() => { /* stays on /join and shows the form */ }} /></div>
      </div>
    </div></>
  )
  return <>{seo}<RegisterForm email={email} isAdmin={isAdmin} /></>
}

function RegisterForm({ email }: { email: string; isAdmin: boolean }) {
  const [f, setF] = useState({ fullName: '', stageName: '', phone: '', whatsappSame: true, whatsapp: '', instagram: '', performerType: 'Solo singer' as PerformerType, city: 'Shimla', agree: false })
  const [photo, setPhoto] = useState<File | null>(null)
  const [errs, setErrs] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => { setF({ ...f, [k]: v }); setErrs({ ...errs, [k]: '' }) }
  const digits = (v: string) => v.replace(/\D/g, '').slice(0, 10)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const x: Record<string, string> = {}
    if (f.fullName.trim().length < 2) x.fullName = 'Enter your full name'
    if (!/^[6-9]\d{9}$/.test(f.phone)) x.phone = 'Enter a valid 10 digit mobile number'
    if (!f.whatsappSame && !/^[6-9]\d{9}$/.test(f.whatsapp)) x.whatsapp = 'Enter a valid WhatsApp number'
    if (!/^[A-Za-z0-9._]{1,30}$/.test(igHandle(f.instagram))) x.instagram = 'Paste your Instagram profile link or @username'
    if (!f.agree) x.agree = 'Please accept to continue'
    setErrs(x)
    if (Object.keys(x).length) { document.querySelector('[aria-invalid="true"]')?.scrollIntoView({ block: 'center', behavior: 'smooth' }); return }
    setBusy(true)
    try {
      await repo.register({ ...f, instagram: igHandle(f.instagram), photo })
      try { sessionStorage.setItem('lss_welcome', '1') } catch { /* ignore */ }
      navigate(paths.dashboard, true)
    } catch (er) { setErrs({ form: (er as Error).message }) } finally { setBusy(false) }
  }
  const preview = photo ? URL.createObjectURL(photo) : ''

  return (
    <div className="min-h-dvh bg-soft pb-28">
      <AppBar title="Create singer profile" back="/" />
      <form onSubmit={submit} className="wrap max-w-xl py-5" noValidate>
        <p className="text-sm font-semibold text-green-dark">Step 1 · Basic details</p>
        <h2 className="mt-1 text-2xl font-bold">Tell us who you are</h2>
        <p className="mt-1 text-[15px] muted">Takes 2 minutes. You can add prices, photos and stories from your dashboard after this.</p>

        <div className="card mt-5 grid gap-5 p-5">
          <label className="flex cursor-pointer items-center gap-4">
            <span className="relative grid size-20 shrink-0 place-items-center overflow-hidden rounded-full border-2 border-dashed border-line bg-soft">
              {preview ? <img src={preview} alt="" className="size-full object-cover" /> : <Camera className="text-muted" />}
            </span>
            <span><b className="block text-[15px]">Profile photo <span className="font-normal muted">(optional)</span></b><span className="text-sm text-green-dark">{photo ? 'Change photo' : 'Add a photo'}</span><span className="block text-xs muted">Profiles with a photo get more bookings</span></span>
            <input type="file" accept="image/*" className="sr-only" onChange={(e) => setPhoto(e.target.files?.[0] ?? null)} />
          </label>

          <Field label="Full name" error={errs.fullName} help="As on your ID. Only our team sees this.">
            <input value={f.fullName} onChange={(e) => set('fullName', e.target.value)} className="field" autoComplete="name" aria-invalid={!!errs.fullName} />
          </Field>
          <Field label="Stage name" optional help="Shown to clients. Leave empty to use your full name.">
            <input value={f.stageName} onChange={(e) => set('stageName', e.target.value)} className="field" placeholder="e.g. Aarav Live" />
          </Field>
          <div><span className="label">You perform as</span><Chips options={PERFORMER_TYPES} value={[f.performerType]} onChange={(v) => set('performerType', v[0])} multi={false} /></div>
        </div>

        <div className="card mt-4 grid gap-5 p-5">
          <Field label="Email"><input value={email} readOnly className="field bg-soft text-muted" /></Field>
          <Field label="Mobile number" error={errs.phone} help="Private. Used by our team only, never shown to clients.">
            <div className="flex"><span className="grid place-items-center rounded-l-[14px] border-[1.5px] border-r-0 border-line bg-soft px-3 text-[15px] font-medium">+91</span>
              <input value={f.phone} onChange={(e) => set('phone', digits(e.target.value))} inputMode="numeric" autoComplete="tel-national" className="field !rounded-l-none" aria-invalid={!!errs.phone} /></div>
          </Field>
          <label className="-mt-2 flex min-h-11 cursor-pointer items-center gap-3 text-[15px]">
            <input type="checkbox" checked={f.whatsappSame} onChange={(e) => set('whatsappSame', e.target.checked)} className="size-5 accent-[#17a34a]" /> Same number on WhatsApp
          </label>
          {!f.whatsappSame && <Field label="WhatsApp number" error={errs.whatsapp}><input value={f.whatsapp} onChange={(e) => set('whatsapp', digits(e.target.value))} inputMode="numeric" className="field" aria-invalid={!!errs.whatsapp} /></Field>}
          <Field label="Instagram profile" error={errs.instagram} help="Paste your profile link or type your @username">
            <input value={f.instagram} onChange={(e) => set('instagram', e.target.value)} className="field" placeholder="instagram.com/yourname" autoCapitalize="off" autoCorrect="off" aria-invalid={!!errs.instagram} />
          </Field>
          <Field label="Based in"><select value={f.city} onChange={(e) => set('city', e.target.value)} className="field">{CITIES.map((c) => <option key={c}>{c}</option>)}</select></Field>
        </div>

        <label className={`card mt-4 flex cursor-pointer gap-3 p-5 text-[15px] ${errs.agree ? '!border-red-300' : ''}`} aria-invalid={!!errs.agree}>
          <input type="checkbox" checked={f.agree} onChange={(e) => set('agree', e.target.checked)} className="mt-0.5 size-5 shrink-0 accent-[#17a34a]" />
          <span>I agree that clients I meet through LiveSinger Shimla will book me only through the platform, and I will not share my direct contact with them. <span className="muted">You will receive the full artist contract after approval.</span>{errs.agree && <span className="err">{errs.agree}</span>}</span>
        </label>
        {errs.form && <p className="err mt-3">{errs.form}</p>}

        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
          <div className="wrap max-w-xl py-3"><button disabled={busy} className="btn btn-primary w-full">{busy ? 'Creating your profile…' : <><Check size={18} /> Create my profile</>}</button></div>
        </div>
      </form>
    </div>
  )
}
