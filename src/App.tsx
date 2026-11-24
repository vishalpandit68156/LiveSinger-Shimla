import { PublicShell } from './components/Layout'
import { LANDINGS } from './data/catalog'
import { usePublic } from './lib/data'
import { match, usePath } from './lib/router'
import { AdminBookings, AdminFeedback, AdminGate, AdminOverview, AdminSingerDetail, AdminSingers } from './pages/admin/Admin'
import Book from './pages/Book'
import Dashboard from './pages/dashboard/Dashboard'
import EditSection from './pages/dashboard/EditSection'
import Home from './pages/Home'
import Join from './pages/Join'
import Login from './pages/Login'
import SingerPage from './pages/SingerPage'
import Singers, { LandingPage } from './pages/Singers'
import { HowItWorks, NotFound } from './pages/Static'
import { Header } from './components/Layout'

export default function App() {
  const r = match(usePath())
  const { singers, ready } = usePublic()
  const find = (slug: string) => singers.find((s) => s.slug === slug)
  const wait = <p className="py-24 text-center muted">Loading…</p>

  switch (r.name) {
    case 'home': return <PublicShell><Home /></PublicShell>
    case 'singers': return <PublicShell><Singers /></PublicShell>
    case 'how': return <PublicShell><HowItWorks /></PublicShell>
    case 'landing': { const l = LANDINGS.find((x) => x.slug === r.slug); return <PublicShell>{l ? <LandingPage l={l} /> : <NotFound />}</PublicShell> }
    case 'singer': { const s = find(r.slug); return <><Header /><main>{s ? <SingerPage s={s} /> : ready ? <NotFound /> : wait}</main></> }
    case 'book': { const s = find(r.slug); return s ? <Book s={s} pkg={r.pkg} /> : <><Header />{ready ? <NotFound /> : wait}</> }
    case 'login': return <PublicShell><Login /></PublicShell>
    case 'join': return <Join />
    case 'dashboard': return <Dashboard tab={r.tab} />
    case 'dash-edit': return <EditSection section={r.section} />
    case 'admin': return <AdminGate><AdminOverview /></AdminGate>
    case 'admin-singers': return <AdminGate><AdminSingers /></AdminGate>
    case 'admin-singer': return <AdminGate><AdminSingerDetail id={r.id} /></AdminGate>
    case 'admin-bookings': return <AdminGate><AdminBookings /></AdminGate>
    case 'admin-feedback': return <AdminGate><AdminFeedback /></AdminGate>
    default: return <PublicShell><NotFound /></PublicShell>
  }
}
