import { useEffect } from 'react'
import { LoginForm } from '../components/LoginForm'
import { useAuth } from '../lib/auth'
import { repo } from '../lib/repo'
import { navigate, paths } from '../lib/router'
import { Seo } from '../lib/seo'

export async function routeAfterLogin(isAdmin: boolean) {
  let next: string | null = null
  try { next = sessionStorage.getItem('lss_next'); sessionStorage.removeItem('lss_next') } catch { /* ignore */ }
  if (next) return navigate(next, true)
  if (isAdmin) return navigate(paths.admin, true)
  const mine = await repo.mine().catch(() => null)
  navigate(mine ? paths.dashboard : paths.join, true)
}

export default function Login() {
  const { email, isAdmin, ready } = useAuth()
  useEffect(() => { if (ready && email) routeAfterLogin(isAdmin) }, [ready, email, isAdmin])
  return (
    <div className="wrap grid min-h-[70dvh] place-items-center py-10">
      <Seo title="Log in – LiveSinger Shimla" description="Log in to manage your singer profile." path={paths.login} noindex />
      <div className="card w-full max-w-md p-6 sm:p-8">
        <h1 className="text-2xl font-bold">Log in</h1>
        <p className="mt-1 muted">For singers and the LiveSinger team. Clients can book without an account.</p>
        <div className="mt-6"><LoginForm /></div>
      </div>
    </div>
  )
}
