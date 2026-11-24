import { Mic } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

// Shows the photo. If there is none (or it can't load) shows a calm initials tile instead of a broken image.
export function Photo({ src, alt, className = '', name, eager }: { src?: string; alt: string; className?: string; name?: string; eager?: boolean }) {
  const [bad, setBad] = useState(!src || (import.meta.env.VITE_NO_REMOTE === '1' && /^https?:/.test(src)))
  const ref = useRef<HTMLImageElement>(null)
  // pre-rendered <img> can fail before React attaches onError: check once mounted
  useEffect(() => { const i = ref.current; if (i && i.complete && i.naturalWidth === 0) setBad(true) }, [src])
  if (bad) return <Placeholder name={name ?? alt} className={className} />
  return <img ref={ref} src={src} alt={alt} loading={eager ? 'eager' : 'lazy'} decoding="async" onError={() => setBad(true)} className={`object-cover ${className}`} />
}

const tones = [['#e8f5ee', '#cfe9da'], ['#eef2f7', '#dbe3ee'], ['#f6f0e8', '#ebdfcd'], ['#f1eef7', '#e0d9ee'], ['#eef6f5', '#d5ebe8']]
export function Placeholder({ name, className = '' }: { name: string; className?: string }) {
  const n = [...name].reduce((a, c) => a + c.charCodeAt(0), 0)
  const [a, b] = tones[n % tones.length]
  const initials = name.split(/\s+/).filter(Boolean).map((w) => w[0]).slice(0, 2).join('').toUpperCase()
  return (
    <div role="img" aria-label={name} className={`relative grid place-items-center overflow-hidden ${className}`} style={{ background: `linear-gradient(145deg, ${a}, ${b})` }}>
      <svg className="absolute inset-0 size-full opacity-60" viewBox="0 0 200 200" preserveAspectRatio="xMidYMid slice" aria-hidden>
        <circle cx="160" cy="40" r="70" fill="#fff" opacity=".45" /><circle cx="30" cy="190" r="60" fill="#fff" opacity=".35" />
      </svg>
      <div className="relative flex flex-col items-center gap-1 text-ink/70">
        <span className="text-[clamp(18px,22%,44px)] font-bold tracking-tight">{initials || <Mic />}</span>
      </div>
    </div>
  )
}
