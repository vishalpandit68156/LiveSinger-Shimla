import type { Activity, Booking, EmailLog, Feedback, PerformerType, Review, Singer, SingerBooking, SingerPrivate, SingerStatus } from '../../data/types'

export type BasicRegistration = {
  fullName: string; stageName: string; phone: string; whatsappSame: boolean; whatsapp: string
  instagram: string; performerType: PerformerType; city: string; photo?: File | null
}
export type BookingInput = Omit<Booking, 'id' | 'code' | 'paymentStatus' | 'status' | 'createdAt'>
export type AdminSinger = { singer: Singer; priv: SingerPrivate | null; emails: EmailLog[] }

export interface Repo {
  live: boolean
  // public
  publicSingers(): Promise<Singer[]>
  reviews(): Promise<Review[]>
  createBooking(b: BookingInput): Promise<{ code: string }>
  trackView(singerId: string): void
  // singer (logged in)
  mine(): Promise<{ singer: Singer; priv: SingerPrivate } | null>
  register(b: BasicRegistration): Promise<Singer>
  updateMine(patch: Partial<Singer>, priv?: Partial<SingerPrivate>): Promise<Singer>
  upload(file: File, folder: 'avatar' | 'gallery' | 'story' | 'id'): Promise<string>
  sendFeedback(f: { rating: number; message: string }): Promise<void>
  myBookings(): Promise<SingerBooking[]>
  // admin
  adminSingers(): Promise<{ singer: Singer; priv: SingerPrivate | null }[]>
  adminSinger(id: string): Promise<AdminSinger | null>
  setStatus(id: string, status: SingerStatus, note?: string): Promise<void>
  adminBookings(): Promise<Booking[]>
  adminFeedback(): Promise<Feedback[]>
  updateBooking(id: string, patch: Partial<Pick<Booking, 'status' | 'paymentStatus'>>): Promise<void>
  adminActivity(): Promise<Activity[]>
}
