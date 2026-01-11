-- Fix infinite recursion using security definer functions
-- Similar approach to profiles table - use functions that bypass RLS
-- This completely eliminates recursion by checking permissions without RLS

-- Create helper function to check if user created a bond (bypasses RLS)
CREATE OR REPLACE FUNCTION public.is_bond_creator(bond_id_param uuid, user_id_param uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  creator_id uuid;
BEGIN
  SELECT created_by INTO creator_id
  FROM public.bonds
  WHERE id = bond_id_param;
  
  RETURN creator_id = user_id_param;
END;
$$;

-- Create helper function to check if user is active bond member (bypasses RLS)
CREATE OR REPLACE FUNCTION public.is_bond_member(bond_id_param uuid, user_id_param uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  member_exists boolean;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM public.bond_members
    WHERE bond_id = bond_id_param
    AND user_id = user_id_param
    AND is_active = true
  ) INTO member_exists;
  
  RETURN member_exists;
END;
$$;

-- Create helper function to check if user can invite to bond (bypasses RLS)
CREATE OR REPLACE FUNCTION public.can_invite_to_bond(bond_id_param uuid, user_id_param uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  can_invite_result boolean;
BEGIN
  -- Check if user is creator
  IF public.is_bond_creator(bond_id_param, user_id_param) THEN
    RETURN true;
  END IF;
  
  -- Check if user is authorized member with can_invite permission
  SELECT EXISTS(
    SELECT 1 FROM public.bond_members
    WHERE bond_id = bond_id_param
    AND user_id = user_id_param
    AND is_active = true
    AND can_invite = true
  ) INTO can_invite_result;
  
  RETURN can_invite_result;
END;
$$;

-- Create helper function to check if user can manage bond (bypasses RLS)
CREATE OR REPLACE FUNCTION public.can_manage_bond(bond_id_param uuid, user_id_param uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  can_manage_result boolean;
BEGIN
  -- Check if user is creator
  IF public.is_bond_creator(bond_id_param, user_id_param) THEN
    RETURN true;
  END IF;
  
  -- Check if user is authorized member with can_manage permission
  SELECT EXISTS(
    SELECT 1 FROM public.bond_members
    WHERE bond_id = bond_id_param
    AND user_id = user_id_param
    AND is_active = true
    AND can_manage = true
  ) INTO can_manage_result;
  
  RETURN can_manage_result;
END;
$$;

-- Now recreate policies using these functions (no recursion!)

-- Drop all existing bond_members policies
DROP POLICY IF EXISTS "Users can view members of their bonds" ON public.bond_members;
DROP POLICY IF EXISTS "Bond creators and authorized members can add members" ON public.bond_members;
DROP POLICY IF EXISTS "Users can update their own membership" ON public.bond_members;

-- SELECT policy using function (no recursion)
CREATE POLICY "Users can view members of their bonds"
ON public.bond_members FOR SELECT
TO authenticated
USING (
  public.is_bond_creator(bond_id, (SELECT auth.uid()))
  OR public.is_bond_member(bond_id, (SELECT auth.uid()))
  OR public.is_admin((SELECT auth.uid()))
);

-- INSERT policy using function (no recursion)
CREATE POLICY "Bond creators and authorized members can add members"
ON public.bond_members FOR INSERT
TO authenticated
WITH CHECK (
  public.can_invite_to_bond(bond_id, (SELECT auth.uid()))
  OR public.is_admin((SELECT auth.uid()))
);

-- UPDATE policy using function (no recursion)
CREATE POLICY "Users can update their own membership"
ON public.bond_members FOR UPDATE
TO authenticated
USING (
  user_id = (SELECT auth.uid())
  OR public.can_manage_bond(bond_id, (SELECT auth.uid()))
  OR public.is_admin((SELECT auth.uid()))
)
WITH CHECK (
  user_id = (SELECT auth.uid())
  OR public.can_manage_bond(bond_id, (SELECT auth.uid()))
  OR public.is_admin((SELECT auth.uid()))
);

-- Also fix bonds SELECT policy to avoid recursion
DROP POLICY IF EXISTS "Users can view bonds they belong to" ON public.bonds;

CREATE POLICY "Users can view bonds they belong to"
ON public.bonds FOR SELECT
TO authenticated
USING (
  created_by = (SELECT auth.uid())
  OR public.is_bond_member(id, (SELECT auth.uid()))
  OR public.is_admin((SELECT auth.uid()))
);

-- Fix bonds UPDATE policy
DROP POLICY IF EXISTS "Bond creators and admins can update bonds" ON public.bonds;

CREATE POLICY "Bond creators and admins can update bonds"
ON public.bonds FOR UPDATE
TO authenticated
USING (
  created_by = (SELECT auth.uid())
  OR public.can_manage_bond(id, (SELECT auth.uid()))
  OR public.is_admin((SELECT auth.uid()))
)
WITH CHECK (
  created_by = (SELECT auth.uid())
  OR public.can_manage_bond(id, (SELECT auth.uid()))
  OR public.is_admin((SELECT auth.uid()))
);
