import type { Booking, Feedback, Review, Singer, SingerPrivate } from './types'

// Demo content so every page looks complete before real singers join.
const u = (id: string, w = 900) => `https://images.unsplash.com/${id}?w=${w}&q=72&auto=format&fit=crop`
const P = ['photo-1516280440614-37939bbacd81', 'photo-1501386761578-eac5c94b800a', 'photo-1493225457124-a3eb161ffa5f', 'photo-1511671782779-c97d3d27a1d4', 'photo-1524368535928-5b5e00ddc76b', 'photo-1470225620780-dba8ba36b745', 'photo-1508700115892-45ecd05ae2ad', 'photo-1514525253161-7a46d19cd819']
const pic = (i: number, w?: number) => u(P[i % P.length], w)

const packages = (base: number, band = false) => band
  ? [
      { id: 'p1', name: 'Acoustic trio', durationHrs: 2, price: base, includes: ['Vocals, guitar, cajon', 'Sound system'] },
      { id: 'p2', name: 'Full band night', durationHrs: 3, price: Math.round(base * 1.8), includes: ['5 piece band', 'Pro sound and lights', 'Song requests'] },
    ]
  : [
      { id: 'p1', name: 'Solo acoustic', durationHrs: 2, price: base, includes: ['Vocals and guitar', 'Basic sound system'] },
      { id: 'p2', name: 'Evening duo', durationHrs: 3, price: Math.round(base * 1.65), includes: ['Vocals with keyboard or cajon', 'Sound system', 'Song requests'] },
      { id: 'p3', name: 'Wedding special', durationHrs: 4, price: Math.round(base * 2.6), includes: ['Singer with 3 musicians', 'Pro sound and lights', 'Custom setlist'] },
    ]

const gallery = (o: number) => ['Hotel lounge evening', 'Wedding sangeet', 'Mall Road cafe', 'Winter festival stage', 'Rooftop dinner set', 'New Year night'].map((caption, i) => ({ id: `g${o}${i}`, kind: 'image' as const, url: pic(o + i, 800), caption }))
const stories = (o: number) => ['Last night', 'Soundcheck', 'Crowd favourite', 'Backstage'].map((caption, i) => ({ id: `s${o}${i}`, kind: 'image' as const, url: pic(o + i * 3, 720), caption }))

type Seed = Pick<Singer, 'id' | 'slug' | 'stageName' | 'performerType' | 'tagline' | 'genres' | 'languages' | 'eventTypes' | 'bio' | 'experienceYears' | 'rating' | 'reviewCount' | 'gigsDone' | 'instagram'> & { base: number; o: number }

