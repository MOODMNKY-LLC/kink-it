-- Drop types if they exist to avoid errors
drop type if exists user_role cascade;
drop type if exists dynamic_role cascade;

-- Create enum types for roles
create type user_role as enum ('admin', 'user');
create type dynamic_role as enum ('dominant', 'submissive', 'switch');

-- Drop table if exists to allow clean recreation
drop table if exists public.profiles cascade;

-- Create profiles table for user management
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  
  -- Basic info
  email text unique not null,
  full_name text,
  display_name text,
  avatar_url text,
  
  -- System role (admin/user) and dynamic role (dom/sub/switch)
  system_role user_role default 'user' not null,
  dynamic_role dynamic_role not null,
  partner_id uuid references public.profiles(id) on delete set null,
  
  -- Preferences
  love_languages text[] default array[]::text[],
  hard_limits text[] default array[]::text[],
  soft_limits text[] default array[]::text[],
  
  -- Settings
  notifications_enabled boolean default true,
  theme_preference text default 'dark'
);

-- Enable RLS
alter table public.profiles enable row level security;

-- RLS Policies for profiles
create policy "profiles_select_own_or_partner"
  on public.profiles for select
  using (
    auth.uid() = id 
    or auth.uid() = partner_id
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.system_role = 'admin'
    )
  );

create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "profiles_update_own_or_admin"
  on public.profiles for update
  using (
    auth.uid() = id
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.system_role = 'admin'
    )
  );

create policy "profiles_delete_own"
  on public.profiles for delete
  using (auth.uid() = id);

-- Simplified function to handle admin assignment for first user
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  user_count integer;
  is_admin boolean;
begin
  -- Check if this is the first user (count all users in auth.users)
  select count(*) into user_count from auth.users;
  
  -- First user (count will be 1 since trigger runs after insert) becomes admin
  is_admin := (user_count = 1);
  
  -- Insert profile with appropriate role
  insert into public.profiles (
    id, 
    email, 
    full_name, 
    display_name, 
    dynamic_role,
    system_role,
    love_languages
  )
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    coalesce((new.raw_user_meta_data->>'dynamic_role')::dynamic_role, 'submissive'),
    case when is_admin then 'admin'::user_role else 'user'::user_role end,
    coalesce(
      (select array_agg(x) from jsonb_array_elements_text(new.raw_user_meta_data->'love_languages') x),
      array[]::text[]
    )
  );
  
  return new;
end;
$$;

-- Create trigger for new users
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- Update app_ideas RLS policies to work with profiles
drop policy if exists "app_ideas_select_authenticated" on public.app_ideas;
drop policy if exists "app_ideas_insert_authenticated" on public.app_ideas;
drop policy if exists "app_ideas_update_authenticated" on public.app_ideas;
drop policy if exists "app_ideas_delete_authenticated" on public.app_ideas;

-- Users can see their own ideas, their partner's ideas, or all if admin
create policy "app_ideas_select_policy"
  on public.app_ideas for select
  using (
    auth.uid()::text = created_by
    or auth.uid()::text = assigned_to
    or exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and (
        profiles.system_role = 'admin'
        or profiles.partner_id::text in (created_by, assigned_to)
      )
    )
  );

-- Users can insert ideas
create policy "app_ideas_insert_policy"
  on public.app_ideas for insert
  with check (auth.uid()::text = created_by);

-- Users can update their own ideas or ideas assigned to them, admins can update all
create policy "app_ideas_update_policy"
  on public.app_ideas for update
  using (
    auth.uid()::text = created_by
    or auth.uid()::text = assigned_to
    or exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.system_role = 'admin'
    )
  );

-- Users can delete their own ideas, admins can delete all
create policy "app_ideas_delete_policy"
  on public.app_ideas for delete
  using (
    auth.uid()::text = created_by
    or exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.system_role = 'admin'
    )
  );
