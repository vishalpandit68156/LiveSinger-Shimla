-- LiveSinger Shimla: initial schema (run once in Supabase SQL editor)
-- Rule: singer contact lives in singer_private. Public/anon can NEVER read it.

create extension if not exists pgcrypto;

-- ───────── admins ─────────
create table if not exists public.admins (
  user_id uuid primary key references auth.users on delete cascade,
  created_at timestamptz default now()
);
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admins where user_id = auth.uid())
$$;

-- ───────── singers (public profile) ─────────
create table if not exists public.singers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users on delete cascade,
  slug text unique not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  stage_name text not null check (length(stage_name) between 2 and 60),
  performer_type text not null default 'Solo singer' check (performer_type in ('Solo singer','Duo','Band')),
  tagline text check (length(tagline) <= 80),
  bio text check (length(bio) <= 600),
  city text default 'Shimla',
  genres text[] default '{}',
  languages text[] default '{}',
  event_types text[] default '{}',
  experience_years int default 0 check (experience_years between 0 and 60),
  avatar_url text, cover_url text,
  hue int default 300 check (hue between 0 and 359),
  instagram text check (instagram ~ '^[A-Za-z0-9._]{1,30}$'),
  youtube text,
  rating numeric(2,1) default 0,
  review_count int default 0,
  gigs_done int default 0,
  view_count int default 0,
  verified boolean default false,
  status text not null default 'pending_review' check (status in ('pending_review','approved','rejected','suspended')),
  admin_note text,
  approved_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ───────── singer_private (admin + owner only) ─────────
create table if not exists public.singer_private (
  singer_id uuid primary key references public.singers on delete cascade,
  full_name text not null,
  phone text not null check (phone ~ '^[6-9][0-9]{9}$'),
  whatsapp text check (whatsapp is null or whatsapp ~ '^[6-9][0-9]{9}$'),
  email text not null,
  payout_upi text,
  id_proof_path text,                 -- path in private bucket
  contract_signed_at timestamptz,
  commission_pct numeric default 20
);

create table if not exists public.packages (
  id uuid primary key default gen_random_uuid(),
  singer_id uuid not null references public.singers on delete cascade,
  name text not null,
  duration_hrs int not null check (duration_hrs between 1 and 12),
  price int not null check (price >= 1000),
  includes text[] default '{}',
  sort int default 0
);

create table if not exists public.media (
  id uuid primary key default gen_random_uuid(),
  singer_id uuid not null references public.singers on delete cascade,
  kind text not null check (kind in ('image','video')),
  placement text not null check (placement in ('gallery','story')),
  path text not null,                 -- storage path
  url text not null,                  -- public url
  caption text,
  sort int default 0,
  created_at timestamptz default now()
);

create table if not exists public.hotels (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references auth.users on delete set null,
  name text, city text, contact_name text, phone text, email text, gstin text
);

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  code text unique not null default ('LS' || to_char(now(), 'YYMM') || '-' || lpad((floor(random()*10000))::text, 4, '0')),
  singer_id uuid not null references public.singers,
  hotel_id uuid references public.hotels,
  package_id uuid references public.packages,
  event_date date not null,
  start_time time,
  event_type text, venue text, guests int, notes text,
  contact jsonb not null,
  total int not null,
  advance_pct int default 30,
  advance_amount int not null,
  payment_status text default 'pending' check (payment_status in ('pending','paid','refunded')),
  razorpay_order_id text, razorpay_payment_id text,
  status text default 'requested' check (status in ('requested','advance_paid','confirmed','completed','cancelled')),
  created_at timestamptz default now()
);

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  singer_id uuid not null references public.singers on delete cascade,
  booking_id uuid unique references public.bookings,
  author text, org text,
  rating int check (rating between 1 and 5),
  text text,
  approved boolean default false,
  created_at timestamptz default now()
);

create table if not exists public.feedback (
  id uuid primary key default gen_random_uuid(),
  singer_id uuid references public.singers on delete set null,
  user_id uuid default auth.uid(),
  from_name text,
  rating int check (rating between 0 and 5),
  message text check (length(message) <= 2000),
  created_at timestamptz default now()
);

-- outgoing emails: approval now, contract 24h later. Sent by the send-emails edge function.
create table if not exists public.email_queue (
  id uuid primary key default gen_random_uuid(),
  singer_id uuid references public.singers on delete cascade,
  template text not null check (template in ('approval','contract','rejection')),
  to_email text not null,
  payload jsonb default '{}',
  send_after timestamptz not null default now(),
  sent_at timestamptz,
  attempts int default 0,
  last_error text,
  created_at timestamptz default now()
);
create index if not exists email_due on public.email_queue(send_after) where sent_at is null;

