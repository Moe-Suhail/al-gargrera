-- Al-Gargeera Supabase schema
-- Run this file in the Supabase SQL editor after creating the project.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null unique references auth.users(id) on delete cascade,
  display_name text not null,
  email text not null,
  phone text null,
  country text null,
  city text null,
  current_residence_label text null,
  default_currency text not null default 'EGP' check (default_currency in ('EGP', 'USD', 'SAR', 'AED', 'EUR', 'GBP')),
  timezone text null,
  profile_image_url text null,
  receive_email_notifications boolean not null default true,
  notify_on_transaction_created boolean not null default true,
  notify_on_transaction_confirmed boolean not null default true,
  notify_on_transaction_completed boolean not null default true,
  notify_on_repayment boolean not null default true,
  notify_on_pending_reminder boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.account_spaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  base_currency text not null default 'EGP' check (base_currency in ('EGP', 'USD', 'SAR', 'AED', 'EUR', 'GBP')),
  created_by uuid null references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.account_members (
  id uuid primary key default gen_random_uuid(),
  account_space_id uuid not null references public.account_spaces(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'member')),
  created_at timestamptz not null default now(),
  unique (account_space_id, user_id)
);

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  account_space_id uuid not null references public.account_spaces(id) on delete cascade,
  type text not null check (type in ('paid_for_other', 'saved_with_other', 'repayment', 'shared_expense', 'manual_adjustment', 'other')),
  status text not null default 'pending_confirmation' check (status in ('pending_confirmation', 'confirmed', 'completed', 'rejected', 'cancelled')),
  original_amount numeric(14, 2) not null check (original_amount > 0),
  original_currency text not null check (original_currency in ('EGP', 'USD', 'SAR', 'AED', 'EUR', 'GBP')),
  base_currency text not null default 'EGP' check (base_currency in ('EGP', 'USD', 'SAR', 'AED', 'EUR', 'GBP')),
  exchange_rate_to_base numeric(18, 8) not null check (exchange_rate_to_base > 0),
  converted_amount_base numeric(14, 2) not null check (converted_amount_base > 0),
  exchange_rate_source text not null,
  exchange_rate_date date not null,
  rate_is_manual boolean not null default false,
  transaction_date date not null,
  paid_by_user_id uuid not null references public.profiles(id),
  related_user_id uuid not null references public.profiles(id),
  description text not null,
  notes text null,
  created_by uuid not null references public.profiles(id),
  confirmed_by uuid null references public.profiles(id),
  confirmed_at timestamptz null,
  rejected_by uuid null references public.profiles(id),
  rejected_at timestamptz null,
  rejection_reason text null,
  completed_at timestamptz null,
  cancelled_at timestamptz null,
  archived_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.repayments (
  id uuid primary key default gen_random_uuid(),
  account_space_id uuid not null references public.account_spaces(id) on delete cascade,
  transaction_id uuid null references public.transactions(id) on delete set null,
  original_amount numeric(14, 2) not null check (original_amount > 0),
  original_currency text not null check (original_currency in ('EGP', 'USD', 'SAR', 'AED', 'EUR', 'GBP')),
  base_currency text not null default 'EGP' check (base_currency in ('EGP', 'USD', 'SAR', 'AED', 'EUR', 'GBP')),
  exchange_rate_to_base numeric(18, 8) not null check (exchange_rate_to_base > 0),
  converted_amount_base numeric(14, 2) not null check (converted_amount_base > 0),
  exchange_rate_source text not null,
  exchange_rate_date date not null,
  rate_is_manual boolean not null default false,
  payment_date date not null,
  paid_by_user_id uuid not null references public.profiles(id),
  paid_to_user_id uuid not null references public.profiles(id),
  notes text null,
  status text not null default 'pending_confirmation' check (status in ('pending_confirmation', 'confirmed', 'completed', 'rejected', 'cancelled')),
  created_by uuid not null references public.profiles(id),
  confirmed_by uuid null references public.profiles(id),
  confirmed_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.attachments (
  id uuid primary key default gen_random_uuid(),
  account_space_id uuid not null references public.account_spaces(id) on delete cascade,
  transaction_id uuid not null references public.transactions(id) on delete cascade,
  file_url text null,
  file_path text not null,
  file_name text not null,
  file_type text null,
  file_size bigint null,
  uploaded_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now()
);

create table if not exists public.exchange_rate_cache (
  id uuid primary key default gen_random_uuid(),
  base_currency text not null check (base_currency in ('EGP', 'USD', 'SAR', 'AED', 'EUR', 'GBP')),
  target_currency text not null check (target_currency in ('EGP', 'USD', 'SAR', 'AED', 'EUR', 'GBP')),
  rate numeric(18, 8) not null check (rate > 0),
  provider text not null,
  fetched_at timestamptz not null,
  valid_for_date date not null,
  unique (base_currency, target_currency, provider, valid_for_date)
);

create table if not exists public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  account_space_id uuid not null references public.account_spaces(id) on delete cascade,
  entity_type text not null,
  entity_id uuid null,
  action text not null,
  old_value jsonb null,
  new_value jsonb null,
  performed_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now()
);