const seeds: Seed[] = [
  { id: 'd1', slug: 'aarav-rana', stageName: 'Aarav Rana', performerType: 'Solo singer', tagline: 'Sufi and Bollywood unplugged for calm mountain evenings', genres: ['Sufi', 'Bollywood', 'Acoustic'], languages: ['Hindi', 'Punjabi', 'Urdu'], eventTypes: ['Hotel & Resort', 'Wedding', 'Cafe & Restaurant'], bio: 'Aarav has performed at hotels and cafes across Shimla for eight years. His sets move from soft Sufi for dinner to sing-along Bollywood once the crowd warms up. He plays guitar and harmonium and brings his own sound for smaller venues.', experienceYears: 8, rating: 4.9, reviewCount: 46, gigsDone: 310, instagram: 'aarav.live', base: 12000, o: 0 },
  { id: 'd2', slug: 'meher-thakur', stageName: 'Meher Thakur', performerType: 'Solo singer', tagline: 'Ghazals and retro classics for elegant dinners', genres: ['Ghazal', 'Retro', 'Classical'], languages: ['Hindi', 'Urdu'], eventTypes: ['Hotel & Resort', 'Corporate Event', 'Private Party'], bio: 'Classically trained in Hindustani vocals, Meher performs ghazals and golden-era Bollywood with a keyboard and tabla player. A favourite for fine-dining nights and anniversary dinners.', experienceYears: 6, rating: 4.8, reviewCount: 32, gigsDone: 180, instagram: 'meher.sings', base: 15000, o: 2 },
  { id: 'd3', slug: 'kabir-negi', stageName: 'Kabir Negi', performerType: 'Solo singer', tagline: 'Pahari folk and naati with a modern twist', genres: ['Pahari Folk', 'Punjabi', 'Acoustic'], languages: ['Pahari', 'Hindi', 'Punjabi'], eventTypes: ['Festival', 'Wedding', 'Hotel & Resort'], bio: 'Born in Rampur, Kabir mixes traditional Himachali folk with acoustic guitar. Tourists love his naati sets and families book him for weddings that want a local touch.', experienceYears: 5, rating: 4.7, reviewCount: 28, gigsDone: 140, instagram: 'kabir.pahadi', base: 10000, o: 4 },
  { id: 'd4', slug: 'zoya-kapoor', stageName: 'Zoya Kapoor', performerType: 'Solo singer', tagline: 'English pop and acoustic mashups', genres: ['English Pop', 'Acoustic', 'Bollywood'], languages: ['English', 'Hindi'], eventTypes: ['Cafe & Restaurant', 'Corporate Event', 'Private Party'], bio: 'Zoya is a regular at Mall Road cafes with her loop pedal and guitar. Her English and Hindi mashups suit relaxed brunches, rooftop dinners and corporate mixers.', experienceYears: 4, rating: 4.9, reviewCount: 21, gigsDone: 95, instagram: 'zoya.covers', base: 9000, o: 6 },
  { id: 'd5', slug: 'the-ridge-band', stageName: 'The Ridge Band', performerType: 'Band', tagline: 'Five-piece band for weddings and big nights', genres: ['Bollywood', 'Punjabi', 'Retro'], languages: ['Hindi', 'Punjabi'], eventTypes: ['Wedding', 'Festival', 'Corporate Event'], bio: 'A five-piece live band with full sound and lighting. The Ridge Band plays sangeets, New Year parties and corporate award nights across Shimla, Kufri and Chail.', experienceYears: 10, rating: 4.8, reviewCount: 58, gigsDone: 420, instagram: 'theridgeband', base: 25000, o: 1 },
  { id: 'd6', slug: 'ishita-sharma', stageName: 'Ishita Sharma', performerType: 'Solo singer', tagline: 'Bhajans, kirtan and soulful Sufi', genres: ['Devotional', 'Sufi', 'Classical'], languages: ['Hindi', 'Sanskrit'], eventTypes: ['Private Party', 'Wedding', 'Festival'], bio: 'Ishita sings bhajans, kirtan and Sufi for jagratas, path, griha pravesh and wedding rituals. Calm, respectful performances with harmonium and dholak.', experienceYears: 7, rating: 5.0, reviewCount: 17, gigsDone: 120, instagram: 'ishita.bhakti', base: 8000, o: 3 },
  { id: 'd7', slug: 'rohit-and-sana', stageName: 'Rohit & Sana', performerType: 'Duo', tagline: 'Romantic duets for weddings and couples', genres: ['Bollywood', 'Acoustic', 'Retro'], languages: ['Hindi', 'English'], eventTypes: ['Wedding', 'Hotel & Resort', 'Private Party'], bio: 'A singing duo known for romantic Bollywood duets. Popular for honeymoon dinners at Shimla resorts, proposals and intimate wedding functions.', experienceYears: 5, rating: 4.8, reviewCount: 24, gigsDone: 150, instagram: 'rohitsana.music', base: 14000, o: 5 },
  { id: 'd8', slug: 'devraj-qawwal', stageName: 'Devraj Qawwal', performerType: 'Band', tagline: 'Qawwali nights with a full ensemble', genres: ['Sufi', 'Classical', 'Devotional'], languages: ['Urdu', 'Hindi', 'Punjabi'], eventTypes: ['Wedding', 'Hotel & Resort', 'Festival'], bio: 'A seven-member qawwali party with harmonium, tabla and chorus. Their high-energy Sufi nights are booked for winter festivals and grand wedding evenings.', experienceYears: 12, rating: 4.9, reviewCount: 39, gigsDone: 260, instagram: 'devraj.qawwal', base: 30000, o: 7 },
]

const make = (s: Seed, i: number): Singer => ({
  id: s.id, slug: s.slug, stageName: s.stageName, performerType: s.performerType, tagline: s.tagline, city: 'Shimla',
  genres: s.genres, languages: s.languages, eventTypes: s.eventTypes, bio: s.bio, experienceYears: s.experienceYears,
  avatar: pic(s.o, 400), cover: pic(s.o + 1, 1200), packages: packages(s.base, s.performerType === 'Band'),
  gallery: gallery(s.o), stories: stories(s.o), instagram: s.instagram, rating: s.rating, reviewCount: s.reviewCount, gigsDone: s.gigsDone,
  viewCount: 180 + s.reviewCount * 9, verified: true, status: 'approved', createdAt: `2026-0${(i % 8) + 1}-12T10:00:00Z`, approvedAt: `2026-0${(i % 8) + 1}-13T10:00:00Z`,
})

export const demoSingers: Singer[] = [
  ...seeds.map(make),
  // two fresh registrations waiting for admin review
  { id: 'd9', slug: 'tanya-verma', stageName: 'Tanya Verma', performerType: 'Solo singer', tagline: '', city: 'Shimla', genres: ['Bollywood'], languages: ['Hindi'], eventTypes: [], bio: '', experienceYears: 0, avatar: pic(2, 400), cover: '', packages: [], gallery: [], stories: [], instagram: 'tanya.sings', rating: 0, reviewCount: 0, gigsDone: 0, viewCount: 0, verified: false, status: 'pending_review', createdAt: '2026-11-22T15:20:00Z' },
  { id: 'd10', slug: 'mountain-strings', stageName: 'Mountain Strings', performerType: 'Band', tagline: 'Acoustic band from Solan', city: 'Solan', genres: ['Acoustic', 'Retro'], languages: ['Hindi', 'English'], eventTypes: ['Cafe & Restaurant'], bio: 'Three friends playing acoustic covers since 2019.', experienceYears: 5, avatar: pic(4, 400), cover: pic(5, 1200), packages: packages(11000, true), gallery: gallery(4).slice(0, 3), stories: [], instagram: 'mountainstrings', rating: 0, reviewCount: 0, gigsDone: 0, viewCount: 0, verified: false, status: 'pending_review', createdAt: '2026-11-23T09:05:00Z' },
]

