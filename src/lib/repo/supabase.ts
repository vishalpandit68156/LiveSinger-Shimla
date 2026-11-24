import type { Activity, Booking, Feedback, Review, Singer, SingerBooking, SingerPrivate } from '../../data/types'
import { compressImage } from '../image'
import { sb } from '../supabase'
import { slugify } from './demo'
import type { Repo } from './types'

type Row = Record<string, any> // eslint-disable-line @typescript-eslint/no-explicit-any
const SEL = '*, packages(*), media(*)'

export const toSinger = (r: Row): Singer => {
  const m = ((r.media ?? []) as Row[]).sort((a, b) => a.sort - b.sort)
  const media = (pl: string) => m.filter((x) => x.placement === pl).map((x) => ({ id: x.id, kind: x.kind, url: x.url, caption: x.caption ?? undefined }))
  return {
    id: r.id, userId: r.user_id, slug: r.slug, stageName: r.stage_name, performerType: r.performer_type ?? 'Solo singer', tagline: r.tagline ?? '', city: r.city ?? 'Shimla',
    genres: r.genres ?? [], languages: r.languages ?? [], eventTypes: r.event_types ?? [], bio: r.bio ?? '', experienceYears: r.experience_years ?? 0,
    avatar: r.avatar_url ?? '', cover: r.cover_url ?? '',
    packages: ((r.packages ?? []) as Row[]).sort((a, b) => a.sort - b.sort).map((p) => ({ id: p.id, name: p.name, durationHrs: p.duration_hrs, price: p.price, includes: p.includes ?? [] })),
    gallery: media('gallery'), stories: media('story'), instagram: r.instagram ?? undefined, youtube: r.youtube ?? undefined,
    rating: Number(r.rating ?? 0), reviewCount: r.review_count ?? 0, gigsDone: r.gigs_done ?? 0, viewCount: r.view_count ?? 0, verified: !!r.verified, status: r.status,
    createdAt: r.created_at, approvedAt: r.approved_at ?? undefined, adminNote: r.admin_note ?? undefined,
  }
}
const toPriv = (p: Row | null | undefined): SingerPrivate | null => p ? ({ singerId: p.singer_id, fullName: p.full_name, email: p.email, phone: p.phone, whatsapp: p.whatsapp ?? undefined, payoutUpi: p.payout_upi ?? undefined, idProof: p.id_proof_path ?? undefined, contractSignedAt: p.contract_signed_at ?? undefined, commissionPct: p.commission_pct ?? undefined }) : null
const one = <T,>(x: T | T[] | null | undefined) => (Array.isArray(x) ? x[0] : x) ?? null
const must = <T,>(r: { data: T; error: unknown }) => { if (r.error) throw r.error; return r.data }

async function userId() { const { data } = await sb!.auth.getUser(); if (!data.user) throw new Error('Please log in first'); return data.user }

