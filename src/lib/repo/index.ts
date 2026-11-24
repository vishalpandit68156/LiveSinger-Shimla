import { sb } from '../supabase'
import { demoRepo } from './demo'
import { supabaseRepo } from './supabase'
export const repo = sb ? supabaseRepo : demoRepo
export type { BasicRegistration, BookingInput, AdminSinger } from './types'
