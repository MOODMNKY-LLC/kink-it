-- Fix infinite recursion in RLS policies
-- The issue: policies were querying the profiles table from within profiles policies
-- Solution: Use a security definer function to check admin status without RLS

-- Drop existing policies that cause recursion
drop policy if exists "profiles_select_own_or_partner" on public.profiles;
drop policy if exists "profiles_update_own_or_admin" on public.profiles;

-- Create a helper function to check if user is admin (bypasses RLS)
create or replace function public.is_admin(user_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  user_role user_role;
begin
  select system_role into user_role
  from public.profiles
  where id = user_id;
  
  return user_role = 'admin'::user_role;
end;
$$;

-- Recreate select policy without recursion
create policy "profiles_select_own_or_partner"
  on public.profiles for select
  using (
    auth.uid() = id 
    or auth.uid() = partner_id
    or public.is_admin(auth.uid())
  );

-- Recreate update policy without recursion
create policy "profiles_update_own_or_admin"
  on public.profiles for update
  using (
    auth.uid() = id
    or public.is_admin(auth.uid())
  );

-- Also fix app_ideas policies that might have the same issue
drop policy if exists "app_ideas_select_policy" on public.app_ideas;
drop policy if exists "app_ideas_update_policy" on public.app_ideas;

create policy "app_ideas_select_policy"
  on public.app_ideas for select
  using (
    auth.uid()::text = created_by
    or auth.uid()::text = assigned_to
    or public.is_admin(auth.uid())
    or exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.partner_id::text in (created_by, assigned_to)
    )
  );

create policy "app_ideas_update_policy"
  on public.app_ideas for update
  using (
    auth.uid()::text = created_by
    or auth.uid()::text = assigned_to
    or public.is_admin(auth.uid())
  );
