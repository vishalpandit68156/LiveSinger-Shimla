import type { EventType, Genre, PerformerType } from './types'

export const GENRES: Genre[] = ['Bollywood', 'Sufi', 'Pahari Folk', 'Ghazal', 'Punjabi', 'Acoustic', 'Retro', 'English Pop', 'Devotional', 'Classical']
export const EVENTS: EventType[] = ['Hotel & Resort', 'Wedding', 'Corporate Event', 'Cafe & Restaurant', 'Private Party', 'Festival']
export const PERFORMER_TYPES: PerformerType[] = ['Solo singer', 'Duo', 'Band']
export const ADVANCE_PCT = 30
export const inr = (n: number) => '₹' + Math.round(n).toLocaleString('en-IN')
export const minPrice = (p: { price: number }[]) => (p.length ? Math.min(...p.map((x) => x.price)) : 0)

/** SEO landing pages: /shimla/<slug>. Each targets a search phrase people actually type. */
export interface Landing { slug: string; h1: string; title: string; description: string; intro: string; filter: { genre?: Genre; event?: EventType } }
export const LANDINGS: Landing[] = [
  { slug: 'live-singers', h1: 'Live Singers in Shimla', title: 'Live Singer in Shimla | Book Top Singers for Events', description: 'Book verified live singers in Shimla for hotels, weddings, parties and corporate events. Compare prices, watch performances and book online with a small advance.', intro: 'Every singer on LiveSinger Shimla is verified by our team. Compare prices, see real performance photos and book online. We handle the coordination so your event runs on time.', filter: {} },
  { slug: 'wedding-singers', h1: 'Wedding Singers in Shimla', title: 'Wedding Singer in Shimla | Sangeet, Mehndi & Reception', description: 'Hire wedding singers in Shimla, Kufri and Chail for sangeet, mehndi and reception nights. Bollywood, Punjabi and Sufi singers with sound included.', intro: 'From a soft Sufi set at the mehndi to a full Punjabi band at the sangeet, find a wedding singer in Shimla who fits your function and budget.', filter: { event: 'Wedding' } },
  { slug: 'hotel-live-music', h1: 'Live Music for Hotels in Shimla', title: 'Live Music for Hotels & Resorts in Shimla', description: 'Weekend and nightly live music for hotels, resorts and restaurants in Shimla. Reliable singers, fixed rates and one invoice from the platform.', intro: 'Hotels and resorts in Shimla use LiveSinger Shimla to fill weekend nights with acoustic and Bollywood sets. One contact, fixed rates and a backup singer if plans change.', filter: { event: 'Hotel & Resort' } },
  { slug: 'sufi-singers', h1: 'Sufi Singers in Shimla', title: 'Sufi Singer in Shimla | Sufi Night & Qawwali', description: 'Book Sufi singers in Shimla for Sufi nights, weddings and hotel dinners. Soulful live performances with harmonium, tabla and guitar.', intro: 'Sufi nights are a favourite for winter evenings in Shimla. Browse Sufi singers, listen to their stories and book in minutes.', filter: { genre: 'Sufi' } },
  { slug: 'bollywood-singers', h1: 'Bollywood Singers in Shimla', title: 'Bollywood Singer in Shimla | Live Bollywood Night', description: 'Live Bollywood singers in Shimla for parties, weddings and hotels. Old and new hits, unplugged or full band.', intro: 'Retro classics or the latest chartbusters: these Shimla singers keep the crowd singing along all night.', filter: { genre: 'Bollywood' } },
  { slug: 'pahari-folk-singers', h1: 'Pahari Folk Singers in Shimla', title: 'Pahari Singer in Shimla | Himachali Folk & Naati', description: 'Book Himachali Pahari folk singers in Shimla for weddings, festivals and tourist evenings. Traditional naati and modern Pahari music.', intro: 'Give your guests a real taste of Himachal with Pahari folk and naati performances by local artists.', filter: { genre: 'Pahari Folk' } },
  { slug: 'corporate-event-singers', h1: 'Singers for Corporate Events in Shimla', title: 'Corporate Event Singer in Shimla | Offsites & Conferences', description: 'Professional singers and bands for corporate offsites, conferences and award nights in Shimla. GST invoice available.', intro: 'Planning an offsite in Shimla? Book a professional act for your dinner or award night, with a proper invoice and on-time arrival.', filter: { event: 'Corporate Event' } },
]

export const FAQ = [
  { q: 'How much does a live singer cost in Shimla?', a: 'A solo acoustic singer in Shimla usually starts around ₹8,000 for a 2 hour set. Duos and full bands with sound and lights cost more. Every profile shows fixed package prices, so you know the cost before you book.' },
  { q: 'How do I book a singer?', a: 'Open a singer profile, pick a package and date, and send your booking request. You pay a 30% advance to lock the date and the rest after the performance. You do not need an account to book.' },
  { q: 'Can I contact the singer directly?', a: 'All bookings go through LiveSinger Shimla. This lets us guarantee the performance, arrange a backup if something goes wrong and handle payments safely for both sides.' },
  { q: 'Do singers bring their own sound system?', a: 'Many packages include a sound system. Check the “Includes” list on each package. If you need extra sound or lights, add it in the booking notes.' },
  { q: 'Which areas do you cover?', a: 'Shimla city, Mall Road, Kufri, Mashobra, Naldehra, Chail, Narkanda and nearby hotels and resorts.' },
]
