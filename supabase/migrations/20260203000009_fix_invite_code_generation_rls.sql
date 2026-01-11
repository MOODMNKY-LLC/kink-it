-- Fix invite code generation RLS issue
-- The generate_bond_invite_code function uses SECURITY INVOKER, which means it runs
-- with the caller's permissions. During onboarding, users can't SELECT from bonds
-- table due to RLS, causing the uniqueness check to fail.
--
-- Solution: Change to SECURITY DEFINER so it runs with function owner's permissions
-- This is safe because the function only reads from bonds table (no writes)

CREATE OR REPLACE FUNCTION public.generate_bond_invite_code()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER  -- Changed from SECURITY INVOKER to allow RLS bypass for uniqueness check
SET search_path = public
AS $$
DECLARE
  code text;
  exists_check boolean;
  max_attempts int := 50;  -- Increased from infinite loop to prevent runaway
  attempts int := 0;
BEGIN
  LOOP
    attempts := attempts + 1;
    
    -- Safety check to prevent infinite loops
    IF attempts > max_attempts THEN
      RAISE EXCEPTION 'Failed to generate unique invite code after % attempts', max_attempts;
    END IF;
    
    -- Generate 8-character alphanumeric code
    -- Using MD5 hash of random + timestamp for better distribution
    code := upper(
      substring(
        md5(random()::text || clock_timestamp()::text || random()::text) 
        from 1 for 8
      )
    );
    
    -- Check if code already exists
    -- With SECURITY DEFINER, this bypasses RLS and can check all bonds
    SELECT EXISTS(SELECT 1 FROM public.bonds WHERE invite_code = code) INTO exists_check;
    
    -- Exit loop if code is unique
    EXIT WHEN NOT exists_check;
  END LOOP;
  
  RETURN code;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.generate_bond_invite_code() TO authenticated;

-- Add comment explaining the security model
COMMENT ON FUNCTION public.generate_bond_invite_code() IS 
  'Generates a unique 8-character alphanumeric invite code for bonds. Uses SECURITY DEFINER to bypass RLS for uniqueness checking, which is safe because it only reads from bonds table.';
