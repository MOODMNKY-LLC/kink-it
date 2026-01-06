-- Fix bond_settings trigger RLS issue
-- The trigger function needs SECURITY DEFINER to bypass RLS when auto-creating settings

-- Drop and recreate the function with SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.create_bond_settings()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER  -- Run with elevated privileges to bypass RLS
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.bond_settings (bond_id)
  VALUES (NEW.id)
  ON CONFLICT (bond_id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Add comment explaining why SECURITY DEFINER is needed
COMMENT ON FUNCTION public.create_bond_settings() IS 
  'Trigger function to auto-create bond_settings when a bond is created. Uses SECURITY DEFINER to bypass RLS since this is a system operation.';

