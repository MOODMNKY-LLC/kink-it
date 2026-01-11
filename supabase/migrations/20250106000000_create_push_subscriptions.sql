-- Create push_subscriptions table for PWA push notifications
create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subscription jsonb not null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Enable RLS
alter table public.push_subscriptions enable row level security;

-- RLS Policies
create policy "Users can manage their own push subscriptions"
  on public.push_subscriptions
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Create index for faster lookups
create index if not exists idx_push_subscriptions_user_id 
  on public.push_subscriptions(user_id);

-- Create unique constraint on user_id and endpoint (using unique index)
create unique index if not exists idx_push_subscriptions_user_endpoint 
  on public.push_subscriptions(user_id, ((subscription->>'endpoint')));

-- Create index for endpoint lookups (using btree for text extraction)
create index if not exists idx_push_subscriptions_endpoint 
  on public.push_subscriptions (((subscription->>'endpoint')));
