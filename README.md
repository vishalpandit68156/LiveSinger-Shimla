# LiveSinger Shimla

Mobile-first website + PWA for booking live singers in Shimla.
React 19, Vite, Tailwind v4, pre-rendered pages for SEO, Supabase backend (email-code login + real data). Local dev without `.env` runs a demo.

## Run
```
npm install
npm run dev            # local dev (demo mode if no .env)
npm run build          # production build: needs the Supabase env vars, stops with an error without them
npm run build:preview  # single-folder demo build (hash routes, fake data, login shortcuts) in dist-preview/
```
Deploy `dist/` to Vercel (vercel.json included) or any static host. Set env vars from `.env.example`.

## Pages
Public (pre-rendered, indexable): `/`, `/blog`, `/blog/<slug>`, `/singers`, `/singer/<slug>`, `/shimla/<keyword-page>`, `/how-it-works`, `/join`
App (no-index): `/book/<slug>`, `/login`, `/dashboard`, `/dashboard/edit/<section>`, `/admin`, `/admin/singers`, `/admin/singer/<id>`, `/admin/bookings`, `/admin/feedback`

## SEO
- Every public page is pre-rendered with its own title, description, canonical, Open Graph and JSON-LD
  (EntertainmentBusiness, FAQPage, ItemList, Person/MusicGroup with offers and ratings, BreadcrumbList).
- Keyword landing pages in `src/data/catalog.ts` (`LANDINGS`): live singers, wedding singers, hotel live music, Sufi, Bollywood, Pahari, corporate.
- `sitemap.xml` and `robots.txt` are generated on build. Submit the sitemap in Google Search Console.
- Set `VITE_SITE_URL` to the real domain before building.

## Blog
Posts are Markdown files in `src/content/blog/<slug>.md` with a front-matter block (title, description, date, keywords).
Add a file and build: the post gets a pre-rendered page at `/blog/<slug>`, a card on `/blog` and a sitemap entry.
With Claude Code, just ask "write a blog post about <topic>": the `write-blog-post` skill in `.claude/skills/` has the
keyword list, structure and linking rules.

## Supabase setup
1. Create a project (region Mumbai) at supabase.com.
2. SQL Editor → run `supabase/migrations/001_init.sql`, then `supabase/migrations/002_admin_emails.sql`.
3. Authentication → Emails → Templates → **Magic Link**: subject `Your LiveSinger Shimla login code`, body = `supabase/templates/login-code.html` (it shows `{{ .Token }}`, the code).
4. Authentication → Emails → SMTP Settings: connect Resend or Brevo (the built-in sender only allows a few emails per hour).
5. Authentication → URL Configuration: Site URL = your domain.
6. Project Settings → API: copy Project URL + anon public key into `.env` locally and into the hosting env vars (Vercel → Settings → Environment Variables), then redeploy.
7. Make yourself admin (email in lowercase, works before or after your first login):
   `insert into public.admin_emails(email) values ('you@gmail.com');`

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

## Demo mode (dev and `build:preview` only)
With `npm run dev` and no Supabase env vars, or with `npm run build:preview` (`VITE_DEMO=1`), data is stored in the browser and seeded with 8 demo singers and 2 pending registrations.
Login accepts any 6 digit code and the "Preview shortcuts" buttons appear. `admin@livesingershimla.com` opens the admin dashboard.
A production build (`npm run build`) never uses demo data or shortcuts.
