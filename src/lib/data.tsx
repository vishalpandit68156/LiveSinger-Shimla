import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { demoReviews, demoSingers } from '../data/demo'
import type { Review, Singer } from '../data/types'
import { repo } from './repo'

export type PublicData = { singers: Singer[]; reviews: Review[] }
type Ctx = PublicData & { ready: boolean; refresh(): void }
const C = createContext<Ctx>(null!)
export const usePublic = () => useContext(C)

declare global { interface Window { __LSS_DATA__?: PublicData } }

export const seedData = (): PublicData => ({ singers: demoSingers.filter((s) => s.status === 'approved'), reviews: demoReviews })

export function DataProvider({ initial, children }: { initial?: PublicData; children: ReactNode }) {
  const start: PublicData = initial ?? (typeof window !== 'undefined' ? window.__LSS_DATA__ : undefined) ?? (repo.live ? { singers: [], reviews: [] } : seedData())
  const [d, setD] = useState<PublicData>(start)
  const [ready, setReady] = useState(!repo.live || start.singers.length > 0)
  const refresh = () => { Promise.all([repo.publicSingers(), repo.reviews()]).then(([singers, reviews]) => { setD({ singers, reviews }); setReady(true) }).catch(() => setReady(true)) }
  useEffect(refresh, [])
  return <C.Provider value={{ ...d, ready, refresh }}>{children}</C.Provider>
}
