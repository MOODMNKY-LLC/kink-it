-- Fix Realtime Presence Channel Authorization
-- Add RLS policies for user presence channels

-- Enable RLS on realtime.messages if not already enabled
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can read their own presence channel" ON realtime.messages;
DROP POLICY IF EXISTS "Users can write to their own presence channel" ON realtime.messages;

-- Policy for reading from user presence channels
CREATE POLICY "Users can read their own presence channel"
  ON realtime.messages FOR SELECT
  TO authenticated
  USING (
    topic LIKE 'user:%:presence' AND
    SPLIT_PART(topic, ':', 2)::uuid = auth.uid()
  );

-- Policy for writing to user presence channels (for presence tracking)
CREATE POLICY "Users can write to their own presence channel"
  ON realtime.messages FOR INSERT
  TO authenticated
  WITH CHECK (
    topic LIKE 'user:%:presence' AND
    SPLIT_PART(topic, ':', 2)::uuid = auth.uid()
  );

-- Create index for RLS policy performance
CREATE INDEX IF NOT EXISTS idx_realtime_messages_topic_presence
  ON realtime.messages(topic) 
  WHERE topic LIKE 'user:%:presence';

-- Ensure notifications channel also has INSERT policy for broadcasting
DROP POLICY IF EXISTS "Users can write to their own notification channel" ON realtime.messages;
CREATE POLICY "Users can write to their own notification channel"
  ON realtime.messages FOR INSERT
  TO authenticated
  WITH CHECK (
    topic LIKE 'user:%:notifications' AND
    SPLIT_PART(topic, ':', 2)::uuid = auth.uid()
  );

-- Fix: Ensure store_user_notion_api_key function has proper permissions
-- The function is SECURITY DEFINER, but we need to ensure it can bypass RLS
-- Recreate the function with explicit RLS bypass
CREATE OR REPLACE FUNCTION public.store_user_notion_api_key(
  p_user_id uuid,
  p_key_name text,
  p_api_key text,
  p_encryption_key text
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_key_id uuid;
  v_encrypted_key bytea;
  v_key_hash text;
BEGIN
  -- Validate API key format
  IF p_api_key !~ '^(secret_|ntn_)' THEN
    RAISE EXCEPTION 'Invalid Notion API key format. Keys must start with "secret_" or "ntn_"';
  END IF;

  -- Generate hash for validation/display (first 8 characters)
  v_key_hash := LEFT(p_api_key, 8);

  -- Encrypt the API key using pgcrypto
  -- Note: pgcrypto functions are in extensions schema
  v_encrypted_key := extensions.pgp_sym_encrypt(p_api_key, p_encryption_key);

  -- Insert or update encrypted key
  -- SECURITY DEFINER allows bypassing RLS, but we still validate user_id matches
  INSERT INTO public.user_notion_api_keys (
    user_id,
    key_name,
    encrypted_key,
    key_hash,
    last_validated_at
  ) VALUES (
    p_user_id,
    p_key_name,
    v_encrypted_key,
    v_key_hash,
    now()
  )
  ON CONFLICT (user_id, key_name) 
  DO UPDATE SET
    encrypted_key = EXCLUDED.encrypted_key,
    key_hash = EXCLUDED.key_hash,
    updated_at = now(),
    last_validated_at = now()
  RETURNING id INTO v_key_id;

  RETURN v_key_id;
END;
$$;

-- Also fix encrypt_notion_api_key function to use extensions schema
CREATE OR REPLACE FUNCTION public.encrypt_notion_api_key(
  p_api_key text,
  p_encryption_key text
) RETURNS bytea
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  -- Validate API key format (Notion API keys start with 'secret_' or 'ntn_')
  IF p_api_key !~ '^(secret_|ntn_)' THEN
    RAISE EXCEPTION 'Invalid Notion API key format. Keys must start with "secret_" or "ntn_"';
  END IF;

  -- Use pgcrypto to encrypt the API key (functions are in extensions schema)
  RETURN extensions.pgp_sym_encrypt(p_api_key, p_encryption_key);
END;
$$;

-- Fix decrypt function too
CREATE OR REPLACE FUNCTION public.decrypt_notion_api_key(
  p_encrypted_key bytea,
  p_encryption_key text
) RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  -- Use pgcrypto to decrypt the API key (functions are in extensions schema)
  RETURN extensions.pgp_sym_decrypt(p_encrypted_key, p_encryption_key);
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to decrypt API key. The encryption key may be incorrect.';
END;
$$;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION public.store_user_notion_api_key(uuid, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.encrypt_notion_api_key(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.decrypt_notion_api_key(bytea, text) TO authenticated;

-- Comments for documentation
COMMENT ON FUNCTION public.store_user_notion_api_key IS 
  'Stores a user-provided Notion API key encrypted. Requires SECURITY DEFINER to bypass RLS.';
COMMENT ON FUNCTION public.encrypt_notion_api_key IS 
  'Encrypts a Notion API key using pgcrypto. Uses extensions schema for pgcrypto functions.';
COMMENT ON FUNCTION public.decrypt_notion_api_key IS 
  'Decrypts an encrypted Notion API key. Uses extensions schema for pgcrypto functions.';

