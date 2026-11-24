# LiveSinger Shimla

Mobile-first website + PWA for booking live singers in Shimla.
React 19, Vite, Tailwind v4, pre-rendered pages for SEO, Supabase backend (optional: runs in demo mode without it).

## Run
```
npm install
npm run dev            # local dev (demo mode if no .env)
npm run build          # production build: dist/ with pre-rendered HTML, sitemap.xml, robots.txt
npm run build:preview  # single-folder preview build (hash routes) in dist-preview/
```
Deploy `dist/` to Vercel (vercel.json included) or any static host. Set env vars from `.env.example`.

## Pages
Public (pre-rendered, indexable): `/`, `/singers`, `/singer/<slug>`, `/shimla/<keyword-page>`, `/how-it-works`, `/join`
App (no-index): `/book/<slug>`, `/login`, `/dashboard`, `/dashboard/edit/<section>`, `/admin`, `/admin/singers`, `/admin/singer/<id>`, `/admin/bookings`, `/admin/feedback`

## SEO
- Every public page is pre-rendered with its own title, description, canonical, Open Graph and JSON-LD
  (EntertainmentBusiness, FAQPage, ItemList, Person/MusicGroup with offers and ratings, BreadcrumbList).
- Keyword landing pages in `src/data/catalog.ts` (`LANDINGS`): live singers, wedding singers, hotel live music, Sufi, Bollywood, Pahari, corporate.
- `sitemap.xml` and `robots.txt` are generated on build. Submit the sitemap in Google Search Console.
- Set `VITE_SITE_URL` to the real domain before building.

## Supabase setup
1. Create a project (region Mumbai) at supabase.com.
2. SQL Editor → run `supabase/migrations/001_init.sql`.
3. Authentication → Email templates → Magic Link: include `{{ .Token }}` so users get a 6 digit code.
4. Authentication → SMTP: connect Resend or Brevo (the built-in sender only allows a few emails per hour).
5. Copy Project URL + anon key into `.env` (see `.env.example`).
6. Make yourself admin (after logging in once):
   `insert into admins(user_id) select id from auth.users where email = 'you@example.com';`

## Approval and contract emails
Approving a singer in the admin dashboard inserts two rows in `email_queue`: the approval email (send now) and the contract email (send after 24 hours).
Rejecting ("Request changes") queues an email with the admin note. The edge function `supabase/functions/send-emails` sends due emails through Resend.
```
supabase functions deploy send-emails
supabase secrets set RESEND_API_KEY=... EMAIL_FROM="LiveSinger Shimla <team@yourdomain.com>" SITE_URL=https://yourdomain.com CONTRACT_URL=https://.../contract
```
Schedule it every 10 minutes (SQL editor, needs pg_cron + pg_net extensions enabled):
```sql
select cron.schedule('send-emails', '*/10 * * * *', $$
  select net.http_post(url := 'https://<project>.supabase.co/functions/v1/send-emails',
    headers := '{"Authorization": "Bearer <service-role-key>"}'::jsonb) $$);
```

## Rules enforced by the database (tested on Postgres 16)
- Singers cannot approve or verify themselves or change ratings. Editing after "changes requested" re-submits for review.
- Phone, WhatsApp, email and UPI live in `singer_private`: only the singer and admins can read them.
- Public text with a phone number or "WhatsApp" is rejected.
- Pending profiles are hidden from the public. New registrations, re-submissions and bookings create admin notifications.
- Anyone can send a booking request (no login), only admins can read bookings.
- Uploads go to `singer-media/<user_id>/…`; ID proofs to the private `singer-private` bucket.

## Demo mode
Without Supabase env vars, data is stored in the browser and seeded with 8 live demo singers and 2 pending registrations.
Login accepts any 6 digit code. `admin@livesingershimla.com` opens the admin dashboard.