export const demoPrivate: SingerPrivate[] = demoSingers.map((s, i) => ({
  singerId: s.id, fullName: s.performerType === 'Band' ? `${s.stageName} (manager)` : s.stageName, email: `${s.slug.split('-')[0]}@example.com`,
  phone: `98160${String(10000 + i * 731).slice(0, 5)}`, whatsapp: undefined, payoutUpi: i < 8 ? `${s.slug.split('-')[0]}@upi` : undefined,
  contractSignedAt: i < 8 ? '2026-06-01T10:00:00Z' : undefined,
}))

const reviewText = [
  ['Front office manager', 'Hill-view hotel, Mall Road', 'Our guests loved the evening. The singer arrived on time, the sound was clean and the booking was handled smoothly.'],
  ['Wedding host', 'Private wedding, Kufri', 'The sangeet night was a hit. They took song requests and kept the elders and the young crowd happy.'],
  ['Cafe owner', 'Cafe near The Ridge', 'Our weekend footfall clearly went up. We have booked again for December.'],
]
export const demoReviews: Review[] = seeds.flatMap((s, i) => reviewText.map(([author, org, text], j) => ({ id: `${s.id}r${j}`, singerId: s.id, author, org, text, rating: (i + j) % 4 === 3 ? 4 : 5, date: `2026-1${j % 2}-0${j + 2}` })))

const bk = (id: string, singerId: string, packageId: string, eventDate: string, startTime: string, eventType: Booking['eventType'], venue: string, guests: number, name: string, org: string, total: number, paymentStatus: Booking['paymentStatus'], status: Booking['status'], createdAt: string): Booking =>
  ({ id, code: 'LS' + createdAt.slice(2, 4) + createdAt.slice(5, 7) + '-' + (4000 + id.length * 137 + total % 997), singerId, packageId, eventDate, startTime, eventType, venue, guests, contact: { name, org, phone: '98160' + String(10000 + total % 89999).slice(0, 5), email: 'client@example.com' }, total, advancePct: 30, advanceAmount: Math.round(total * 0.3), paymentStatus, status, createdAt })

export const demoBookings: Booking[] = [
  bk('b1', 'd1', 'p2', '2026-12-24', '20:00', 'Hotel & Resort', 'Hotel on Mall Road', 80, 'Rakesh', 'Hill-view hotel', 19800, 'paid', 'confirmed', '2026-11-20T11:00:00Z'),
  bk('b2', 'd5', 'p2', '2026-12-31', '21:00', 'Festival', 'Resort, Kufri', 250, 'Neha', 'Snow-peak resort', 45000, 'pending', 'requested', '2026-11-23T18:40:00Z'),
  bk('b3', 'd1', 'p1', '2026-12-06', '19:30', 'Cafe & Restaurant', 'Cafe near The Ridge', 40, 'Simran', 'Ridge cafe', 12000, 'pending', 'requested', '2026-11-23T09:10:00Z'),
  bk('b4', 'd1', 'p3', '2026-11-08', '18:00', 'Wedding', 'Private estate, Mashobra', 180, 'Ankit', '', 31200, 'paid', 'completed', '2026-10-12T15:00:00Z'),
  bk('b5', 'd1', 'p1', '2026-10-19', '20:00', 'Hotel & Resort', 'Resort, Naldehra', 60, 'Pooja', 'Pine resort', 12000, 'paid', 'completed', '2026-09-30T10:00:00Z'),
  bk('b6', 'd2', 'p2', '2026-12-14', '20:30', 'Corporate Event', 'Hotel, Chakkar', 120, 'Vikram', 'Tech offsite', 24750, 'paid', 'confirmed', '2026-11-18T12:00:00Z'),
  bk('b7', 'd8', 'p2', '2026-12-20', '19:00', 'Wedding', 'Palace hotel, Chail', 300, 'Harpreet', '', 54000, 'pending', 'requested', '2026-11-24T02:30:00Z'),
  bk('b8', 'd4', 'p1', '2026-11-15', '13:00', 'Cafe & Restaurant', 'Mall Road cafe', 50, 'Aman', 'Brew house', 9000, 'paid', 'completed', '2026-11-01T09:00:00Z'),
  bk('b9', 'd3', 'p1', '2026-11-29', '19:00', 'Private Party', 'Homestay, Kufri', 30, 'Ritika', '', 10000, 'refunded', 'cancelled', '2026-11-10T09:00:00Z'),
]

export const demoFeedback: Feedback[] = [
  { id: 'f1', singerId: 'd3', from: 'Kabir Negi', rating: 5, message: 'Signing up was quick. Please add a calendar to block my busy dates.', createdAt: '2026-11-21T08:00:00Z' },
]
