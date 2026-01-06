# Bonds System & Enhanced Kink Identity Implementation

**Date**: 2026-01-29  
**Status**: Implementation Complete  
**Deep Thinking Protocol**: Complete

---

## Executive Summary

This implementation replaces the simple `partner_id` linking system with a comprehensive **Bonds System** that supports multi-member relationship groups (dyads, polycules, households, and flexible dynamics). Additionally, we've enhanced user profiles with extensive kink/BDSM identity fields for better self-expression and comprehensive profile building.

---

## Research Findings

### Terminology Decision

After extensive research into kink/BDSM community terminology, we selected:

- **"Bond"** as the primary term for multi-member relationship groups
  - Distinctive and meaningful
  - Implies connection and commitment
  - Works for both 2-person and multi-person groups
  - Not overly poly-specific (works for all relationship structures)

- **"Dynamic"** remains for the relationship structure itself (already in codebase)

### BDSM Subtypes Identified

**Submissive Subtypes**: Brat, Little/Middle, Pet, Slave, Masochist, Service Sub, Primal Prey, Rope Bunny, Exhibitionist, Degradation Sub

**Dominant Subtypes**: Daddy, Mommy, Master, Mistress, Sadist, Rigger, Primal Predator, Owner, Handler, Degradation Dom

**Switch/Versatile**: Switch, Versatile

### Dynamic Types & Intensities

**Intensities**: Casual, Part-Time, Lifestyle, 24/7, TPE (Total Power Exchange)

**Structures**: D/s, M/s, Owner/Pet, CG/l, Primal, Rope Partnership, Mentor/Protégé, Casual Play, Other

### BDSM Iconography

Based on traditional BDSM symbols:
- **Shield** → Dominant/Owner (authority, protection)
- **Circle/Collar** → Submissive/Owned (unity, connection)
- **Triskelion** → Switch/BDSM Community (three-part unity)

---

## Database Schema

### Bonds System (`bonds` table)

```sql
CREATE TABLE public.bonds (
  id uuid PRIMARY KEY,
  name text NOT NULL,
  description text,
  bond_type bond_type NOT NULL,  -- 'dyad', 'polycule', 'household', 'dynamic'
  bond_status bond_status NOT NULL,  -- 'forming', 'active', 'paused', 'dissolved'
  created_by uuid REFERENCES profiles(id),
  invite_code text UNIQUE,
  is_private boolean DEFAULT true,
  metadata jsonb DEFAULT '{}'
)
```

### Bond Members (`bond_members` table)

```sql
CREATE TABLE public.bond_members (
  id uuid PRIMARY KEY,
  bond_id uuid REFERENCES bonds(id),
  user_id uuid REFERENCES profiles(id),
  role_in_bond text NOT NULL,  -- 'founder', 'dominant', 'submissive', 'switch', 'member'
  joined_at timestamptz DEFAULT now(),
  left_at timestamptz,
  is_active boolean DEFAULT true,
  can_invite boolean DEFAULT false,
  can_manage boolean DEFAULT false,
  metadata jsonb DEFAULT '{}'
)
```

### Enhanced Profiles

Added fields to `profiles` table:
- `bond_id` - Links user to their bond
- `kink_subtypes` - Array of kink subtypes
- `dynamic_intensity` - Intensity level (casual to TPE)
- `dynamic_structure` - Array of relationship structures
- `kink_interests` - Free-form kink interests
- `experience_level` - Self-reported experience
- `scene_preferences` - Preferred scene types
- `kink_identity_public` - Privacy setting

---

## Implementation Components

### 1. Database Migrations

**`20260129000000_create_bonds_system.sql`**
- Creates `bonds` and `bond_members` tables
- Adds `bond_id` to profiles
- Implements RLS policies
- Creates invite code generation function
- Adds indexes for performance

**`20260129000001_enhance_profiles_kink_identity.sql`**
- Adds kink identity enums and fields
- Creates indexes for kink subtype searches
- Adds documentation comments

### 2. Onboarding Integration

**New Step: Bond Setup** (`components/onboarding/steps/bond-setup-step.tsx`)
- Step 2 in onboarding flow (between Welcome and Notion Setup)
- Two modes: Create New Bond or Join Existing
- Create mode: Name, description, bond type selection
- Join mode: Invite code search and join
- Skip option available

**Updated Onboarding Wizard**
- Total steps increased from 5 to 6
- Bond setup inserted as step 2
- All subsequent steps shifted down

### 3. API Endpoints

**`POST /api/bonds/create`**
- Creates new bond
- Generates unique invite code
- Adds creator as founder member
- Updates user's `bond_id`

**`GET /api/bonds/search?code=INVITECODE`**
- Searches for bond by invite code
- Validates bond is accepting members
- Checks user isn't already a member

**`POST /api/bonds/join`**
- Joins user to existing bond
- Sets role based on user's dynamic_role
- Updates bond status if needed
- Updates user's `bond_id`

### 4. UI Components

**BDSM Role Icons** (`components/icons/bdsm-role-icons.tsx`)
- `DominantIcon` - Shield symbol
- `SubmissiveIcon` - Circle/Collar symbol
- `SwitchIcon` - Triskelion symbol
- Three variants: filled, outline, minimal

**Kink Identity Form** (`components/account/kink-identity-form.tsx`)
- Comprehensive form for kink identity
- Subtype selection (role-based filtering)
- Dynamic intensity selection
- Dynamic structure multi-select
- Experience level selection
- Privacy toggle
- Integrated into profile page as tab

**Enhanced Profile Page**
- Two tabs: "Basic Information" and "Kink Identity"
- Seamless navigation between forms
- Maintains existing partner linking functionality

### 5. Type Definitions

**`types/bond.ts`**
- Bond, BondMember, BondWithMembers interfaces
- BondType, BondStatus, BondMemberRole types

