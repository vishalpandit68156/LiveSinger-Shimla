import { MapPin, Star } from 'lucide-react'
import { inr, minPrice } from '../data/catalog'
import type { Singer } from '../data/types'
import { Link, paths } from '../lib/router'
import { Photo } from './Photo'
import { Verified } from './ui'

export function SingerCard({ s, i = 0 }: { s: Singer; i?: number }) {
  return (
    <Link to={paths.singer(s.slug)} className="card card-hover fade-up group flex overflow-hidden sm:block" style={{ animationDelay: `${(i % 6) * 50}ms` }}>
      <div className="relative w-[118px] shrink-0 overflow-hidden bg-soft sm:aspect-[4/3] sm:w-auto">
        <Photo src={s.cover || s.avatar} alt={`${s.stageName}, live ${s.genres[0] ?? ''} singer in Shimla`} name={s.stageName} className="absolute inset-0 size-full transition duration-500 group-hover:scale-[1.03] sm:static" />
        <span className="badge absolute left-3 top-3 hidden bg-white/95 text-ink shadow-sm sm:inline-flex">{s.performerType}</span>
      </div>
      <div className="flex-1 p-3.5 sm:p-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="flex items-center gap-1.5 text-[16px] font-bold sm:text-[17px]">{s.stageName} {s.verified && <Verified />}</h3>
          {s.reviewCount > 0 && <span className="flex shrink-0 items-center gap-1 text-sm font-semibold"><Star size={14} className="fill-amber-400 text-amber-400" />{s.rating.toFixed(1)}<span className="font-normal muted">({s.reviewCount})</span></span>}
        </div>
        <p className="mt-0.5 line-clamp-1 text-sm muted">{s.genres.slice(0, 3).join(' · ')}</p>
        <p className="mt-1 flex items-center gap-1 text-sm muted"><MapPin size={13} /> {s.city}<span className="sm:hidden"> · {s.performerType}</span></p>
        <div className="mt-2 flex items-center justify-between sm:mt-3 sm:border-t sm:border-line sm:pt-3">
          <span className="text-sm muted">From <b className="text-[16px] text-ink">{inr(minPrice(s.packages))}</b></span>
          <span className="hidden text-sm font-semibold text-green-dark sm:inline">View profile</span>
        </div>
      </div>
    </Link>
  )
}
