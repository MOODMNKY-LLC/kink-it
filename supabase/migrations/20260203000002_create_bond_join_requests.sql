-- Create bond_join_requests table for request-to-join flow
-- This allows users to discover bonds and request to join (alongside invite code method)

-- Create join request status enum
CREATE TYPE join_request_status AS ENUM (
  'pending',    -- Request submitted, awaiting review
  'approved',   -- Request approved, user can join
  'rejected'    -- Request rejected
);

-- Create bond_join_requests table
CREATE TABLE IF NOT EXISTS public.bond_join_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bond_id uuid NOT NULL REFERENCES public.bonds(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Request details
  status join_request_status NOT NULL DEFAULT 'pending',
  message text, -- Optional message from requester
  
  -- Review details
  reviewed_at timestamptz,
  reviewed_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  review_notes text, -- Optional notes from reviewer
  
  -- Timestamps
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
  -- Note: We'll use a unique index with WHERE clause to ensure one pending request per user per bond
  -- This allows multiple requests (approved/rejected) but only one pending
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_bond_join_requests_bond_id ON public.bond_join_requests(bond_id);
CREATE INDEX IF NOT EXISTS idx_bond_join_requests_user_id ON public.bond_join_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_bond_join_requests_status ON public.bond_join_requests(status);
CREATE INDEX IF NOT EXISTS idx_bond_join_requests_pending ON public.bond_join_requests(bond_id, status) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_bond_join_requests_created_at ON public.bond_join_requests(created_at DESC);

-- Create unique index to ensure one pending request per user per bond
-- This allows multiple requests (approved/rejected) but only one pending at a time
CREATE UNIQUE INDEX IF NOT EXISTS idx_bond_join_requests_unique_pending 
ON public.bond_join_requests(bond_id, user_id) 
WHERE status = 'pending';

-- Enable RLS
ALTER TABLE public.bond_join_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users can view their own requests
CREATE POLICY "Users can view their own join requests"
ON public.bond_join_requests FOR SELECT
TO authenticated
USING (user_id = (SELECT auth.uid()));

-- Bond creators/managers can view requests for their bonds
CREATE POLICY "Bond admins can view join requests for their bonds"
ON public.bond_join_requests FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.bonds
    WHERE bonds.id = bond_join_requests.bond_id
    AND (
      bonds.created_by = (SELECT auth.uid())
      OR EXISTS (
        SELECT 1 FROM public.bond_members
        WHERE bond_members.bond_id = bonds.id
        AND bond_members.user_id = (SELECT auth.uid())
        AND bond_members.is_active = true
        AND bond_members.can_manage = true
      )
    )
  )
  OR EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = (SELECT auth.uid()) AND system_role = 'admin'
  )
);

-- Users can create join requests
CREATE POLICY "Users can create join requests"
ON public.bond_join_requests FOR INSERT
TO authenticated
WITH CHECK (
  user_id = (SELECT auth.uid())
  -- Bond must exist and be accepting members
  AND EXISTS (
    SELECT 1 FROM public.bonds
    WHERE bonds.id = bond_join_requests.bond_id
    AND bonds.bond_status IN ('forming', 'active')
  )
  -- User must not already be a member
  AND NOT EXISTS (
    SELECT 1 FROM public.bond_members
    WHERE bond_members.bond_id = bond_join_requests.bond_id
    AND bond_members.user_id = bond_join_requests.user_id
    AND bond_members.is_active = true
  )
);

-- Bond creators/managers can update requests (approve/reject)
CREATE POLICY "Bond admins can update join requests"
ON public.bond_join_requests FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.bonds
    WHERE bonds.id = bond_join_requests.bond_id
    AND (
      bonds.created_by = (SELECT auth.uid())
      OR EXISTS (
        SELECT 1 FROM public.bond_members
        WHERE bond_members.bond_id = bonds.id
        AND bond_members.user_id = (SELECT auth.uid())
        AND bond_members.is_active = true
        AND bond_members.can_manage = true
      )
    )
  )
  OR EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = (SELECT auth.uid()) AND system_role = 'admin'
  )
)
WITH CHECK (
  -- Only allow status changes
  status IN ('approved', 'rejected')
  -- Set reviewed_by and reviewed_at on status change
  AND (
    (status = 'approved' AND reviewed_by = (SELECT auth.uid()) AND reviewed_at IS NOT NULL)
    OR (status = 'rejected' AND reviewed_by = (SELECT auth.uid()) AND reviewed_at IS NOT NULL)
  )
);

-- Add updated_at trigger
CREATE TRIGGER bond_join_requests_updated_at
  BEFORE UPDATE ON public.bond_join_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Comments for documentation
COMMENT ON TABLE public.bond_join_requests IS 
  'Join requests for bonds. Users can request to join discoverable bonds, and bond admins can approve or reject requests.';

COMMENT ON COLUMN public.bond_join_requests.status IS 
  'Status of the join request: pending (awaiting review), approved (user can join), rejected (request denied)';

COMMENT ON COLUMN public.bond_join_requests.message IS 
  'Optional message from the user requesting to join the bond';

COMMENT ON COLUMN public.bond_join_requests.review_notes IS 
  'Optional notes from the bond admin when approving or rejecting the request';