**`types/kink-identity.ts`**
- KinkSubtype, DynamicIntensity, DynamicStructure types
- ExperienceLevel type
- KinkIdentity interface

**Updated `types/profile.ts`**
- Added `bond_id` field
- Added kink identity fields (optional)

---

## RLS Policies

### Bonds Table Policies

- **SELECT**: Users can view bonds they belong to, bonds they created, or all bonds (admins)
- **INSERT**: Authenticated users can create bonds
- **UPDATE**: Bond creators, authorized managers, or admins can update bonds

### Bond Members Table Policies

- **SELECT**: Users can view members of their bonds
- **INSERT**: Bond creators and authorized inviters can add members
- **UPDATE**: Users can update their own membership, or managers/admins can update any

---

## User Flow

### Onboarding Flow (Updated)

1. **Welcome Step** - Select dynamic role (dominant/submissive/switch)
2. **Bond Setup Step** (NEW) - Create or join a bond
3. **Notion Setup Step** - Duplicate template
4. **Notion Verification Step** - Verify template and databases
5. **Discord Step** (Optional) - Install Discord bot
6. **Welcome Splash** - Completion celebration

### Profile Enhancement Flow

1. Navigate to `/account/profile`
2. Select "Kink Identity" tab
3. Select kink subtypes (filtered by role)
4. Choose dynamic intensity
5. Select dynamic structures
6. Set experience level
7. Toggle privacy setting
8. Save changes

---

## Key Features

### Bond System Features

- **Multi-Member Support**: Supports dyads, polycules, households, and flexible dynamics
- **Invite System**: Unique invite codes for private bonds
- **Role-Based Permissions**: Can invite, can manage flags
- **Status Management**: Forming → Active → Paused/Dissolved
- **Backward Compatibility**: `partner_id` retained for existing data

### Kink Identity Features

- **Comprehensive Subtypes**: 20+ subtypes covering common kink identities
- **Role-Based Filtering**: Subtypes filtered by user's dynamic role
- **Dynamic Intensity**: From casual to TPE
- **Multiple Structures**: Support for various relationship structures
- **Privacy Control**: Users choose if kink identity is public
- **Self-Expression**: Free-form interests and scene preferences

### Icon System Features

- **Traditional Symbols**: Based on recognized BDSM iconography
- **Three Variants**: Filled, outline, minimal for different contexts
- **Role-Specific**: Icons match user's dynamic role
- **Accessible**: SVG-based, scalable, customizable colors

---

## Integration Points

### Notion Template Alignment

The bonds system aligns with Notion template structure:
- Bonds can be represented as parent pages in Notion
- Bond members can have individual pages within the bond structure
- Database relationships can track bond membership
- Bond-specific databases (tasks, contracts, etc.) can be nested under bond pages

### Existing Features

- **Task Assignment**: Tasks now reference `bond_id` instead of just `partner_id`
- **Submission State**: Works within bond context
- **Notifications**: Can be bond-scoped
- **Analytics**: Can aggregate by bond

---

## Migration Path

### For Existing Users

1. Existing `partner_id` relationships remain functional
2. Users can create bonds during onboarding or later
3. Partner linking in profile settings still works (creates dyad bond)
4. Gradual migration: Users join bonds as they onboard

### Data Migration (Future)

- Script to convert `partner_id` relationships to dyad bonds
- Preserve existing relationship data
- Maintain backward compatibility

---

## Security Considerations

- **RLS Policies**: Comprehensive policies ensure data isolation
- **Invite Codes**: Unique, non-guessable codes for private bonds
- **Permission System**: Granular control over bond management
- **Privacy Settings**: Users control kink identity visibility
- **Admin Override**: System admins can manage all bonds

---

## Performance Optimizations

- **Indexes**: Created on all frequently queried fields
- **GIN Indexes**: For array fields (kink_subtypes)
- **Unique Indexes**: Prevent duplicate active memberships
- **Query Optimization**: Efficient bond member lookups

---

## Next Steps

### Immediate

1. ✅ Database migrations applied
2. ✅ API endpoints created
3. ✅ UI components implemented
4. ⏳ Test bond creation/joining flow
5. ⏳ Test kink identity form submission
6. ⏳ Verify RLS policies work correctly

### Future Enhancements

1. **Bond Management UI**: Full bond management interface
2. **Member Management**: Add/remove members, change roles
3. **Bond Settings**: Update bond name, type, privacy
4. **Bond Analytics**: Aggregate analytics per bond
5. **Bond-Scoped Features**: Tasks, contracts, etc. scoped to bonds
6. **Notion Integration**: Sync bond structure to Notion
7. **Icon Refinement**: Enhanced BDSM icon designs
8. **Subtype Expansion**: Add more subtypes based on user feedback

---

## Testing Checklist

- [ ] Create new bond during onboarding
- [ ] Join existing bond with invite code
- [ ] Skip bond setup during onboarding
- [ ] Update kink identity in profile
- [ ] Verify RLS policies prevent unauthorized access
- [ ] Test invite code generation uniqueness
- [ ] Verify bond member role assignment
- [ ] Test bond status transitions
- [ ] Verify backward compatibility with partner_id

---

## Documentation References

- Research Sources: Tavily Search results on kink/BDSM terminology
- Database Rules: `.cursor/rules/database-create-rls-policies.mdc`
- Function Rules: `.cursor/rules/database-create-functions.mdc`
- Edge Function Rules: `.cursor/rules/writing-supabase-edge-functions.mdc`

---

## Conclusion

This implementation provides a robust foundation for multi-member relationship management while significantly enhancing user self-expression through comprehensive kink identity fields. The system is designed to scale from simple dyads to complex polycules while maintaining security, privacy, and user control.



