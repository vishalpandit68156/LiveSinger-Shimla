import { demoBookings, demoFeedback, demoPrivate, demoReviews, demoSingers } from '../../data/demo'
import type { Activity, Booking, EmailLog, Feedback, Review, Singer, SingerPrivate } from '../../data/types'
import { compressImage } from '../image'
import { demoSession } from '../session'
import type { Repo } from './types'

// Works with no backend: data lives in this browser (localStorage), seeded with demo singers.
type DB = { singers: Singer[]; priv: SingerPrivate[]; bookings: Booking[]; reviews: Review[]; feedback: Feedback[]; emails: EmailLog[] }
const KEY = 'lss_demo_db_v4'
const seed = (): DB => ({ singers: demoSingers, priv: demoPrivate, bookings: demoBookings, reviews: demoReviews, feedback: demoFeedback, emails: [] })

function load(): DB {
  if (typeof localStorage === 'undefined') return seed()
  try { const v = localStorage.getItem(KEY); if (v) return JSON.parse(v) } catch { /* ignore */ }
  return seed()
}
function save(db: DB) { try { localStorage.setItem(KEY, JSON.stringify(db)) } catch { /* storage full: keep in memory */ } }
const uid = () => Math.random().toString(36).slice(2, 10)
const now = () => new Date().toISOString()
export const slugify = (s: string) => s.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 50) || 'singer'
const wait = (ms = 250) => new Promise((r) => setTimeout(r, ms))

function blobToDataUrl(b: Blob) {
  return new Promise<string>((res) => { const r = new FileReader(); r.onload = () => res(r.result as string); r.readAsDataURL(b) })
}

