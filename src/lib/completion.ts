import type { Singer, SingerPrivate } from '../data/types'

export type Section = { key: string; title: string; hint: string; weight: number; done: boolean }

/** Registration gives 40% (50% with a photo). Each section adds the rest. */
export function completion(s: Singer, p: SingerPrivate | null) {
  const sections: Section[] = [
    { key: 'basic', title: 'Basic details', hint: 'Name, phone, Instagram', weight: 40, done: !!(p?.fullName && p?.phone) },
    { key: 'photo', title: 'Profile photo', hint: 'A clear photo of you performing', weight: 10, done: !!s.avatar },
    { key: 'about', title: 'About you', hint: 'Short intro, genres, languages, events', weight: 15, done: s.bio.length >= 40 && s.genres.length > 0 && s.eventTypes.length > 0 },
    { key: 'pricing', title: 'Pricing packages', hint: 'At least one package with price', weight: 15, done: s.packages.length > 0 },
    { key: 'gallery', title: 'Photo gallery', hint: 'Add 3 or more performance photos', weight: 10, done: s.gallery.length >= 3 },
    { key: 'stories', title: 'Stories', hint: 'Short clips or photos from recent gigs', weight: 5, done: s.stories.length > 0 },
    { key: 'payout', title: 'Payout details', hint: 'UPI ID and ID proof for payments', weight: 5, done: !!p?.payoutUpi },
  ]
  const pct = sections.reduce((a, x) => a + (x.done ? x.weight : 0), 0)
  return { pct, sections }
}
