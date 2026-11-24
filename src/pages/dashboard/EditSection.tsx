import { ImagePlus, Plus, Trash2 } from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import { Photo } from '../../components/Photo'
import { AppBar, Chips, Field } from '../../components/ui'
import { EVENTS, GENRES, PERFORMER_TYPES } from '../../data/catalog'
import type { Media, PricePackage, Singer, SingerPrivate } from '../../data/types'
import { repo } from '../../lib/repo'
import { navigate, paths } from '../../lib/router'
import { Seo } from '../../lib/seo'
import { igHandle } from '../Join'
import { NeedLogin } from './Dashboard'
import { useMine } from './useMine'

const TITLES: Record<string, string> = { basic: 'Basic details', photo: 'Profile photo', about: 'About you', pricing: 'Pricing packages', gallery: 'Photo gallery', stories: 'Stories', payout: 'Payout details' }
const uid = () => Math.random().toString(36).slice(2, 9)

export default function EditSection({ section }: { section: string }) {
  const { loading, singer, priv, email } = useMine()
  if (!loading && !email) return <NeedLogin next={paths.edit(section)} />
  if (loading || !singer || !priv) return <p className="py-24 text-center muted">Loading…</p>
  return <Editor key={section} section={section} s={singer} p={priv} />
}

function Editor({ section, s, p }: { section: string; s: Singer; p: SingerPrivate }) {
  const [d, setD] = useState<Singer>(s)
  const [q, setQ] = useState<SingerPrivate>(p)
  const [busy, setBusy] = useState('')
  const [err, setErr] = useState('')
  const up = <K extends keyof Singer>(k: K, v: Singer[K]) => { setD({ ...d, [k]: v }); setErr('') }
  const uq = <K extends keyof SingerPrivate>(k: K, v: SingerPrivate[K]) => { setQ({ ...q, [k]: v }); setErr('') }

  const uploadMany = async (files: FileList | null, folder: 'gallery' | 'story', key: 'gallery' | 'stories', max: number) => {
    const list = Array.from(files ?? []).slice(0, max - d[key].length)
    const big = list.filter((f) => f.size > 25e6)
    if (big.length) setErr('Files larger than 25 MB were skipped')
    setBusy('Uploading…')
    const out: Media[] = []
    for (const f of list.filter((f) => f.size <= 25e6)) {
      try { out.push({ id: uid(), kind: f.type.startsWith('video/') ? 'video' : 'image', url: await repo.upload(f, folder), caption: folder === 'story' ? 'New' : undefined }) } catch (e) { setErr((e as Error).message) }
    }
    setD((x) => ({ ...x, [key]: [...x[key], ...out] })); setBusy('')
  }

  const validate = () => {
    if (section === 'basic') {
      if (q.fullName.trim().length < 2) return 'Enter your full name'
      if (!/^[6-9]\d{9}$/.test(q.phone)) return 'Enter a valid mobile number'
      if (d.instagram && !/^[A-Za-z0-9._]{1,30}$/.test(d.instagram)) return 'Check your Instagram username'
      if (d.stageName.trim().length < 2) return 'Enter a stage name'
    }
    if (section === 'about') {
      if (/([0-9][ -]?){10}|whats ?app|wa\.me/i.test(d.tagline + ' ' + d.bio)) return 'Please remove phone numbers or WhatsApp from your bio. Clients book through the platform.'
      if (d.bio.trim().length < 40) return 'Write at least a few lines about yourself (40+ characters)'
      if (!d.genres.length) return 'Pick at least one genre'
      if (!d.eventTypes.length) return 'Pick at least one occasion'
    }
    if (section === 'pricing' && d.packages.some((x) => !x.name.trim() || x.price < 1000 || x.durationHrs < 1)) return 'Each package needs a name, hours and a price of at least ₹1,000'
    if (section === 'payout' && q.payoutUpi && !/^[\w.-]{2,}@[a-zA-Z]{2,}$/.test(q.payoutUpi)) return 'Check your UPI ID (example: name@okaxis)'
    return ''
  }
  const save = async () => {
    const e = validate(); if (e) { setErr(e); return }
    setBusy('Saving…')
    try {
      const patch: Partial<Singer> = {}
      const keys: Record<string, (keyof Singer)[]> = { basic: ['stageName', 'performerType', 'instagram', 'city'], photo: ['avatar', 'cover'], about: ['tagline', 'bio', 'genres', 'languages', 'eventTypes', 'experienceYears'], pricing: ['packages'], gallery: ['gallery', 'cover'], stories: ['stories'] }
      for (const k of keys[section] ?? []) (patch as Record<string, unknown>)[k] = d[k]
      if (section === 'gallery' && !d.cover && d.gallery[0]) patch.cover = d.gallery[0].url
      const privKeys: Record<string, (keyof SingerPrivate)[]> = { basic: ['fullName', 'phone', 'whatsapp'], payout: ['payoutUpi', 'idProof'] }
      const pp = privKeys[section] ? Object.fromEntries(privKeys[section].map((k) => [k, q[k]])) as Partial<SingerPrivate> : undefined
      await repo.updateMine(patch, pp)
      navigate('/dashboard/profile')
    } catch (x) { setErr((x as Error).message || 'Could not save. Please try again.') } finally { setBusy('') }
  }

  let body: ReactNode = <p className="muted">Unknown section.</p>
  if (section === 'basic') body = <>
    <Field label="Full name" help="Private, as on your ID"><input className="field" value={q.fullName} onChange={(e) => uq('fullName', e.target.value)} /></Field>
    <Field label="Stage name" help="Shown to clients"><input className="field" value={d.stageName} onChange={(e) => up('stageName', e.target.value)} /></Field>
    <div><span className="label">You perform as</span><Chips options={PERFORMER_TYPES} value={[d.performerType]} onChange={(v) => up('performerType', v[0])} multi={false} /></div>
    <Field label="Mobile number" help="Private"><input className="field" inputMode="numeric" value={q.phone} onChange={(e) => uq('phone', e.target.value.replace(/\D/g, '').slice(0, 10))} /></Field>
    <Field label="WhatsApp number" optional help="Private"><input className="field" inputMode="numeric" value={q.whatsapp ?? ''} onChange={(e) => uq('whatsapp', e.target.value.replace(/\D/g, '').slice(0, 10))} /></Field>
    <Field label="Instagram username"><input className="field" value={d.instagram ?? ''} onChange={(e) => up('instagram', igHandle(e.target.value))} autoCapitalize="off" /></Field>
    <Field label="Based in"><input className="field" value={d.city} onChange={(e) => up('city', e.target.value)} /></Field>
  </>
  if (section === 'photo') body = <>
    <ImagePick label="Profile photo" hint="Square photo of your face works best" url={d.avatar} round onFile={async (f) => { setBusy('Uploading…'); try { up('avatar', await repo.upload(f, 'avatar')) } catch (e) { setErr((e as Error).message) } setBusy('') }} />
    <ImagePick label="Cover photo" hint="A wide photo of you performing" url={d.cover} onFile={async (f) => { setBusy('Uploading…'); try { up('cover', await repo.upload(f, 'gallery')) } catch (e) { setErr((e as Error).message) } setBusy('') }} />
  </>
  if (section === 'about') body = <>
    <Field label="One-line intro" help={`${d.tagline.length}/80 · e.g. "Sufi and Bollywood unplugged for hotel evenings"`}><input className="field" maxLength={80} value={d.tagline} onChange={(e) => up('tagline', e.target.value)} /></Field>
    <Field label="About you" help={`${d.bio.length}/600 · Where you have performed, your style, instruments`}><textarea className="field !min-h-36" maxLength={600} value={d.bio} onChange={(e) => up('bio', e.target.value)} /></Field>
    <div><span className="label">Genres</span><Chips options={GENRES} value={d.genres} onChange={(v) => up('genres', v)} /></div>
    <div><span className="label">Occasions you perform at</span><Chips options={EVENTS} value={d.eventTypes} onChange={(v) => up('eventTypes', v)} /></div>
    <div className="grid grid-cols-2 gap-3">
      <Field label="Languages" help="Comma separated"><input className="field" value={d.languages.join(', ')} onChange={(e) => up('languages', e.target.value.split(',').map((x) => x.trim()).filter(Boolean))} /></Field>
      <Field label="Years performing"><input className="field" inputMode="numeric" value={d.experienceYears || ''} onChange={(e) => up('experienceYears', Number(e.target.value.replace(/\D/g, '').slice(0, 2)) || 0)} /></Field>
    </div>
  </>
  if (section === 'pricing') body = <>
    {d.packages.map((x, i) => {
      const set = (patch: Partial<PricePackage>) => up('packages', d.packages.map((y, j) => (j === i ? { ...y, ...patch } : y)))
      return (
        <div key={x.id} className="grid gap-3 rounded-2xl border border-line p-4">
          <div className="flex items-center justify-between"><b>Package {i + 1}</b><button type="button" onClick={() => up('packages', d.packages.filter((_, j) => j !== i))} className="grid size-10 place-items-center rounded-full text-muted hover:bg-soft" aria-label="Remove package"><Trash2 size={17} /></button></div>
          <Field label="Name"><input className="field" value={x.name} onChange={(e) => set({ name: e.target.value })} placeholder="e.g. Solo acoustic" /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Hours"><input className="field" inputMode="numeric" value={x.durationHrs || ''} onChange={(e) => set({ durationHrs: Number(e.target.value.replace(/\D/g, '')) || 0 })} /></Field>
            <Field label="Price (₹)"><input className="field" inputMode="numeric" value={x.price || ''} onChange={(e) => set({ price: Number(e.target.value.replace(/\D/g, '')) || 0 })} /></Field>
          </div>
          <Field label="What's included" help="Comma separated, e.g. Sound system, Guitarist"><input className="field" value={x.includes.join(', ')} onChange={(e) => set({ includes: e.target.value.split(',').map((y) => y.trimStart()) })} /></Field>
        </div>
      )
    })}
    {d.packages.length < 4 && <button type="button" onClick={() => up('packages', [...d.packages, { id: uid(), name: d.packages.length ? '' : 'Solo acoustic', durationHrs: 2, price: 0, includes: [] }])} className="btn btn-outline"><Plus size={18} /> Add a package</button>}
    <p className="text-sm muted">This is the price clients see. Our commission is explained in your artist contract.</p>
  </>
  if (section === 'gallery' || section === 'stories') {
    const key = section === 'gallery' ? 'gallery' : 'stories'
    const max = section === 'gallery' ? 12 : 10
    body = <>
      <p className="text-sm muted">{section === 'gallery' ? 'Add 3 to 12 photos from real performances. Bright, sharp photos get more bookings.' : 'Short photos or videos from recent gigs. They play like Instagram stories on your page.'}</p>
      <div className="grid grid-cols-3 gap-2">
        {d[key].map((m, i) => (
          <div key={m.id} className="relative overflow-hidden rounded-xl bg-soft">
            {m.kind === 'video' ? <video src={m.url} muted playsInline className="aspect-square w-full object-cover" /> : <Photo src={m.url} alt="" name={m.caption ?? 'Photo'} className="aspect-square w-full" />}
            <button type="button" onClick={() => up(key, d[key].filter((_, j) => j !== i))} className="absolute right-1.5 top-1.5 grid size-8 place-items-center rounded-full bg-white/95 shadow" aria-label="Remove"><Trash2 size={15} /></button>
          </div>
        ))}
        {d[key].length < max && (
          <label className="grid aspect-square cursor-pointer place-items-center rounded-xl border-2 border-dashed border-line text-center text-sm text-muted hover:border-green">
            <span><ImagePlus className="mx-auto mb-1 text-green" />Add</span>
            <input type="file" multiple accept={section === 'gallery' ? 'image/*' : 'image/*,video/*'} className="sr-only" onChange={(e) => { uploadMany(e.target.files, section === 'gallery' ? 'gallery' : 'story', key, max); e.target.value = '' }} />
          </label>
        )}
      </div>
      {section === 'stories' && d.stories.length > 0 && <div className="grid gap-2">{d.stories.map((m, i) => <Field key={m.id} label={`Story ${i + 1} title`}><input className="field" maxLength={24} value={m.caption ?? ''} onChange={(e) => up('stories', d.stories.map((y, j) => (j === i ? { ...y, caption: e.target.value } : y)))} /></Field>)}</div>}
    </>
  }
  if (section === 'payout') body = <>
    <Field label="UPI ID" help="Your payment for each show is sent here. Private."><input className="field" value={q.payoutUpi ?? ''} onChange={(e) => uq('payoutUpi', e.target.value.trim())} placeholder="name@okaxis" autoCapitalize="off" /></Field>
    <label className="flex min-h-16 cursor-pointer items-center gap-3 rounded-2xl border-2 border-dashed border-line p-4 hover:border-green">
      <ImagePlus className="shrink-0 text-green" />
      <span className="text-[15px]"><b className="block">ID proof</b><span className="text-sm muted">{q.idProof ? 'Uploaded. Tap to replace.' : 'Aadhaar, driving licence or voter ID. Needed for the contract. Private.'}</span></span>
      <input type="file" accept="image/*,application/pdf" className="sr-only" onChange={async (e) => { const f = e.target.files?.[0]; if (!f) return; setBusy('Uploading…'); try { uq('idProof', await repo.upload(f, 'id')) } catch (x) { setErr((x as Error).message) } setBusy('') }} />
    </label>
  </>

  return (
    <div className="min-h-dvh bg-soft pb-28">
      <Seo title={`${TITLES[section] ?? 'Edit'} – LiveSinger Shimla`} description="Edit your singer profile" path={paths.edit(section)} noindex />
      <AppBar title={TITLES[section] ?? 'Edit profile'} back="/dashboard/profile" />
      <div className="wrap max-w-xl py-5"><div className="card sheet-in grid gap-5 p-5">{body}{err && <p className="err" role="alert">{err}</p>}</div></div>
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="wrap flex max-w-xl gap-3 py-3"><button onClick={() => navigate('/dashboard/profile')} className="btn btn-outline">Cancel</button><button onClick={save} disabled={!!busy} className="btn btn-primary flex-1">{busy || 'Save'}</button></div>
      </div>
    </div>
  )
}

function ImagePick({ label, hint, url, round, onFile }: { label: string; hint: string; url: string; round?: boolean; onFile: (f: File) => void }) {
  const [local, setLocal] = useState('')
  useEffect(() => () => { if (local) URL.revokeObjectURL(local) }, [local])
  return (
    <label className="flex cursor-pointer items-center gap-4">
      <span className={`grid shrink-0 place-items-center overflow-hidden border-2 border-dashed border-line bg-soft ${round ? 'size-24 rounded-full' : 'aspect-[16/9] w-40 rounded-xl'}`}>
        {local || url ? <img src={local || url} alt="" className="size-full object-cover" /> : <ImagePlus className="text-muted" />}
      </span>
      <span><b className="block">{label}</b><span className="text-sm muted">{hint}</span><span className="block text-sm font-semibold text-green-dark">{url ? 'Change' : 'Upload'}</span></span>
      <input type="file" accept="image/*" className="sr-only" onChange={(e) => { const f = e.target.files?.[0]; if (f) { setLocal(URL.createObjectURL(f)); onFile(f) } }} />
    </label>
  )
}