create table if not exists public.admin_notifications (
  id uuid primary key default gen_random_uuid(),
  type text not null,
  ref_id uuid,
  title text,
  read boolean default false,
  created_at timestamptz default now()
);

create index if not exists packages_singer on public.packages(singer_id);
create index if not exists media_singer on public.media(singer_id, placement, sort);
create index if not exists bookings_singer on public.bookings(singer_id, event_date);

-- ───────── guards ─────────
-- singers can't approve/verify themselves or edit rating counters
create or replace function public.singers_guard() returns trigger
language plpgsql security definer set search_path = public as $$
declare base text; n int := 1;
begin
  -- no phone numbers / whatsapp in public text (hotels must book via platform)
  if concat_ws(' ', new.stage_name, new.tagline, new.bio) ~* '([0-9][ -]?){10}|whats ?app|wa\.me|call me|contact me' then
    raise exception 'Public profile mein phone number ya contact details allowed nahi hain' using errcode = 'P0001';
  end if;
  if not public.is_admin() then
    if tg_op = 'INSERT' then
      new.status := 'pending_review';
      new.verified := false; new.rating := 0; new.review_count := 0; new.gigs_done := 0; new.view_count := 0; new.admin_note := null; new.approved_at := null;
    else
      if current_setting('lss.bump', true) = '1' then return new; end if;  -- view counter only
      new.view_count := old.view_count;
      new.verified := old.verified; new.rating := old.rating; new.review_count := old.review_count; new.approved_at := old.approved_at;
      new.gigs_done := old.gigs_done; new.admin_note := old.admin_note; new.user_id := old.user_id;
      -- owners cannot change status, except: editing after "changes requested" re-submits for review
      new.status := case when old.status = 'rejected' then 'pending_review' else old.status end;
    end if;
  end if;
  if public.is_admin() and tg_op = 'UPDATE' and new.status = 'approved' and old.status <> 'approved' then
    new.approved_at := now(); new.verified := true;
  end if;
  -- unique slug: aarav-rana, aarav-rana-2, ...
  if tg_op = 'INSERT' or new.slug <> old.slug then
    base := new.slug;
    while exists (select 1 from public.singers where slug = new.slug and id <> new.id and user_id <> new.user_id) loop
      n := n + 1; new.slug := base || '-' || n;
    end loop;
  end if;
  new.updated_at := now();
  return new;
end $$;
drop trigger if exists trg_singers_guard on public.singers;
create trigger trg_singers_guard before insert or update on public.singers
for each row execute function public.singers_guard();

-- ───────── admin notifications ─────────
create or replace function public.notify_admin() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_table_name = 'singers' then
    if tg_op = 'INSERT' then
      insert into admin_notifications(type, ref_id, title) values ('new_singer', new.id, new.stage_name || ' registered');
    elsif new.status = 'pending_review' and old.status = 'rejected' then
      insert into admin_notifications(type, ref_id, title) values ('resubmitted', new.id, new.stage_name || ' updated their profile');
    elsif new.status = 'approved' and old.status <> 'approved' then
      insert into email_queue(singer_id, template, to_email, send_after)
        select new.id, t.template, p.email, now() + t.delay
        from singer_private p, (values ('approval', interval '0'), ('contract', interval '24 hours')) as t(template, delay)
        where p.singer_id = new.id;
    elsif new.status = 'rejected' and old.status <> 'rejected' then
      insert into email_queue(singer_id, template, to_email, payload)
        select new.id, 'rejection', p.email, jsonb_build_object('note', new.admin_note) from singer_private p where p.singer_id = new.id;
    end if;
  elsif tg_table_name = 'bookings' then
    insert into admin_notifications(type, ref_id, title) values ('new_booking', new.id, 'New booking request from ' || coalesce(nullif(new.contact->>'org', ''), new.contact->>'name', 'a client'));
  end if;
  return new;
end $$;
drop trigger if exists trg_singer_notify on public.singers;
create trigger trg_singer_notify after insert or update on public.singers
for each row execute function public.notify_admin();
drop trigger if exists trg_booking_notify on public.bookings;
create trigger trg_booking_notify after insert on public.bookings
for each row execute function public.notify_admin();

