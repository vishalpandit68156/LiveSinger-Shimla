import { ArrowLeft, BadgeCheck, Check, Star } from 'lucide-react'
import type { ReactNode } from 'react'
import type { SingerStatus } from '../data/types'
import { Link, navigate } from '../lib/router'

export function Stars({ value, size = 14 }: { value: number; size?: number }) {
  return (
    <span className="inline-flex gap-0.5" aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => <Star key={i} size={size} className={i <= Math.round(value) ? 'fill-amber-400 text-amber-400' : 'text-gray-300'} />)}
    </span>
  )
}

export const Verified = ({ size = 16 }: { size?: number }) => <BadgeCheck size={size} className="shrink-0 text-green" aria-label="Verified" />

export function StatusBadge({ s }: { s: SingerStatus }) {
  const m = { pending_review: ['badge-amber', 'Under review'], approved: ['badge-green', 'Live'], rejected: ['badge-red', 'Changes needed'], suspended: ['badge-red', 'Suspended'] }[s]
  return <span className={`badge ${m[0]}`}>{m[1]}</span>
}

/** App-style top bar for focused flows (forms, dashboard sub-pages). */
export function AppBar({ title, back, right }: { title: string; back?: string; right?: ReactNode }) {
  return (
    <div className="sticky top-0 z-30 border-b border-line bg-white/90 backdrop-blur-lg">
      <div className="wrap flex h-14 items-center gap-2">
        <button onClick={() => (back ? navigate(back) : history.back())} className="-ml-2 grid size-11 place-items-center rounded-full hover:bg-soft" aria-label="Back"><ArrowLeft size={20} /></button>
        <h1 className="flex-1 truncate text-[17px] font-bold">{title}</h1>
        {right}
      </div>
    </div>
  )
}

export function Field({ label, error, help, children, optional }: { label: string; error?: string; help?: string; children: ReactNode; optional?: boolean }) {
  return (
    <label className="block">
      <span className="label">{label}{optional && <span className="font-normal text-muted"> (optional)</span>}</span>
      {children}
      {error ? <span className="err" role="alert">{error}</span> : help ? <span className="help">{help}</span> : null}
    </label>
  )
}

export function Chips<T extends string>({ options, value, onChange, multi = true }: { options: readonly T[]; value: T[]; onChange: (v: T[]) => void; multi?: boolean }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => {
        const on = value.includes(o)
        return <button type="button" key={o} className="chip" aria-pressed={on} onClick={() => onChange(multi ? (on ? value.filter((x) => x !== o) : [...value, o]) : [o])}>{on && <Check size={14} />}{o}</button>
      })}
    </div>
  )
}

export function Section({ title, sub, action, children, className = '' }: { title: string; sub?: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`py-10 sm:py-14 ${className}`}>
      <div className="wrap">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div><h2 className="text-[clamp(22px,3.2vw,32px)] font-bold">{title}</h2>{sub && <p className="mt-1.5 muted">{sub}</p>}</div>
          {action}
        </div>
        {children}
      </div>
    </section>
  )
}

export const TextLink = ({ to, children }: { to: string; children: ReactNode }) => <Link to={to} className="shrink-0 text-sm font-semibold text-green-dark hover:underline">{children}</Link>

export function Progress({ pct, size = 72 }: { pct: number; size?: number }) {
  const r = 30, c = 2 * Math.PI * r
  return (
    <svg width={size} height={size} viewBox="0 0 72 72" role="img" aria-label={`${pct}% complete`}>
      <circle cx="36" cy="36" r={r} fill="none" stroke="#e5ebe7" strokeWidth="7" />
      <circle cx="36" cy="36" r={r} fill="none" stroke="#17a34a" strokeWidth="7" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - pct / 100)} transform="rotate(-90 36 36)" style={{ transition: 'stroke-dashoffset .8s ease' }} />
      <text x="36" y="41" textAnchor="middle" fontSize="16" fontWeight="700" fill="#101a15">{pct}%</text>
    </svg>
  )
}
