-- Avatar Management Database Functions
-- Provides helper functions for avatar validation, cleanup, and statistics

-- Function: Validate avatar URL format
CREATE OR REPLACE FUNCTION public.validate_avatar_url(p_url text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
STABLE
AS $$
BEGIN
  -- Check if URL is valid format
  IF p_url IS NULL OR p_url = '' THEN
    RETURN false;
  END IF;

  -- Check if it's a Supabase Storage URL or OpenAI URL
  IF p_url LIKE '%supabase.co/storage/v1/object/public/kinkster-avatars%' THEN
    RETURN true;
  END IF;

  IF p_url LIKE '%oaidalleapiprodscus.blob.core.windows.net%' THEN
    RETURN true; -- OpenAI temporary URL
  END IF;

  RETURN false;
END;
$$;

-- Function: Get avatar statistics for a user
CREATE OR REPLACE FUNCTION public.get_user_avatar_stats(p_user_id uuid)
RETURNS TABLE (
  total_avatars bigint,
  total_storage_size_bytes bigint,
  oldest_avatar_created_at timestamp with time zone,
  newest_avatar_created_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::bigint as total_avatars,
    COALESCE(SUM(
      CASE
        WHEN k.avatar_url LIKE '%supabase.co/storage/v1/object/public/kinkster-avatars%' THEN 1
        ELSE 0
      END
    ), 0)::bigint as total_storage_size_bytes, -- Simplified: count stored avatars
    MIN(k.created_at) as oldest_avatar_created_at,
    MAX(k.created_at) as newest_avatar_created_at
  FROM public.kinksters k
  WHERE k.user_id = p_user_id
    AND k.avatar_url IS NOT NULL
    AND k.is_active = true;
END;
$$;

-- Function: Clean up old temporary OpenAI URLs (mark for cleanup)
CREATE OR REPLACE FUNCTION public.mark_temporary_avatars_for_cleanup()
RETURNS TABLE (
  kinkster_id uuid,
  user_id uuid,
  avatar_url text,
  created_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Find kinksters with OpenAI temporary URLs older than 24 hours
  RETURN QUERY
  SELECT
    k.id as kinkster_id,
    k.user_id,
    k.avatar_url,
    k.created_at
  FROM public.kinksters k
  WHERE k.avatar_url LIKE '%oaidalleapiprodscus.blob.core.windows.net%'
    AND k.created_at < NOW() - INTERVAL '24 hours'
    AND k.is_active = true
  ORDER BY k.created_at ASC
  LIMIT 100; -- Process in batches
END;
$$;

-- Function: Get avatar generation job status
CREATE OR REPLACE FUNCTION public.get_avatar_generation_status(p_kinkster_id uuid)
RETURNS TABLE (
  kinkster_id uuid,
  avatar_url text,
  has_storage_url boolean,
  is_temporary boolean,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT
    k.id as kinkster_id,
    k.avatar_url,
    CASE
      WHEN k.avatar_url LIKE '%supabase.co/storage/v1/object/public/kinkster-avatars%' THEN true
      ELSE false
    END as has_storage_url,
    CASE
      WHEN k.avatar_url LIKE '%oaidalleapiprodscus.blob.core.windows.net%' THEN true
      ELSE false
    END as is_temporary,
    k.created_at,
    k.updated_at
  FROM public.kinksters k
  WHERE k.id = p_kinkster_id
    AND k.is_active = true;
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.validate_avatar_url(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_avatar_stats(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_avatar_generation_status(uuid) TO authenticated;

-- Only service role can run cleanup function
GRANT EXECUTE ON FUNCTION public.mark_temporary_avatars_for_cleanup() TO service_role;
