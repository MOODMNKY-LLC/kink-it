-- Fix admin assignment to only assign to first authenticated Notion user
-- This prevents seeded users from getting admin role

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  admin_count integer;
  is_admin boolean;
  is_notion_user boolean;
  notion_name text;
  notion_avatar text;
  notion_email text;
  default_dynamic_role public.dynamic_role;
begin
  -- Check if any admin already exists in profiles table
  -- This ensures only the first real authenticated user becomes admin
  select count(*) into admin_count
  from public.profiles
  where system_role = 'admin';

  -- Check if this user is authenticating via OAuth (real authentication, not seed)
  -- OAuth users will have provider metadata in raw_user_meta_data or raw_app_meta_data
  -- This distinguishes real authenticated users from seeded/test users
  -- Note: auth.users trigger has raw_app_meta_data (not app_metadata)
  is_notion_user := (
    -- Check various places where OAuth provider info might be stored
    new.raw_user_meta_data->>'provider' IS NOT NULL OR
    new.raw_app_meta_data->>'provider' IS NOT NULL OR
    -- Notion-specific checks
    new.raw_user_meta_data->>'provider' = 'notion' OR
    new.raw_user_meta_data->>'iss' LIKE '%notion%' OR
    new.raw_app_meta_data->>'provider' = 'notion' OR
    -- Check for OAuth-specific metadata that seeded users won't have
    new.raw_user_meta_data ? 'avatar_url' OR
    new.raw_user_meta_data ? 'full_name' OR
    new.raw_user_meta_data ? 'name'
  );

  -- First user with no existing admins AND authenticating via OAuth becomes admin
  -- This ensures seeded users don't get admin, but first real authenticated user does
  -- If admin_count > 0, someone already has admin, so don't assign
  -- If admin_count = 0 AND user has OAuth metadata, they're the first real user
  is_admin := (admin_count = 0 AND is_notion_user);

  -- Determine the default dynamic role based on admin status
  if is_admin then
    default_dynamic_role := 'dominant';
  else
    default_dynamic_role := 'submissive';
  end if;

  -- Extract Notion OAuth metadata
  notion_name := coalesce(
    new.raw_user_meta_data->>'name',
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'display_name',
    ''
  );

  notion_avatar := coalesce(
    new.raw_user_meta_data->>'avatar_url',
    new.raw_user_meta_data->>'picture',
    null
  );

  notion_email := coalesce(new.email, '');

  -- Insert profile with enhanced metadata extraction
  insert into public.profiles (
    id,
    email,
    full_name,
    display_name,
    avatar_url,
    dynamic_role,
    system_role,
    love_languages
  )
  values (
    new.id,
    notion_email,
    case
      when notion_name != '' then notion_name
      else null
    end,
    coalesce(
      new.raw_user_meta_data->>'display_name',
      notion_name,
      split_part(notion_email, '@', 1),
      'User'
    ),
    notion_avatar,
    -- Use the determined default dynamic role if not provided in metadata
    coalesce(
      (new.raw_user_meta_data->>'dynamic_role')::dynamic_role,
      default_dynamic_role
    ),
    case when is_admin then 'admin'::user_role else 'user'::user_role end,
    coalesce(
      (select array_agg(x)
       from jsonb_array_elements_text(new.raw_user_meta_data->'love_languages') x),
      array[]::text[]
    )
  );

  return new;
end;
$$;
