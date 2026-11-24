/**
 * LiveSinger Shimla data model.
 * Rule: a singer's contact details live only in SingerPrivate, which public pages never read.
 * Clients (hotels, families, companies) always book through the platform.
 */

export type Genre = 'Bollywood' | 'Sufi' | 'Pahari Folk' | 'Ghazal' | 'Punjabi' | 'Acoustic' | 'Retro' | 'English Pop' | 'Devotional' | 'Classical'
export type EventType = 'Hotel & Resort' | 'Wedding' | 'Corporate Event' | 'Cafe & Restaurant' | 'Private Party' | 'Festival'
export type PerformerType = 'Solo singer' | 'Duo' | 'Band'
export type SingerStatus = 'pending_review' | 'approved' | 'rejected' | 'suspended'

export interface PricePackage { id: string; name: string; durationHrs: number; price: number; includes: string[] }
export interface Media { id: string; kind: 'image' | 'video'; url: string; caption?: string }

export interface Singer {
  id: string
  userId?: string
  slug: string
  stageName: string
  performerType: PerformerType
  tagline: string
  city: string
  genres: Genre[]
  languages: string[]
  eventTypes: EventType[]
  bio: string
  experienceYears: number
  avatar: string
  cover: string
  packages: PricePackage[]
  gallery: Media[]
  stories: Media[]
  instagram?: string
  youtube?: string
  rating: number
  reviewCount: number
  gigsDone: number
  viewCount?: number
  verified: boolean
  status: SingerStatus
  createdAt: string
  approvedAt?: string
  adminNote?: string
}

/** Admin + owner only. Never shown on public pages. */
export interface SingerPrivate {
  singerId: string
  fullName: string
  email: string
  phone: string
  whatsapp?: string
  payoutUpi?: string
  idProof?: string
  contractSignedAt?: string
  commissionPct?: number
}

export interface Booking {
  id: string
  code: string
  singerId: string
  packageId: string
  eventDate: string
  startTime: string
  eventType: EventType
  venue: string
  guests: number
  notes?: string
  contact: { name: string; org: string; phone: string; email: string }
  total: number
  advancePct: number
  advanceAmount: number
  paymentStatus: 'pending' | 'paid' | 'refunded'
  status: 'requested' | 'confirmed' | 'completed' | 'cancelled'
  createdAt: string
}

export interface Review { id: string; singerId: string; author: string; org: string; rating: number; text: string; date: string }
export interface Feedback { id: string; singerId?: string; from: string; rating: number; message: string; createdAt: string }
export interface EmailLog { id: string; singerId: string; template: 'approval' | 'contract' | 'rejection'; to: string; sendAfter: string; sentAt?: string }

/** What a singer sees about a booking: no client phone or email (the platform coordinates). */
export interface SingerBooking { id: string; code: string; eventDate: string; startTime: string; eventType: EventType; venue: string; guests: number; packageName: string; status: Booking['status']; payout: number; paid: boolean }
export interface Activity { id: string; kind: 'singer' | 'booking' | 'approved' | 'feedback'; title: string; at: string; link?: string }
