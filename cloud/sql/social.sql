-- REVIVE social beta. Run in your own Supabase project's SQL editor.
-- Security model: authentication by Supabase Auth, row-level policies on every user table.
create extension if not exists pgcrypto;
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  handle text not null unique check (handle ~ '^[a-z][a-z0-9_]{2,22}$'),
  display_name text not null default 'Player' check(char_length(display_name) <= 48),
  created_at timestamptz not null default now()
);
create table if not exists public.friend_requests (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.profiles(id) on delete cascade,
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending' check(status in ('pending','accepted','declined')),
  created_at timestamptz not null default now(),
  check(sender_id <> recipient_id),
  unique(sender_id, recipient_id)
);
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  from_id uuid not null references public.profiles(id) on delete cascade,
  to_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now(),
  check(from_id <> to_id)
);
create index if not exists messages_recent_idx on public.messages (created_at desc);
create index if not exists friend_requests_sender_idx on public.friend_requests(sender_id);
create index if not exists friend_requests_recipient_idx on public.friend_requests(recipient_id);
alter table public.profiles enable row level security;
alter table public.friend_requests enable row level security;
alter table public.messages enable row level security;
create policy profiles_read on public.profiles for select to authenticated using (true);
create policy profiles_update on public.profiles for update to authenticated using (id=(select auth.uid())) with check(id=(select auth.uid()));
create policy requests_read on public.friend_requests for select to authenticated using (sender_id=(select auth.uid()) or recipient_id=(select auth.uid()));
create policy messages_read on public.messages for select to authenticated using (from_id=(select auth.uid()) or to_id=(select auth.uid()));
create policy messages_send on public.messages for insert to authenticated with check (
  from_id=(select auth.uid()) and exists(
    select 1 from public.friend_requests f
    where f.status='accepted' and
    ((f.sender_id=(select auth.uid()) and f.recipient_id=to_id) or
     (f.recipient_id=(select auth.uid()) and f.sender_id=to_id))
  )
);
-- Keep mutation rights narrow. Profiles may update only the two user-editable fields.
revoke all on public.profiles, public.friend_requests, public.messages from anon, authenticated;
grant select on public.profiles,public.friend_requests,public.messages to authenticated;
grant update(handle,display_name) on public.profiles to authenticated;
grant insert(from_id,to_id,body) on public.messages to authenticated;
-- Create a safe unique starter handle at account creation. Change it in REVIVE later.
create or replace function public.revive_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
 insert into public.profiles(id,handle,display_name) values
 (new.id, 'player_' || substring(replace(new.id::text,'-','') from 1 for 16), 'New player');
 return new;
end $$;
drop trigger if exists on_auth_user_created_revive on auth.users;
create trigger on_auth_user_created_revive after insert on auth.users
for each row execute function public.revive_new_user();
-- Guard authenticated mutations behind narrow security-definer functions.
create or replace function public.send_friend_request(target_handle text) returns void
language plpgsql security definer set search_path = '' as $$
declare receiver uuid;
begin
 if auth.uid() is null then raise exception 'Sign in required';end if;
 select id into receiver from public.profiles where handle=lower(trim(target_handle));
 if receiver is null then raise exception 'No player with that handle';end if;
 if receiver=auth.uid() then raise exception 'Cannot add yourself';end if;
 if exists (select 1 from public.friend_requests where
   (sender_id=receiver and recipient_id=(select auth.uid())) or
   (sender_id=(select auth.uid()) and recipient_id=receiver)) then
   raise exception 'Friend request or friendship already exists';
 end if;
 insert into public.friend_requests(sender_id,recipient_id) values(auth.uid(),receiver);
end $$;
create or replace function public.respond_friend_request(request_id uuid, accept boolean) returns void
language plpgsql security definer set search_path = '' as $$
begin
 update public.friend_requests set status=case when accept then 'accepted' else 'declined' end
 where id=request_id and recipient_id=(select auth.uid()) and status='pending';
 if not found then raise exception 'Pending request not found';end if;
end $$;
revoke all on function public.send_friend_request(text) from public, anon;
revoke all on function public.respond_friend_request(uuid,boolean) from public, anon;
revoke execute on function public.revive_new_user() from public, anon, authenticated;
grant execute on function public.send_friend_request(text) to authenticated;
grant execute on function public.respond_friend_request(uuid,boolean) to authenticated;
-- Enable email verification, spam/rate limiting, and allowed email domains in Supabase Auth settings.
