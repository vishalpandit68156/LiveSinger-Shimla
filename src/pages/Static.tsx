import { Check } from 'lucide-react'
import { ADVANCE_PCT, FAQ } from '../data/catalog'
import { Link, paths } from '../lib/router'
import { faqLd, Seo } from '../lib/seo'

export function HowItWorks() {
  return (
    <div className="wrap max-w-3xl py-8 sm:py-12">
      <Seo title="How to Book a Live Singer in Shimla – LiveSinger Shimla" description="Booking a live singer in Shimla takes 3 steps: pick a singer, send a request and pay a 30% advance. No account needed." path={paths.how} jsonLd={[faqLd(FAQ)]} />
      <h1 className="text-[clamp(28px,4vw,40px)] font-extrabold">How booking works</h1>
      <p className="mt-2 text-[17px] muted">Booking a singer in Shimla through LiveSinger Shimla is simple, and you never deal with payment risk alone.</p>
      <ol className="mt-8 grid gap-4">
        {[
          ['Pick a singer', 'Browse verified singers and bands. Every profile shows real photos, fixed package prices and reviews from past clients.'],
          ['Send a booking request', 'Choose a package, date and venue. No account needed. We check availability and call you, usually within a few hours.'],
          [`Pay ${ADVANCE_PCT}% to lock the date`, 'You get a secure payment link for the advance. The rest is paid after the performance.'],
          ['Enjoy the show', 'We coordinate timing, sound and arrival with the artist. If anything changes, our team arranges a solution.'],
        ].map(([t, d], i) => <li key={t} className="card flex gap-4 p-5"><span className="grid size-9 shrink-0 place-items-center rounded-full bg-mint font-bold text-green-dark">{i + 1}</span><span><b className="block text-[17px]">{t}</b><span className="muted">{d}</span></span></li>)}
      </ol>
      <h2 className="mt-12 text-2xl font-bold">Why book through LiveSinger Shimla</h2>
      <ul className="mt-4 grid gap-2.5 text-[16px]">
        {['Every singer is verified and has signed our artist contract', 'One point of contact for timing, sound and payments', 'Clear prices with no last-minute surprises', 'Invoice available for hotels and companies'].map((x) => <li key={x} className="flex gap-2"><Check className="mt-0.5 shrink-0 text-green" size={20} />{x}</li>)}
      </ul>
      <h2 className="mt-12 text-2xl font-bold">Frequently asked questions</h2>
      <div className="mt-4 grid gap-3">{FAQ.map((f) => <div key={f.q} className="card p-5"><h3 className="font-bold">{f.q}</h3><p className="mt-1 muted">{f.a}</p></div>)}</div>
      <Link to={paths.singers} className="btn btn-primary mt-8">Find a singer</Link>
    </div>
  )
}

export function NotFound() {
  return (
    <div className="wrap py-24 text-center">
      <Seo title="Page not found – LiveSinger Shimla" description="This page does not exist." path="/404" noindex />
      <h1 className="text-3xl font-bold">Page not found</h1>
      <p className="mt-2 muted">The page you are looking for has moved or does not exist.</p>
      <Link to={paths.singers} className="btn btn-primary mt-6">Browse singers</Link>
    </div>
  )
}
