-- Migration: Create user_notion_oauth_tokens table for storing OAuth tokens from Notion authentication
-- This allows persistent token storage and refresh across sessions

-- Create table for storing Notion OAuth tokens (from OAuth flow)
CREATE TABLE IF NOT EXISTS public.user_notion_oauth_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  access_token_encrypted bytea NOT NULL, -- Encrypted access token using pgcrypto
  refresh_token_encrypted bytea NOT NULL, -- Encrypted refresh token using pgcrypto
  bot_id text NOT NULL, -- Notion bot ID from OAuth response
  workspace_id text NOT NULL, -- Notion workspace ID
  workspace_name text, -- Human-readable workspace name
  workspace_icon text, -- URL to workspace icon
  owner_type text, -- 'workspace' or 'user'
  duplicated_template_id text, -- Template page ID if provided during OAuth
  expires_at timestamptz NOT NULL, -- When the access token expires (typically 1 hour from issue)
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT unique_user_oauth_token UNIQUE (user_id)
);

-- Enable RLS
ALTER TABLE public.user_notion_oauth_tokens ENABLE ROW LEVEL SECURITY;

-- Create indexes for performance
CREATE INDEX idx_user_notion_oauth_tokens_user_id ON public.user_notion_oauth_tokens(user_id);
CREATE INDEX idx_user_notion_oauth_tokens_expires_at ON public.user_notion_oauth_tokens(expires_at);
CREATE INDEX idx_user_notion_oauth_tokens_workspace_id ON public.user_notion_oauth_tokens(workspace_id);

-- RLS Policies
CREATE POLICY "Users can view their own OAuth tokens"
  ON public.user_notion_oauth_tokens FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own OAuth tokens"
  ON public.user_notion_oauth_tokens FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own OAuth tokens"
  ON public.user_notion_oauth_tokens FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own OAuth tokens"
  ON public.user_notion_oauth_tokens FOR DELETE
  USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_user_notion_oauth_token_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_user_notion_oauth_tokens_updated_at
  BEFORE UPDATE ON public.user_notion_oauth_tokens
  FOR EACH ROW
  EXECUTE FUNCTION public.update_user_notion_oauth_token_updated_at();

-- Function to encrypt OAuth tokens
CREATE OR REPLACE FUNCTION public.encrypt_notion_oauth_token(
  p_token text,
  p_encryption_key text
) RETURNS bytea
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  RETURN extensions.pgp_sym_encrypt(p_token, p_encryption_key);
END;
$$;

-- Function to decrypt OAuth tokens
CREATE OR REPLACE FUNCTION public.decrypt_notion_oauth_token(
  p_encrypted_token bytea,
  p_encryption_key text
) RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  RETURN extensions.pgp_sym_decrypt(p_encrypted_token, p_encryption_key);
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to decrypt OAuth token. The encryption key may be incorrect.';
END;
$$;

