-- Migration: Create user_notion_api_keys table for storing encrypted Notion API keys
-- This allows users to add their own Notion API keys for enhanced integration capabilities

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create table for storing user-provided Notion API keys
CREATE TABLE IF NOT EXISTS public.user_notion_api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  key_name text NOT NULL, -- User-friendly name for the key (e.g., "Personal Workspace", "Team Integration")
  encrypted_key bytea NOT NULL, -- Encrypted API key using pgcrypto
  key_hash text NOT NULL, -- First 8 characters for validation/display (e.g., "secret_a" or "ntn_5507")
  is_active boolean DEFAULT true,
  last_used_at timestamptz,
  last_validated_at timestamptz, -- When the key was last validated against Notion API
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT unique_user_key_name UNIQUE (user_id, key_name),
  CONSTRAINT valid_key_hash CHECK (key_hash ~ '^(secret_|ntn_)')
);

-- Enable RLS
ALTER TABLE public.user_notion_api_keys ENABLE ROW LEVEL SECURITY;

-- Create indexes for performance
CREATE INDEX idx_user_notion_api_keys_user_id ON public.user_notion_api_keys(user_id);
CREATE INDEX idx_user_notion_api_keys_active ON public.user_notion_api_keys(user_id, is_active) WHERE is_active = true;
CREATE INDEX idx_user_notion_api_keys_user_active ON public.user_notion_api_keys(user_id) WHERE is_active = true;

-- RLS Policies
CREATE POLICY "Users can view their own API keys"
  ON public.user_notion_api_keys FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own API keys"
  ON public.user_notion_api_keys FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own API keys"
  ON public.user_notion_api_keys FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own API keys"
  ON public.user_notion_api_keys FOR DELETE
  USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_user_notion_api_key_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_user_notion_api_keys_updated_at
  BEFORE UPDATE ON public.user_notion_api_keys
  FOR EACH ROW
  EXECUTE FUNCTION public.update_user_notion_api_key_updated_at();

-- Function to encrypt API key
-- Note: In production, the encryption key should be stored in Supabase Vault or environment variable
-- For now, we'll use a function that accepts the encryption key as a parameter
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

-- Function to decrypt API key
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

-- Function to validate and store API key
-- This function validates the key format and stores it encrypted
CREATE OR REPLACE FUNCTION public.store_user_notion_api_key(
  p_user_id uuid,
  p_key_name text,
  p_api_key text,
  p_encryption_key text
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

  -- Encrypt the API key
  v_encrypted_key := public.encrypt_notion_api_key(p_api_key, p_encryption_key);

  -- Insert or update encrypted key
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

-- Function to get decrypted API key (for server-side use only)
-- This should only be called from secure server-side code
CREATE OR REPLACE FUNCTION public.get_user_notion_api_key(
  p_user_id uuid,
  p_key_id uuid,
  p_encryption_key text
) RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_encrypted_key bytea;
  v_decrypted_key text;
BEGIN
  -- Get encrypted key
  SELECT encrypted_key INTO v_encrypted_key
  FROM public.user_notion_api_keys
  WHERE id = p_key_id
    AND user_id = p_user_id
    AND is_active = true;

  IF v_encrypted_key IS NULL THEN
    RAISE EXCEPTION 'API key not found or inactive';
  END IF;

  -- Decrypt the key
  v_decrypted_key := public.decrypt_notion_api_key(v_encrypted_key, p_encryption_key);

  -- Update last_used_at
  UPDATE public.user_notion_api_keys
  SET last_used_at = now()
  WHERE id = p_key_id;

  RETURN v_decrypted_key;
END;
$$;

-- Function to validate API key against Notion API
-- This can be called to test if an API key is still valid
CREATE OR REPLACE FUNCTION public.validate_notion_api_key(
  p_api_key text
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_response jsonb;
  v_status_code int;
BEGIN
  -- Make a test request to Notion API
  -- Note: This requires the http extension or pg_net extension
  -- For now, we'll just validate the format
  -- Full validation should be done in the API endpoint using Edge Functions
  
  -- Format validation
  IF p_api_key !~ '^(secret_|ntn_)' THEN
    RETURN false;
  END IF;

  -- If format is valid, return true
  -- Actual API validation will happen in the API endpoint
  RETURN true;
END;
$$;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_notion_api_keys TO authenticated;

-- Comments for documentation
COMMENT ON TABLE public.user_notion_api_keys IS 'Stores encrypted Notion API keys provided by users for enhanced integration capabilities';
COMMENT ON COLUMN public.user_notion_api_keys.encrypted_key IS 'Encrypted API key using pgcrypto pgp_sym_encrypt';
COMMENT ON COLUMN public.user_notion_api_keys.key_hash IS 'First 8 characters of the API key for display/validation purposes';
COMMENT ON COLUMN public.user_notion_api_keys.last_validated_at IS 'Timestamp when the key was last validated against Notion API';