-- ───────── RLS ─────────
alter table public.admins enable row level security;
alter table public.singers enable row level security;
alter table public.singer_private enable row level security;
alter table public.packages enable row level security;
alter table public.media enable row level security;
alter table public.hotels enable row level security;
alter table public.bookings enable row level security;
alter table public.reviews enable row level security;
alter table public.admin_notifications enable row level security;
alter table public.feedback enable row level security;
alter table public.email_queue enable row level security;

create or replace function public.owns_singer(sid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.singers where id = sid and user_id = auth.uid())
$$;
create or replace function public.singer_public(sid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.singers where id = sid and status = 'approved')
$$;

create policy admins_self on public.admins for select using (user_id = auth.uid());

create policy singers_read on public.singers for select using (status = 'approved' or user_id = auth.uid() or public.is_admin());
create policy singers_insert on public.singers for insert with check (user_id = auth.uid());
create policy singers_update on public.singers for update using (user_id = auth.uid() or public.is_admin());
create policy singers_delete on public.singers for delete using (public.is_admin());

create policy private_rw on public.singer_private for all
  using (public.owns_singer(singer_id) or public.is_admin())
  with check (public.owns_singer(singer_id) or public.is_admin());

create policy packages_read on public.packages for select using (public.singer_public(singer_id) or public.owns_singer(singer_id) or public.is_admin());
create policy packages_write on public.packages for all using (public.owns_singer(singer_id) or public.is_admin()) with check (public.owns_singer(singer_id) or public.is_admin());

create policy media_read on public.media for select using (public.singer_public(singer_id) or public.owns_singer(singer_id) or public.is_admin());
create policy media_write on public.media for all using (public.owns_singer(singer_id) or public.is_admin()) with check (public.owns_singer(singer_id) or public.is_admin());

create policy reviews_read on public.reviews for select using (approved or public.is_admin());
create policy reviews_admin on public.reviews for all using (public.is_admin()) with check (public.is_admin());

create policy hotels_own on public.hotels for all using (user_id = auth.uid() or public.is_admin()) with check (user_id = auth.uid() or public.is_admin());

-- anyone can request a booking for an approved singer; only admin reads bookings
create policy bookings_create on public.bookings for insert with check (status = 'requested' and payment_status = 'pending' and public.singer_public(singer_id));
create policy bookings_admin on public.bookings for all using (public.is_admin()) with check (public.is_admin());

create policy feedback_create on public.feedback for insert to authenticated with check (singer_id is null or public.owns_singer(singer_id));
create policy feedback_admin on public.feedback for select using (public.is_admin());
create policy emails_admin on public.email_queue for select using (public.is_admin());

create policy notif_admin on public.admin_notifications for all using (public.is_admin()) with check (public.is_admin());

-- ───────── storage ─────────
insert into storage.buckets (id, name, public) values ('singer-media', 'singer-media', true) on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('singer-private', 'singer-private', false) on conflict (id) do nothing;

-- files go to <user_id>/<file>; users can only write in their own folder
create policy media_upload on storage.objects for insert to authenticated
  with check (bucket_id in ('singer-media','singer-private') and (storage.foldername(name))[1] = auth.uid()::text);
create policy media_modify on storage.objects for update to authenticated
  using (bucket_id in ('singer-media','singer-private') and (storage.foldername(name))[1] = auth.uid()::text);
create policy media_remove on storage.objects for delete to authenticated
  using (bucket_id in ('singer-media','singer-private') and (storage.foldername(name))[1] = auth.uid()::text);
create policy private_read on storage.objects for select to authenticated
  using (bucket_id = 'singer-private' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));

-- profile view counter (no personal data stored)
create or replace function public.bump_view(sid uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  perform set_config('lss.bump', '1', true);
  update public.singers set view_count = view_count + 1 where id = sid and status = 'approved';
end $$;

-- a singer's own confirmed/completed bookings, WITHOUT client contact details
create or replace function public.my_bookings() returns table (
  id uuid, code text, event_date date, start_time time, event_type text, venue text, guests int, package_name text, status text, payout int
) language sql stable security definer set search_path = public as $$
  select b.id, b.code, b.event_date, b.start_time, b.event_type, b.venue, b.guests, p.name,
         b.status, round(b.total * (1 - coalesce(sp.commission_pct, 20) / 100.0))::int
  from public.bookings b
  join public.singers s on s.id = b.singer_id and s.user_id = auth.uid()
  left join public.packages p on p.id = b.package_id
  left join public.singer_private sp on sp.singer_id = s.id
  where b.status in ('confirmed','completed','cancelled')
  order by b.event_date desc
$$;

-- realtime for the admin dashboard
do $$ begin
  alter publication supabase_realtime add table public.admin_notifications;
exception when others then null; end $$;