-- Function to store OAuth tokens
CREATE OR REPLACE FUNCTION public.store_user_notion_oauth_tokens(
  p_user_id uuid,
  p_access_token text,
  p_refresh_token text,
  p_bot_id text,
  p_workspace_id text,
  p_workspace_name text,
  p_workspace_icon text,
  p_owner_type text,
  p_duplicated_template_id text,
  p_expires_in integer, -- Token expiry in seconds (typically 3600 for Notion)
  p_encryption_key text
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_token_id uuid;
  v_encrypted_access_token bytea;
  v_encrypted_refresh_token bytea;
  v_expires_at timestamptz;
BEGIN
  -- Encrypt tokens
  v_encrypted_access_token := extensions.pgp_sym_encrypt(p_access_token, p_encryption_key);
  v_encrypted_refresh_token := extensions.pgp_sym_encrypt(p_refresh_token, p_encryption_key);
  
  -- Calculate expiry time (default to 1 hour if not provided)
  v_expires_at := now() + COALESCE((p_expires_in || ' seconds')::interval, interval '1 hour');

  -- Insert or update OAuth tokens
  INSERT INTO public.user_notion_oauth_tokens (
    user_id,
    access_token_encrypted,
    refresh_token_encrypted,
    bot_id,
    workspace_id,
    workspace_name,
    workspace_icon,
    owner_type,
    duplicated_template_id,
    expires_at
  ) VALUES (
    p_user_id,
    v_encrypted_access_token,
    v_encrypted_refresh_token,
    p_bot_id,
    p_workspace_id,
    p_workspace_name,
    p_workspace_icon,
    p_owner_type,
    p_duplicated_template_id,
    v_expires_at
  )
  ON CONFLICT (user_id)
  DO UPDATE SET
    access_token_encrypted = EXCLUDED.access_token_encrypted,
    refresh_token_encrypted = EXCLUDED.refresh_token_encrypted,
    bot_id = EXCLUDED.bot_id,
    workspace_id = EXCLUDED.workspace_id,
    workspace_name = EXCLUDED.workspace_name,
    workspace_icon = EXCLUDED.workspace_icon,
    owner_type = EXCLUDED.owner_type,
    duplicated_template_id = EXCLUDED.duplicated_template_id,
    expires_at = EXCLUDED.expires_at,
    updated_at = now()
  RETURNING id INTO v_token_id;

  RETURN v_token_id;
END;
$$;

-- Function to get decrypted access token (for server-side use only)
CREATE OR REPLACE FUNCTION public.get_user_notion_oauth_access_token(
  p_user_id uuid,
  p_encryption_key text
) RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_encrypted_token bytea;
  v_decrypted_token text;
BEGIN
  -- Get encrypted access token
  SELECT access_token_encrypted INTO v_encrypted_token
  FROM public.user_notion_oauth_tokens
  WHERE user_id = p_user_id;

  IF v_encrypted_token IS NULL THEN
    RETURN NULL;
  END IF;

  -- Decrypt the token
  v_decrypted_token := extensions.pgp_sym_decrypt(v_encrypted_token, p_encryption_key);

  RETURN v_decrypted_token;
END;
$$;

-- Function to get decrypted refresh token (for server-side use only)
CREATE OR REPLACE FUNCTION public.get_user_notion_oauth_refresh_token(
  p_user_id uuid,
  p_encryption_key text
) RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_encrypted_token bytea;
  v_decrypted_token text;
BEGIN
  -- Get encrypted refresh token
  SELECT refresh_token_encrypted INTO v_encrypted_token
  FROM public.user_notion_oauth_tokens
  WHERE user_id = p_user_id;

  IF v_encrypted_token IS NULL THEN
    RETURN NULL;
  END IF;

  -- Decrypt the token
  v_decrypted_token := extensions.pgp_sym_decrypt(v_encrypted_token, p_encryption_key);

  RETURN v_decrypted_token;
END;
$$;

-- Function to update OAuth tokens after refresh
CREATE OR REPLACE FUNCTION public.update_user_notion_oauth_tokens(
  p_user_id uuid,
  p_access_token text,
  p_refresh_token text,
  p_expires_in integer,
  p_encryption_key text
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_expires_at timestamptz;
BEGIN
  -- Calculate expiry time
  v_expires_at := now() + COALESCE((p_expires_in || ' seconds')::interval, interval '1 hour');

  -- Update tokens
  UPDATE public.user_notion_oauth_tokens
  SET
    access_token_encrypted = extensions.pgp_sym_encrypt(p_access_token, p_encryption_key),
    refresh_token_encrypted = extensions.pgp_sym_encrypt(p_refresh_token, p_encryption_key),
    expires_at = v_expires_at,
    updated_at = now()
  WHERE user_id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'OAuth tokens not found for user';
  END IF;
END;
$$;

-- Function to check if token is expired or expiring soon
CREATE OR REPLACE FUNCTION public.is_notion_oauth_token_expired(
  p_user_id uuid,
  p_buffer_minutes integer DEFAULT 5 -- Check if expiring within buffer (default 5 minutes)
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_expires_at timestamptz;
BEGIN
  SELECT expires_at INTO v_expires_at
  FROM public.user_notion_oauth_tokens
  WHERE user_id = p_user_id;

  IF v_expires_at IS NULL THEN
    RETURN true; -- No token = expired
  END IF;

  -- Check if token expires within buffer period
  RETURN v_expires_at <= (now() + (p_buffer_minutes || ' minutes')::interval);
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.store_user_notion_oauth_tokens(uuid, text, text, text, text, text, text, text, text, integer, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_notion_oauth_access_token(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_notion_oauth_refresh_token(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_user_notion_oauth_tokens(uuid, text, text, integer, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_notion_oauth_token_expired(uuid, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.encrypt_notion_oauth_token(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.decrypt_notion_oauth_token(bytea, text) TO authenticated;

-- Comments for documentation
COMMENT ON TABLE public.user_notion_oauth_tokens IS 'Stores encrypted Notion OAuth tokens (access_token and refresh_token) from OAuth authentication flow. Enables persistent token storage and refresh across sessions.';
COMMENT ON COLUMN public.user_notion_oauth_tokens.access_token_encrypted IS 'Encrypted Notion OAuth access token using pgcrypto';
COMMENT ON COLUMN public.user_notion_oauth_tokens.refresh_token_encrypted IS 'Encrypted Notion OAuth refresh token using pgcrypto';
COMMENT ON COLUMN public.user_notion_oauth_tokens.expires_at IS 'When the access token expires. Used to determine when refresh is needed.';
COMMENT ON COLUMN public.user_notion_oauth_tokens.bot_id IS 'Notion bot ID from OAuth response. Used as identifier for this authorization.';
COMMENT ON COLUMN public.user_notion_oauth_tokens.workspace_id IS 'Notion workspace ID where authorization took place.';
COMMENT ON COLUMN public.user_notion_oauth_tokens.duplicated_template_id IS 'ID of template page duplicated during OAuth flow, if provided.';
