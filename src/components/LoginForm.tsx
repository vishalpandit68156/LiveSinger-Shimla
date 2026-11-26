import { Mail } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '../lib/auth'
import { DEMO_ADMIN } from '../lib/session'
import { Field } from './ui'

const friendly = (e: unknown) => {
  const m = (e as { message?: string })?.message ?? String(e)
  if (/rate limit/i.test(m)) return 'Too many attempts. Please wait a minute and try again.'
  if (/signups not allowed/i.test(m)) return 'New sign-ups are switched off. Please contact us.'
  if (/sending|smtp|email address .*invalid/i.test(m)) return 'We could not send the email right now. Please try again in a few minutes.'
  if (/token|otp|expired|invalid/i.test(m)) return 'That code is wrong or has expired. Request a new one.'
  return m
}

// Email + 6 digit code. No password to remember.
export function LoginForm({ onDone }: { onDone?: () => void }) {
  const { sendCode, verify, demo, notConfigured } = useAuth()
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const go = async (fn: () => Promise<void>, after?: () => void) => {
    setBusy(true); setErr('')
    try { await fn(); after?.() } catch (e) { setErr(friendly(e)) } finally { setBusy(false) }
  }
  const quick = (e: string) => go(() => verify(e, '123456'), onDone)

  return (
    <div>
      {notConfigured && <p className="mb-4 rounded-2xl bg-amber-50 p-4 text-sm text-amber-900">Login is not set up yet. Please check back soon.</p>}
      <form className="grid gap-4" onSubmit={(e) => {
        e.preventDefault()
        if (!sent) { if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setErr('Enter a valid email address'); go(() => sendCode(email.trim()), () => setSent(true)) }
        else { if (!/^\d{6,8}$/.test(code)) return setErr('Enter the code from the email'); go(() => verify(email.trim(), code), onDone) }
      }}>
        {!sent ? (
          <Field label="Email address" error={err}>
            <input type="email" value={email} onChange={(e) => { setEmail(e.target.value); setErr('') }} className="field" autoComplete="email" inputMode="email" placeholder="you@example.com" autoFocus aria-invalid={!!err} />
          </Field>
        ) : (
          <Field label={`Enter the code sent to ${email}`} error={err} help={demo ? 'Demo mode: any 6 digits work.' : 'Check your spam folder if you can’t see it.'}>
            <input value={code} onChange={(e) => { setCode(e.target.value.replace(/\D/g, '').slice(0, 8)); setErr('') }} inputMode="numeric" autoComplete="one-time-code" className="field text-center text-2xl font-bold tracking-[0.5em]" placeholder="••••••" autoFocus aria-invalid={!!err} />
          </Field>
        )}
        <button disabled={busy || notConfigured} className="btn btn-dark w-full"><Mail size={18} /> {busy ? 'Please wait…' : sent ? 'Verify and continue' : 'Send login code'}</button>
        {sent && (
          <div className="flex flex-wrap justify-center gap-2">
            <button type="button" disabled={busy} onClick={() => go(() => sendCode(email.trim()))} className="btn btn-ghost btn-sm">Send a new code</button>
            <button type="button" onClick={() => { setSent(false); setCode(''); setErr('') }} className="btn btn-ghost btn-sm">Use a different email</button>
          </div>
        )}
      </form>
      {demo && !sent && (
        <div className="mt-5 rounded-2xl border border-dashed border-line bg-soft p-4 text-sm">
          <p className="font-semibold">Preview shortcuts</p>
          <p className="mt-1 muted">No real emails are sent in the preview.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button onClick={() => quick(DEMO_ADMIN)} className="btn btn-outline btn-sm">Log in as admin</button>
            <button onClick={() => quick('aarav@example.com')} className="btn btn-outline btn-sm">Log in as a live singer</button>
            <button onClick={() => quick(`new${Date.now() % 10000}@example.com`)} className="btn btn-outline btn-sm">New singer</button>
          </div>
        </div>
      )}
    </div>
  )
}
