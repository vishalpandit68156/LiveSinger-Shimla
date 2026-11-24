// Supabase Edge Function: sends due emails from email_queue via Resend.
// Schedule it every 10 minutes (see README). Secrets: RESEND_API_KEY, EMAIL_FROM, SITE_URL, CONTRACT_URL
import { createClient } from 'npm:@supabase/supabase-js@2'

const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
const SITE = (Deno.env.get('SITE_URL') ?? 'https://livesingershimla.com').replace(/\/$/, '')
const FROM = Deno.env.get('EMAIL_FROM') ?? 'LiveSinger Shimla <team@livesingershimla.com>'
const CONTRACT_URL = Deno.env.get('CONTRACT_URL') ?? `${SITE}/artist-contract.pdf`

const wrap = (title: string, body: string) => `<!doctype html><html><body style="margin:0;background:#f5f8f6;font-family:Arial,sans-serif;color:#101a15">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:24px 12px">
<table width="100%" style="max-width:560px;background:#fff;border:1px solid #e5ebe7;border-radius:16px" cellpadding="0" cellspacing="0"><tr><td style="padding:28px">
<p style="margin:0 0 18px;font-weight:bold;font-size:16px">LiveSinger <span style="color:#17a34a">Shimla</span></p>
<h1 style="font-size:22px;margin:0 0 12px">${title}</h1>${body}
<p style="margin:24px 0 0;font-size:13px;color:#5d6b64">LiveSinger Shimla · Shimla, Himachal Pradesh</p></td></tr></table></td></tr></table></body></html>`
const btn = (href: string, label: string) => `<p style="margin:20px 0"><a href="${href}" style="background:#17a34a;color:#fff;text-decoration:none;padding:12px 20px;border-radius:10px;font-weight:bold;display:inline-block">${label}</a></p>`
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!))

function render(t: string, name: string, slug: string, payload: Record<string, string>) {
  if (t === 'approval') return { subject: 'Your profile is live on LiveSinger Shimla', html: wrap(`Congratulations, ${esc(name)}!`, `<p>Your singer profile has been approved and is now live. Clients in Shimla can now find and book you.</p>${btn(`${SITE}/singer/${slug}`, 'See your page')}<p>Share this link on your Instagram bio and with clients. Tomorrow you will receive your artist contract to review and sign.</p>`) }
  if (t === 'contract') return { subject: 'Your LiveSinger Shimla artist contract', html: wrap('Your artist contract', `<p>Hi ${esc(name)}, please read and sign your artist contract. It explains bookings, payouts, commission and our rule that all client bookings go through the platform.</p>${btn(CONTRACT_URL, 'Read and sign the contract')}<p>Reply to this email if you have any questions.</p>`) }
  return { subject: 'A few changes needed on your profile', html: wrap('Almost there', `<p>Hi ${esc(name)}, our team reviewed your profile and asked for a few changes before it can go live:</p><p style="background:#f5f8f6;border-radius:10px;padding:12px">${esc(payload.note ?? '')}</p>${btn(`${SITE}/dashboard`, 'Update my profile')}`) }
}

Deno.serve(async () => {
  const { data: due, error } = await sb.from('email_queue').select('*, singers(stage_name, slug)').is('sent_at', null).lte('send_after', new Date().toISOString()).lt('attempts', 5).limit(50)
  if (error) return new Response(error.message, { status: 500 })
  let sent = 0
  for (const e of due ?? []) {
    const s = e.singers ?? { stage_name: 'there', slug: '' }
    const { subject, html } = render(e.template, s.stage_name, s.slug, e.payload ?? {})
    const r = await fetch('https://api.resend.com/emails', { method: 'POST', headers: { Authorization: `Bearer ${Deno.env.get('RESEND_API_KEY')}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ from: FROM, to: e.to_email, subject, html }) })
    if (r.ok) { sent++; await sb.from('email_queue').update({ sent_at: new Date().toISOString(), attempts: e.attempts + 1 }).eq('id', e.id) }
    else await sb.from('email_queue').update({ attempts: e.attempts + 1, last_error: (await r.text()).slice(0, 500) }).eq('id', e.id)
  }
  return Response.json({ due: due?.length ?? 0, sent })
})
