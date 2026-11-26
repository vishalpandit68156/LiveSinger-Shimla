-- Admin by email: put the team's email(s) in admin_emails and they become admin
-- automatically, whether they have logged in before or log in for the first time later.
--
--   insert into public.admin_emails(email) values ('you@gmail.com');
--
create table if not exists public.admin_emails (
  email text primary key check (email = lower(email))
);
alter table public.admin_emails enable row level security; -- no policies: only the SQL editor / service role can read or change it

create or replace function public.grant_admin_by_email() returns trigger
language plpgsql security definer set search_path = public, auth as $$
begin
  if tg_table_name = 'admin_emails' then
    insert into public.admins(user_id) select u.id from auth.users u where lower(u.email) = new.email on conflict do nothing;
  elsif exists (select 1 from public.admin_emails a where a.email = lower(new.email)) then
    insert into public.admins(user_id) values (new.id) on conflict do nothing;
  end if;
  return new;
end $$;

drop trigger if exists trg_admin_email_added on public.admin_emails;
create trigger trg_admin_email_added after insert on public.admin_emails
for each row execute function public.grant_admin_by_email();

drop trigger if exists trg_admin_user_created on auth.users;
create trigger trg_admin_user_created after insert on auth.users
for each row execute function public.grant_admin_by_email();