create table if not exists public.email_notifications (
  id uuid primary key default gen_random_uuid(),
  account_space_id uuid not null references public.account_spaces(id) on delete cascade,
  recipient_user_id uuid not null references public.profiles(id) on delete cascade,
  recipient_email text not null,
  event_type text not null check (event_type in (
    'transaction_created',
    'transaction_confirmed',
    'transaction_rejected',
    'transaction_completed',
    'repayment_created',
    'repayment_confirmed',
    'receipt_uploaded',
    'password_changed',
    'pending_confirmation_reminder'
  )),
  entity_type text not null,
  entity_id uuid not null,
  subject text not null,
  status text not null default 'pending' check (status in ('pending', 'sent', 'failed', 'skipped')),
  provider text null,
  provider_message_id text null,
  error_message text null,
  sent_at timestamptz null,
  created_at timestamptz not null default now()
);

create index if not exists idx_account_members_user on public.account_members(user_id);
create index if not exists idx_transactions_space_status on public.transactions(account_space_id, status);
create index if not exists idx_transactions_space_date on public.transactions(account_space_id, transaction_date desc);
create index if not exists idx_repayments_space_status on public.repayments(account_space_id, status);
create index if not exists idx_activity_space_created on public.activity_logs(account_space_id, created_at desc);
create index if not exists idx_email_notifications_lookup on public.email_notifications(account_space_id, recipient_user_id, event_type, entity_type, entity_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists set_transactions_updated_at on public.transactions;
create trigger set_transactions_updated_at
before update on public.transactions
for each row execute function public.set_updated_at();

drop trigger if exists set_repayments_updated_at on public.repayments;
create trigger set_repayments_updated_at
before update on public.repayments
for each row execute function public.set_updated_at();

create or replace function public.current_profile_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from public.profiles where auth_user_id = auth.uid() limit 1;
$$;

create or replace function public.is_account_member(space_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.account_members
    where account_space_id = space_id
      and user_id = public.current_profile_id()
  );
$$;

alter table public.profiles enable row level security;
alter table public.account_spaces enable row level security;
alter table public.account_members enable row level security;
alter table public.transactions enable row level security;
alter table public.repayments enable row level security;
alter table public.attachments enable row level security;
alter table public.exchange_rate_cache enable row level security;
alter table public.activity_logs enable row level security;
alter table public.email_notifications enable row level security;

drop policy if exists "profiles select own or shared" on public.profiles;
create policy "profiles select own or shared"
on public.profiles for select
to authenticated
using (
  auth_user_id = auth.uid()
  or exists (
    select 1
    from public.account_members mine
    join public.account_members other_member
      on other_member.account_space_id = mine.account_space_id
    where mine.user_id = public.current_profile_id()
      and other_member.user_id = profiles.id
  )
);

drop policy if exists "profiles insert own" on public.profiles;
create policy "profiles insert own"
on public.profiles for insert
to authenticated
with check (auth_user_id = auth.uid());

drop policy if exists "profiles update own" on public.profiles;
create policy "profiles update own"
on public.profiles for update
to authenticated
using (auth_user_id = auth.uid())
with check (auth_user_id = auth.uid());

drop policy if exists "account spaces select members" on public.account_spaces;
create policy "account spaces select members"
on public.account_spaces for select
to authenticated
using (public.is_account_member(id));

drop policy if exists "account spaces insert creator" on public.account_spaces;
create policy "account spaces insert creator"
on public.account_spaces for insert
to authenticated
with check (created_by = public.current_profile_id());

drop policy if exists "account members select members" on public.account_members;
create policy "account members select members"
on public.account_members for select
to authenticated
using (public.is_account_member(account_space_id));

drop policy if exists "transactions select members" on public.transactions;
create policy "transactions select members"
on public.transactions for select
to authenticated
using (public.is_account_member(account_space_id));

drop policy if exists "transactions insert members" on public.transactions;
create policy "transactions insert members"
on public.transactions for insert
to authenticated
with check (
  public.is_account_member(account_space_id)
  and created_by = public.current_profile_id()
  and exists (select 1 from public.account_members where account_space_id = transactions.account_space_id and user_id = paid_by_user_id)
  and exists (select 1 from public.account_members where account_space_id = transactions.account_space_id and user_id = related_user_id)
);

drop policy if exists "transactions update members" on public.transactions;
create policy "transactions update members"
on public.transactions for update
to authenticated
using (public.is_account_member(account_space_id))
with check (public.is_account_member(account_space_id));

drop policy if exists "repayments select members" on public.repayments;
create policy "repayments select members"
on public.repayments for select
to authenticated
using (public.is_account_member(account_space_id));

drop policy if exists "repayments insert members" on public.repayments;
create policy "repayments insert members"
on public.repayments for insert
to authenticated
with check (
  public.is_account_member(account_space_id)
  and created_by = public.current_profile_id()
  and exists (select 1 from public.account_members where account_space_id = repayments.account_space_id and user_id = paid_by_user_id)
  and exists (select 1 from public.account_members where account_space_id = repayments.account_space_id and user_id = paid_to_user_id)
);

drop policy if exists "repayments update members" on public.repayments;
create policy "repayments update members"
on public.repayments for update
to authenticated
using (public.is_account_member(account_space_id))
with check (public.is_account_member(account_space_id));

drop policy if exists "attachments select members" on public.attachments;
create policy "attachments select members"
on public.attachments for select
to authenticated
using (public.is_account_member(account_space_id));

drop policy if exists "attachments insert members" on public.attachments;
create policy "attachments insert members"
on public.attachments for insert
to authenticated
with check (
  public.is_account_member(account_space_id)
  and uploaded_by = public.current_profile_id()
);

drop policy if exists "exchange cache read authenticated" on public.exchange_rate_cache;
create policy "exchange cache read authenticated"
on public.exchange_rate_cache for select
to authenticated
using (true);

drop policy if exists "exchange cache write authenticated" on public.exchange_rate_cache;
create policy "exchange cache write authenticated"
on public.exchange_rate_cache for insert
to authenticated
with check (true);

drop policy if exists "exchange cache update authenticated" on public.exchange_rate_cache;
create policy "exchange cache update authenticated"
on public.exchange_rate_cache for update
to authenticated
using (true)
with check (true);

drop policy if exists "activity select members" on public.activity_logs;
create policy "activity select members"
on public.activity_logs for select
to authenticated
using (public.is_account_member(account_space_id));

drop policy if exists "activity insert members" on public.activity_logs;
create policy "activity insert members"
on public.activity_logs for insert
to authenticated
with check (
  public.is_account_member(account_space_id)
  and performed_by = public.current_profile_id()
);

drop policy if exists "email notifications select members" on public.email_notifications;
create policy "email notifications select members"
on public.email_notifications for select
to authenticated
using (public.is_account_member(account_space_id));

drop policy if exists "email notifications insert members" on public.email_notifications;
create policy "email notifications insert members"
on public.email_notifications for insert
to authenticated
with check (public.is_account_member(account_space_id));

drop policy if exists "email notifications update members" on public.email_notifications;
create policy "email notifications update members"
on public.email_notifications for update
to authenticated
using (public.is_account_member(account_space_id))
with check (public.is_account_member(account_space_id));

insert into storage.buckets (id, name, public)
values ('transaction-attachments', 'transaction-attachments', false)
on conflict (id) do nothing;

drop policy if exists "attachment objects read members" on storage.objects;
create policy "attachment objects read members"
on storage.objects for select
to authenticated
using (
  bucket_id = 'transaction-attachments'
  and (storage.foldername(name))[1] ~* '^[0-9a-f-]{36}$'
  and public.is_account_member(((storage.foldername(name))[1])::uuid)
);

drop policy if exists "attachment objects insert members" on storage.objects;
create policy "attachment objects insert members"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'transaction-attachments'
  and (storage.foldername(name))[1] ~* '^[0-9a-f-]{36}$'
  and public.is_account_member(((storage.foldername(name))[1])::uuid)
);

-- Seed guidance:
-- 1. Create the two users in Supabase Auth with email/password.
-- 2. Let each user log in once, or insert their profiles manually using auth.users.id.
-- 3. Create one account space:
--    insert into public.account_spaces (name, created_by) values ('تعاملات الأخوين', '<profile_id_user_1>');
-- 4. Add both profiles to account_members:
--    insert into public.account_members (account_space_id, user_id, role) values
--    ('<account_space_id>', '<profile_id_user_1>', 'owner'),
--    ('<account_space_id>', '<profile_id_user_2>', 'member');
-- 5. Keep the transaction-attachments bucket private and use signed URLs from the app.
