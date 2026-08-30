-- subscriptions table
create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id),
  name text,
  cost numeric,
  billing_cycle text check (billing_cycle in ('monthly', 'yearly')),
  next_renewal_date date,
  created_at timestamptz not null default now()
);

-- Row Level Security
alter table public.subscriptions enable row level security;

create policy "Users can select their own subscriptions"
  on public.subscriptions
  for select
  using (auth.uid() = user_id);

create policy "Users can insert their own subscriptions"
  on public.subscriptions
  for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own subscriptions"
  on public.subscriptions
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own subscriptions"
  on public.subscriptions
  for delete
  using (auth.uid() = user_id);
