-- Profiles + subscriptions. RLS is enabled in the same migration that
-- creates each table — a table without policies never ships.

-- ---------------------------------------------------------------------------
-- updated_at bookkeeping
-- ---------------------------------------------------------------------------
-- search_path is pinned on every function here: without it a caller can put a
-- malicious schema ahead of public and hijack unqualified references.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- profiles — one row per auth user, created automatically on sign-up
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can read their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Create the profile row when a user signs up. SECURITY DEFINER because the
-- trigger fires as the auth admin, not as the user.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- subscriptions — written ONLY by the RevenueCat webhook Edge Function
-- (service role). Clients can read their own row; there are deliberately no
-- insert/update policies, so the anon key can never fake premium status.
-- ---------------------------------------------------------------------------
create table public.subscriptions (
  user_id uuid primary key references auth.users (id) on delete cascade,
  entitlement text not null,
  product_id text,
  status text not null check (status in ('active', 'expired', 'billing_issue', 'cancelled')),
  current_period_ends_at timestamptz,
  updated_at timestamptz not null default now()
);

alter table public.subscriptions enable row level security;

create policy "Users can read their own subscription"
  on public.subscriptions for select
  using (auth.uid() = user_id);

create trigger subscriptions_set_updated_at
  before update on public.subscriptions
  for each row execute function public.set_updated_at();

-- Example of gating premium data server-side (use this pattern in policies
-- for premium-only tables):
--   using (
--     exists (
--       select 1 from public.subscriptions s
--       where s.user_id = auth.uid()
--         and s.status = 'active'
--         and (s.current_period_ends_at is null or s.current_period_ends_at > now())
--     )
--   )
