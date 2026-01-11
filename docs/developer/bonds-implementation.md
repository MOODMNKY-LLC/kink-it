# Bonds System Implementation Guide

**For Developers**  
**Last Updated**: 2026-01-29

---

## Overview

This document provides technical details for developers working with the Bonds System implementation.

---

## Database Schema

### Tables

#### `bonds`

\`\`\`sql
CREATE TABLE public.bonds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  bond_type bond_type NOT NULL DEFAULT 'dynamic',
  bond_status bond_status NOT NULL DEFAULT 'forming',
  created_by uuid NOT NULL REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  is_private boolean DEFAULT true,
  invite_code text UNIQUE,
  metadata jsonb DEFAULT '{}'::jsonb
);
\`\`\`

#### `bond_members`

\`\`\`sql
CREATE TABLE public.bond_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bond_id uuid NOT NULL REFERENCES public.bonds(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role_in_bond text NOT NULL,
  joined_at timestamptz NOT NULL DEFAULT now(),
  left_at timestamptz,
  is_active boolean DEFAULT true,
  can_invite boolean DEFAULT false,
  can_manage boolean DEFAULT false,
  metadata jsonb DEFAULT '{}'::jsonb
);
\`\`\`

### Enums

\`\`\`sql
CREATE TYPE bond_type AS ENUM (
  'dyad',
  'polycule',
  'household',
  'dynamic'
);

CREATE TYPE bond_status AS ENUM (
  'forming',
  'active',
  'paused',
  'dissolved'
);
\`\`\`

---

## Row Level Security (RLS)

### Bonds Table Policies

**SELECT Policy**: Users can view bonds they belong to, created, or all bonds (admins)

\`\`\`sql
CREATE POLICY "Users can view bonds they belong to"
ON public.bonds FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.bond_members
    WHERE bond_members.bond_id = bonds.id
    AND bond_members.user_id = (SELECT auth.uid())
    AND bond_members.is_active = true
  )
  OR created_by = (SELECT auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = (SELECT auth.uid()) AND system_role = 'admin'
  )
);
\`\`\`

**INSERT Policy**: Authenticated users can create bonds

**UPDATE Policy**: Bond creators, managers, or admins can update bonds

### Bond Members Table Policies

**SELECT Policy**: Users can view members of their bonds

**INSERT Policy**: Bond creators and authorized inviters can add members

**UPDATE Policy**: Users can update their own membership, or managers can update any

---

## API Implementation

### Create Bond Endpoint

**File**: `app/api/bonds/create/route.ts`

**Key Logic**:
1. Validate user authentication
2. Validate input (name required)
3. Generate unique invite code
4. Create bond record
5. Add creator as founder member
6. Update user's `bond_id`

**Error Handling**:
- Rollback bond creation if member addition fails
- Return appropriate HTTP status codes
- Log errors for debugging

### Search Bond Endpoint

**File**: `app/api/bonds/search/route.ts`

**Key Logic**:
1. Validate user authentication
2. Validate invite code
3. Search for bond by invite code
4. Verify bond is accepting members
5. Check user isn't already a member

### Join Bond Endpoint

**File**: `app/api/bonds/join/route.ts`

**Key Logic**:
1. Validate user authentication
2. Verify bond exists and is accepting members
3. Check user isn't already a member
4. Get user's dynamic role
5. Add user as member
6. Update user's `bond_id`
7. Update bond status if needed

---

## Functions

### Generate Invite Code

\`\`\`sql
CREATE OR REPLACE FUNCTION public.generate_bond_invite_code()
RETURNS text
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  code text;
  exists_check boolean;
BEGIN
  LOOP
    code := upper(substring(md5(random()::text || clock_timestamp()::text) from 1 for 8));
    SELECT EXISTS(SELECT 1 FROM public.bonds WHERE invite_code = code) INTO exists_check;
    EXIT WHEN NOT exists_check;
  END LOOP;
  RETURN code;
END;
$$;
\`\`\`

---

## Indexes

### Performance Indexes

\`\`\`sql
-- Bonds
CREATE INDEX idx_bonds_created_by ON public.bonds(created_by);
CREATE INDEX idx_bonds_status ON public.bonds(bond_status);
CREATE INDEX idx_bonds_type ON public.bonds(bond_type);
CREATE INDEX idx_bonds_invite_code ON public.bonds(invite_code) WHERE invite_code IS NOT NULL;

-- Bond Members
CREATE INDEX idx_bond_members_bond_id ON public.bond_members(bond_id);
CREATE INDEX idx_bond_members_user_id ON public.bond_members(user_id);
CREATE INDEX idx_bond_members_active ON public.bond_members(bond_id, is_active) WHERE is_active = true;

-- Unique constraint for active memberships
CREATE UNIQUE INDEX idx_bond_members_unique_active 
ON public.bond_members(bond_id, user_id) 
WHERE is_active = true;
\`\`\`

---

## TypeScript Types

### Bond Types

\`\`\`typescript
export type BondType = "dyad" | "polycule" | "household" | "dynamic"
export type BondStatus = "forming" | "active" | "paused" | "dissolved"
export type BondMemberRole = "founder" | "dominant" | "submissive" | "switch" | "member"

export interface Bond {
  id: string
  name: string
  description: string | null
  bond_type: BondType
  bond_status: BondStatus
  created_by: string
  created_at: string
  updated_at: string
  is_private: boolean
  invite_code: string | null
  metadata: Record<string, any>
}
\`\`\`

---

## Testing

### Unit Tests

Test bond creation, search, and join logic:
- Valid inputs
- Invalid inputs
- Authentication requirements
- Permission checks
- Error handling

### Integration Tests

Test full flows:
- Create bond → Join bond → Verify membership
- Search bond → Join bond → Verify status
- Leave bond → Verify cleanup

### RLS Tests

Verify RLS policies:
- Users can only see their bonds
- Users can only join with valid codes
- Permissions work correctly

---

## Migration Path

### For Existing Users

1. Existing `partner_id` relationships remain functional
2. Users can create bonds during onboarding or later
3. Partner linking still works (creates dyad bond)
4. Gradual migration as users onboard

### Data Migration Script (Future)

\`\`\`sql
-- Convert partner_id relationships to dyad bonds
-- Preserve existing relationship data
-- Maintain backward compatibility
\`\`\`

---

## Security Considerations

1. **RLS Policies**: Comprehensive policies ensure data isolation
2. **Invite Codes**: Unique, non-guessable codes
3. **Permission System**: Granular control over bond management
4. **Input Validation**: Validate all inputs server-side
5. **Rate Limiting**: Prevent abuse of endpoints

---

## Performance Optimizations

1. **Indexes**: Created on all frequently queried fields
2. **Unique Indexes**: Prevent duplicate active memberships
3. **Query Optimization**: Efficient bond member lookups
4. **Caching**: Consider caching bond data (future)

---

## Related Documentation

- [Bonds System User Guide](../user-guides/bonds-system-guide.md)
- [Bonds API Reference](../api/bonds-api.md)
- [Database Schema](../technical-specs/database-schema.md)
