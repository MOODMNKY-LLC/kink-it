-- =====================================================
-- SEPARATE SYSTEM ROLE FROM DYNAMIC ROLE
-- Fixes incorrect coupling between RBAC (system_role) and D/s relationship (dynamic_role)
-- Created: 2026-02-15
-- =====================================================

-- Make dynamic_role nullable so it can be set during onboarding
-- System role (admin/user) is for RBAC permissions
-- Dynamic role (dominant/submissive/switch) is for D/s relationship and should be set during onboarding
ALTER TABLE public.profiles
ALTER COLUMN dynamic_role DROP NOT NULL;

COMMENT ON COLUMN public.profiles.dynamic_role IS 'User''s role in their D/s relationship (dominant/submissive/switch). Set during onboarding step 1. Separate from system_role which is for RBAC permissions.';
COMMENT ON COLUMN public.profiles.system_role IS 'User''s system role for RBAC permissions (admin/user). First authenticated user becomes admin. Separate from dynamic_role which is for D/s relationship.';

-- Update handle_new_user() to NOT set default dynamic_role
-- Only set dynamic_role if explicitly provided in metadata
-- Leave it NULL so onboarding can set it
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_count integer;
  is_admin boolean;
  is_notion_user boolean;
  notion_name text;
  notion_avatar text;
  notion_email text;
BEGIN
  -- Check if any admin already exists in profiles table
  -- This ensures only the first real authenticated user becomes admin
  SELECT count(*) INTO admin_count
  FROM public.profiles
  WHERE system_role = 'admin';

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
  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    display_name,
    avatar_url,
    dynamic_role,
    system_role,
    love_languages
  )
  VALUES (
    new.id,
    notion_email,
    CASE
      WHEN notion_name != '' THEN notion_name
      ELSE null
    END,
    coalesce(
      new.raw_user_meta_data->>'display_name',
      notion_name,
      split_part(notion_email, '@', 1),
      'User'
    ),
    notion_avatar,
    -- Dynamic role: ONLY set if explicitly provided in metadata
    -- Otherwise leave NULL so onboarding step 1 can set it
    -- DO NOT set default based on admin status - system_role and dynamic_role are separate
    (new.raw_user_meta_data->>'dynamic_role')::dynamic_role,
    -- System role: admin for first user, user for others (RBAC permissions)
    CASE WHEN is_admin THEN 'admin'::user_role ELSE 'user'::user_role END,
    coalesce(
      (SELECT array_agg(x)
       FROM jsonb_array_elements_text(new.raw_user_meta_data->'love_languages') x),
      array[]::text[]
    )
  );

  RETURN new;
END;
$$;

-- Update comment to clarify separation of concerns
COMMENT ON FUNCTION public.handle_new_user() IS 
  'Creates a profile when a new user signs up. First authenticated user becomes admin (system_role). Dynamic role (dynamic_role) is NOT set by default and must be selected during onboarding step 1. System role (admin/user) is for RBAC permissions and is separate from dynamic role (dominant/submissive/switch) which is for D/s relationships.';
