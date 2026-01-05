-- Update handle_new_user() to default admin users to 'dominant' dynamic_role
-- This ensures the first user (who becomes admin) is also set as dominant by default

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_count integer;
  is_admin boolean;
  notion_name text;
  notion_avatar text;
  notion_email text;
  default_dynamic_role dynamic_role;
BEGIN
  -- Check if this is the first user (count all users in auth.users)
  SELECT count(*) INTO user_count FROM auth.users;
  
  -- First user (count will be 1 since trigger runs after insert) becomes admin
  is_admin := (user_count = 1);
  
  -- Extract Notion OAuth metadata
  -- Notion provides: name, avatar_url, email in raw_user_meta_data
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
  
  -- Determine default dynamic_role: admin defaults to 'dominant', others default to 'submissive'
  IF is_admin THEN
    default_dynamic_role := 'dominant';
  ELSE
    default_dynamic_role := 'submissive';
  END IF;
  
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
    -- Use Notion name as full_name if available
    CASE 
      WHEN notion_name != '' THEN notion_name
      ELSE null
    END,
    -- Display name: use Notion name, or email username, or full_name
    coalesce(
      new.raw_user_meta_data->>'display_name',
      notion_name,
      split_part(notion_email, '@', 1),
      'User'
    ),
    -- Avatar URL from Notion
    notion_avatar,
    -- Dynamic role: extract from metadata, or use default based on admin status
    coalesce(
      (new.raw_user_meta_data->>'dynamic_role')::dynamic_role,
      default_dynamic_role
    ),
    -- System role: admin for first user, user for others
    CASE WHEN is_admin THEN 'admin'::user_role ELSE 'user'::user_role END,
    -- Love languages: extract from metadata array or default to empty
    coalesce(
      (SELECT array_agg(x) 
       FROM jsonb_array_elements_text(new.raw_user_meta_data->'love_languages') x),
      array[]::text[]
    )
  );
  
  RETURN new;
END;
$$;

-- Add comment explaining the default behavior
COMMENT ON FUNCTION public.handle_new_user() IS 
  'Creates a profile when a new user signs up. First user becomes admin with dominant role. Subsequent users default to submissive role unless specified in metadata.';