export const supabaseRepo: Repo = {
  live: true,
  async publicSingers() { return (must(await sb!.from('singers').select(SEL).eq('status', 'approved').order('rating', { ascending: false })) as Row[]).map(toSinger).filter((s) => s.packages.length > 0) },
  async reviews() {
    return (must(await sb!.from('reviews').select('*').eq('approved', true).order('created_at', { ascending: false }).limit(500)) as Row[])
      .map((r): Review => ({ id: r.id, singerId: r.singer_id, author: r.author, org: r.org, rating: r.rating, text: r.text, date: r.created_at }))
  },
  async createBooking(b) {
    const code = 'LS' + new Date().toISOString().slice(2, 7).replace('-', '') + '-' + String(Math.floor(Math.random() * 9000) + 1000)
    // no .select(): the public can create bookings but never read them
    must(await sb!.from('bookings').insert({ code, singer_id: b.singerId, package_id: b.packageId, event_date: b.eventDate, start_time: b.startTime, event_type: b.eventType, venue: b.venue, guests: b.guests, notes: b.notes, contact: b.contact, total: b.total, advance_pct: b.advancePct, advance_amount: b.advanceAmount }))
    return { code }
  },
  trackView(singerId) {
    try { const k = 'lss_viewed_' + singerId; if (sessionStorage.getItem(k)) return; sessionStorage.setItem(k, '1') } catch { return }
    sb!.rpc('bump_view', { sid: singerId }).then(() => {})
  },
  async mine() {
    const u = await userId()
    const r = must(await sb!.from('singers').select(SEL + ', singer_private(*)').eq('user_id', u.id).maybeSingle()) as Row | null
    if (!r) return null
    return { singer: toSinger(r), priv: toPriv(one(r.singer_private))! }
  },
  async register(b) {
    const u = await userId()
    const avatar = b.photo ? await this.upload(b.photo, 'avatar') : null
    const r = must(await sb!.from('singers').insert({ user_id: u.id, slug: slugify(b.stageName || b.fullName), stage_name: (b.stageName || b.fullName).trim(), performer_type: b.performerType, city: b.city || 'Shimla', instagram: b.instagram || null, avatar_url: avatar }).select(SEL).single()) as Row
    must(await sb!.from('singer_private').insert({ singer_id: r.id, full_name: b.fullName.trim(), email: u.email, phone: b.phone, whatsapp: b.whatsappSame ? b.phone : b.whatsapp || null }))
    return toSinger(r)
  },
  async updateMine(patch, priv) {
    const m = await this.mine(); if (!m) throw new Error('No profile yet')
    const id = m.singer.id
    const row: Row = {}
    const map: [keyof Singer, string][] = [['stageName', 'stage_name'], ['performerType', 'performer_type'], ['tagline', 'tagline'], ['city', 'city'], ['genres', 'genres'], ['languages', 'languages'], ['eventTypes', 'event_types'], ['bio', 'bio'], ['experienceYears', 'experience_years'], ['avatar', 'avatar_url'], ['cover', 'cover_url'], ['instagram', 'instagram'], ['youtube', 'youtube']]
    for (const [k, col] of map) if (k in patch) row[col] = patch[k] === '' ? null : patch[k]
    if (Object.keys(row).length) must(await sb!.from('singers').update(row).eq('id', id))
    if (patch.packages) {
      must(await sb!.from('packages').delete().eq('singer_id', id))
      if (patch.packages.length) must(await sb!.from('packages').insert(patch.packages.map((p, i) => ({ singer_id: id, name: p.name, duration_hrs: p.durationHrs, price: p.price, includes: p.includes, sort: i }))))
    }
    for (const [key, placement] of [['gallery', 'gallery'], ['stories', 'story']] as const) {
      const list = patch[key]; if (!list) continue
      must(await sb!.from('media').delete().eq('singer_id', id).eq('placement', placement))
      if (list.length) must(await sb!.from('media').insert(list.map((x, i) => ({ singer_id: id, kind: x.kind, placement, url: x.url, path: x.url.split('/singer-media/')[1] ?? x.url, caption: x.caption ?? null, sort: i }))))
    }
    if (priv) {
      const pr: Row = {}
      if (priv.fullName !== undefined) pr.full_name = priv.fullName
      if (priv.phone !== undefined) pr.phone = priv.phone
      if (priv.whatsapp !== undefined) pr.whatsapp = priv.whatsapp || null
      if (priv.payoutUpi !== undefined) pr.payout_upi = priv.payoutUpi || null
      if (priv.idProof !== undefined) pr.id_proof_path = priv.idProof
      must(await sb!.from('singer_private').update(pr).eq('singer_id', id))
    }
    return (await this.mine())!.singer
  },
  async upload(file, folder) {
    const u = await userId()
    const isImg = file.type.startsWith('image/')
    const body = isImg ? await compressImage(file, folder === 'avatar' ? 600 : 1600) : file
    const bucket = folder === 'id' ? 'singer-private' : 'singer-media'
    const ext = body.type === 'image/webp' ? 'webp' : (file.name.split('.').pop() || 'bin').toLowerCase()
    const path = `${u.id}/${folder}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${ext}`
    must(await sb!.storage.from(bucket).upload(path, body, { contentType: body.type || file.type, cacheControl: '31536000' }))
    return bucket === 'singer-private' ? path : sb!.storage.from(bucket).getPublicUrl(path).data.publicUrl
  },
  async sendFeedback(f) {
    const m = await this.mine().catch(() => null)
    must(await sb!.from('feedback').insert({ singer_id: m?.singer.id ?? null, from_name: m?.singer.stageName ?? 'Guest', rating: f.rating, message: f.message }))
  },
  async myBookings() {
    return (must(await sb!.rpc('my_bookings')) as Row[]).map((r): SingerBooking => ({ id: r.id, code: r.code, eventDate: r.event_date, startTime: r.start_time, eventType: r.event_type, venue: r.venue, guests: r.guests ?? 0, packageName: r.package_name ?? 'Package', status: r.status, payout: r.payout, paid: r.status === 'completed' }))
  },
  async updateBooking(id, patch) {
    const row: Row = {}
    if (patch.status) row.status = patch.status
    if (patch.paymentStatus) row.payment_status = patch.paymentStatus
    must(await sb!.from('bookings').update(row).eq('id', id))
  },
  async adminActivity() {
    const rows = must(await sb!.from('admin_notifications').select('*').order('created_at', { ascending: false }).limit(12)) as Row[]
    const kind: Record<string, Activity['kind']> = { new_singer: 'singer', resubmitted: 'singer', new_booking: 'booking', feedback: 'feedback' }
    return rows.map((r) => ({ id: r.id, kind: kind[r.type] ?? 'singer', title: r.title, at: r.created_at, link: r.type === 'new_booking' ? '/admin/bookings' : r.ref_id ? '/admin/singer/' + r.ref_id : undefined }))
  },
  async adminSingers() {
    return (must(await sb!.from('singers').select(SEL + ', singer_private(*)').order('created_at', { ascending: false })) as Row[]).map((r) => ({ singer: toSinger(r), priv: toPriv(one(r.singer_private)) }))
  },
  async adminSinger(id) {
    const r = must(await sb!.from('singers').select(SEL + ', singer_private(*)').eq('id', id).maybeSingle()) as Row | null
    if (!r) return null
    const emails = must(await sb!.from('email_queue').select('*').eq('singer_id', id).order('send_after')) as Row[]
    return { singer: toSinger(r), priv: toPriv(one(r.singer_private)), emails: emails.map((e) => ({ id: e.id, singerId: e.singer_id, template: e.template, to: e.to_email, sendAfter: e.send_after, sentAt: e.sent_at ?? undefined })) }
  },
  async setStatus(id, status, note) { must(await sb!.from('singers').update({ status, admin_note: note || null, verified: status === 'approved' }).eq('id', id)) },
  async adminBookings() {
    return (must(await sb!.from('bookings').select('*').order('created_at', { ascending: false }).limit(300)) as Row[]).map((r): Booking => ({
      id: r.id, code: r.code, singerId: r.singer_id, packageId: r.package_id, eventDate: r.event_date, startTime: r.start_time, eventType: r.event_type, venue: r.venue, guests: r.guests, notes: r.notes,
      contact: r.contact, total: r.total, advancePct: r.advance_pct, advanceAmount: r.advance_amount, paymentStatus: r.payment_status, status: r.status, createdAt: r.created_at,
    }))
  },
  async adminFeedback() {
    return (must(await sb!.from('feedback').select('*').order('created_at', { ascending: false }).limit(300)) as Row[]).map((r): Feedback => ({ id: r.id, singerId: r.singer_id ?? undefined, from: r.from_name, rating: r.rating, message: r.message, createdAt: r.created_at }))
  },
}