export const demoRepo: Repo = {
  live: false,
  async publicSingers() { return load().singers.filter((s) => s.status === 'approved' && s.packages.length > 0) }, // no prices = not bookable yet
  async reviews() { return load().reviews },
  async createBooking(b) {
    await wait()
    const db = load()
    const code = 'LS' + new Date().toISOString().slice(2, 4) + new Date().toISOString().slice(5, 7) + '-' + String(Math.floor(Math.random() * 9000) + 1000)
    db.bookings.unshift({ ...b, id: uid(), code, paymentStatus: 'pending', status: 'requested', createdAt: now() })
    save(db)
    return { code }
  },
  trackView(singerId) {
    try { const k = 'lss_viewed_' + singerId; if (sessionStorage.getItem(k)) return; sessionStorage.setItem(k, '1') } catch { return }
    const db = load(); const s = db.singers.find((x) => x.id === singerId); if (s) { s.viewCount = (s.viewCount ?? 0) + 1; save(db) }
  },
  async mine() {
    const s = demoSession.get(); if (!s) return null
    const db = load()
    const priv = db.priv.find((p) => p.email.toLowerCase() === s.email.toLowerCase())
    const singer = priv && db.singers.find((x) => x.id === priv.singerId)
    return singer && priv ? { singer, priv } : null
  },
  async register(b) {
    await wait(400)
    const s = demoSession.get(); if (!s) throw new Error('Please log in first')
    const db = load()
    if (db.priv.some((p) => p.email === s.email)) throw new Error('A profile already exists for this email')
    const id = uid()
    let slug = slugify(b.stageName || b.fullName); let n = 1
    while (db.singers.some((x) => x.slug === slug)) slug = slugify(b.stageName || b.fullName) + '-' + ++n
    const avatar = b.photo ? await blobToDataUrl(await compressImage(b.photo, 500, 0.8)) : ''
    const singer: Singer = { id, slug, stageName: (b.stageName || b.fullName).trim(), performerType: b.performerType, tagline: '', city: b.city || 'Shimla', genres: [], languages: [], eventTypes: [], bio: '', experienceYears: 0, avatar, cover: '', packages: [], gallery: [], stories: [], instagram: b.instagram, rating: 0, reviewCount: 0, gigsDone: 0, verified: false, status: 'pending_review', createdAt: now() }
    db.singers.push(singer)
    db.priv.push({ singerId: id, fullName: b.fullName.trim(), email: s.email, phone: b.phone, whatsapp: b.whatsappSame ? b.phone : b.whatsapp })
    save(db)
    return singer
  },
  async updateMine(patch, priv) {
    await wait()
    const m = await this.mine(); if (!m) throw new Error('No profile')
    const db = load()
    const i = db.singers.findIndex((x) => x.id === m.singer.id)
    const { status: _s, verified: _v, rating: _r, ...safe } = patch // singers cannot approve themselves
    db.singers[i] = { ...db.singers[i], ...safe }
    if (priv) { const j = db.priv.findIndex((p) => p.singerId === m.singer.id); db.priv[j] = { ...db.priv[j], ...priv } }
    save(db)
    return db.singers[i]
  },
  async upload(file, folder) {
    const blob = file.type.startsWith('image/') ? await compressImage(file, folder === 'avatar' ? 500 : 900, 0.78) : file
    if (blob.size > 1.5e6) return URL.createObjectURL(blob) // too big for demo storage: this session only
    return blobToDataUrl(blob)
  },
  async sendFeedback(f) {
    const m = await this.mine()
    const db = load()
    db.feedback.unshift({ id: uid(), singerId: m?.singer.id, from: m?.singer.stageName ?? 'Guest', rating: f.rating, message: f.message, createdAt: now() })
    save(db)
  },
  async myBookings() {
    const m = await this.mine(); if (!m) return []
    const pct = m.priv.commissionPct ?? 20
    return load().bookings.filter((b) => b.singerId === m.singer.id && b.status !== 'requested').map((b) => ({
      id: b.id, code: b.code, eventDate: b.eventDate, startTime: b.startTime, eventType: b.eventType, venue: b.venue, guests: b.guests,
      packageName: m.singer.packages.find((p) => p.id === b.packageId)?.name ?? 'Package', status: b.status, payout: Math.round(b.total * (1 - pct / 100)), paid: b.status === 'completed',
    }))
  },
  async updateBooking(id, patch) { await wait(150); const db = load(); const b = db.bookings.find((x) => x.id === id); if (b) Object.assign(b, patch); save(db) },
  async adminActivity() {
    const db = load(); const name = (id: string) => db.singers.find((s) => s.id === id)?.stageName ?? 'Singer'
    const a: Activity[] = [
      ...db.singers.map((s) => ({ id: 'r' + s.id, kind: 'singer' as const, title: `${s.stageName} registered`, at: s.createdAt, link: '/admin/singer/' + s.id })),
      ...db.singers.filter((s) => s.approvedAt).map((s) => ({ id: 'a' + s.id, kind: 'approved' as const, title: `${s.stageName} approved`, at: s.approvedAt!, link: '/admin/singer/' + s.id })),
      ...db.bookings.map((b) => ({ id: 'b' + b.id, kind: 'booking' as const, title: `Booking request for ${name(b.singerId)} from ${b.contact.org || b.contact.name}`, at: b.createdAt, link: '/admin/bookings' })),
      ...db.feedback.map((f) => ({ id: 'f' + f.id, kind: 'feedback' as const, title: `Feedback from ${f.from}`, at: f.createdAt, link: '/admin/feedback' })),
    ]
    return a.sort((x, y) => y.at.localeCompare(x.at)).slice(0, 12)
  },
  async adminSingers() { const db = load(); return db.singers.map((singer) => ({ singer, priv: db.priv.find((p) => p.singerId === singer.id) ?? null })) },
  async adminSinger(id) {
    const db = load(); const singer = db.singers.find((s) => s.id === id); if (!singer) return null
    return { singer, priv: db.priv.find((p) => p.singerId === id) ?? null, emails: db.emails.filter((e) => e.singerId === id) }
  },
  async setStatus(id, status, note) {
    await wait()
    const db = load(); const s = db.singers.find((x) => x.id === id)!; const p = db.priv.find((x) => x.singerId === id)
    s.status = status; s.adminNote = note || undefined
    if (status === 'approved') {
      s.verified = true; s.approvedAt = now()
      // same as the database trigger: approval email now, contract 24 hours later
      const t = Date.now()
      db.emails.push({ id: uid(), singerId: id, template: 'approval', to: p?.email ?? '', sendAfter: new Date(t).toISOString(), sentAt: new Date(t).toISOString() })
      db.emails.push({ id: uid(), singerId: id, template: 'contract', to: p?.email ?? '', sendAfter: new Date(t + 864e5).toISOString() })
    }
    if (status === 'rejected') db.emails.push({ id: uid(), singerId: id, template: 'rejection', to: p?.email ?? '', sendAfter: now(), sentAt: now() })
    save(db)
  },
  async adminBookings() { return load().bookings },
  async adminFeedback() { return load().feedback },
}
