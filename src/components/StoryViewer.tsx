import { X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { Media } from '../data/types'
import { Photo } from './Photo'

const DUR = 5000

// Instagram-style stories: progress bars, auto-advance, tap left/right, hold to pause, swipe down to close.
export function StoryViewer({ name, avatar, items, start, onClose }: { name: string; avatar: string; items: Media[]; start: number; onClose: () => void }) {
  const [i, setI] = useState(start)
  const [t, setT] = useState(0)
  const [paused, setPaused] = useState(false)
  const y0 = useRef<number | null>(null)
  useEffect(() => setT(0), [i])
  useEffect(() => { if (paused) return; const id = setInterval(() => setT((v) => v + 50), 50); return () => clearInterval(id) }, [paused, i])
  useEffect(() => { if (t >= DUR) { if (i < items.length - 1) setI(i + 1); else onClose() } }, [t, i, items.length, onClose])
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); if (e.key === 'ArrowRight') setI((v) => Math.min(v + 1, items.length - 1)); if (e.key === 'ArrowLeft') setI((v) => Math.max(v - 1, 0)) }
    addEventListener('keydown', k); document.body.style.overflow = 'hidden'
    return () => { removeEventListener('keydown', k); document.body.style.overflow = '' }
  }, [onClose, items.length])
  const st = items[i]
  return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-black/90" role="dialog" aria-label={`${name} stories`}>
      <div className="sheet-in relative h-[100dvh] w-full max-w-[440px] overflow-hidden bg-black sm:h-[min(90dvh,780px)] sm:rounded-3xl"
        onPointerDown={(e) => { setPaused(true); y0.current = e.clientY }} onPointerUp={(e) => { setPaused(false); if (y0.current !== null && e.clientY - y0.current > 110) onClose(); y0.current = null }}>
        {st.kind === 'video' ? <video key={st.id} src={st.url} autoPlay muted playsInline className="size-full object-cover" /> : <Photo key={st.id} src={st.url} alt={st.caption ?? ''} name={st.caption ?? name} className="size-full" />}
        <div className="absolute inset-x-0 top-0 z-10 bg-gradient-to-b from-black/70 to-transparent p-3 pb-12 text-white" style={{ paddingTop: 'max(12px, env(safe-area-inset-top))' }}>
          <div className="flex gap-1">{items.map((x, j) => <span key={x.id} className="h-[3px] flex-1 overflow-hidden rounded bg-white/35"><span className="block h-full bg-white" style={{ width: j < i ? '100%' : j === i ? `${Math.min(100, (t / DUR) * 100)}%` : '0%' }} /></span>)}</div>
          <div className="mt-3 flex items-center gap-2">
            <Photo src={avatar} alt="" name={name} className="size-8 rounded-full" />
            <b className="text-sm">{name}</b><span className="text-xs text-white/70">{st.caption}</span>
            <button onClick={onClose} onPointerDown={(e) => e.stopPropagation()} className="ml-auto grid size-11 place-items-center" aria-label="Close stories"><X /></button>
          </div>
        </div>
        <button className="absolute inset-y-0 left-0 z-[5] w-1/3" aria-label="Previous" onClick={() => setI(Math.max(0, i - 1))} />
        <button className="absolute inset-y-0 right-0 z-[5] w-2/3" aria-label="Next" onClick={() => (i < items.length - 1 ? setI(i + 1) : onClose())} />
      </div>
    </div>
  )
}
