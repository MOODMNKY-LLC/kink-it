# Seed Data Testing Guide

**Date**: 2026-02-15  
**Purpose**: Comprehensive testing guide for seed data migration  
**Migration File**: `supabase/migrations/20260215000007_create_comprehensive_seed_data.sql`

---

## Pre-Migration Checklist

### Prerequisites Verification

Before running the seed data migration, verify:

- [ ] **Users Exist**: 
  - Simeon: `00000000-0000-0000-0000-000000000001`
  - Kevin: `00000000-0000-0000-0000-000000000002`

- [ ] **Profiles Exist**: Both users have profiles in `public.profiles`

- [ ] **Bonds System**: Migration `20260129000000_create_bonds_system.sql` has run

- [ ] **MVP Tables**: Migration `20260202000000_create_mvp_tables.sql` has run
  - Rules table exists
  - Boundaries table exists
  - Contracts table exists
  - Journal entries table exists
  - Calendar events table exists
  - Resources table exists

- [ ] **Communication Hub**: Migration `20260108000000_create_communication_hub.sql` has run
  - Partner messages table exists
  - Check-ins table exists
  - Conversation prompts table exists
  - Scene debriefs table exists

- [ ] **Tasks System**: Migration `20260105080000_create_tasks.sql` has run
  - Tasks table exists
  - Task proof table exists

- [ ] **Rewards System**: Migration `20260105140000_create_rewards.sql` has run
  - Rewards table exists
  - Points ledger table exists

- [ ] **Achievements System**: Migration `20260110065122_create_achievements_system.sql` has run
  - Achievements table exists
  - User achievements table exists

### Migration Order

The seed data migration should run **after** these migrations:

1. `20260129000000_create_bonds_system.sql` (Bonds system)
2. `20260130000000_enhance_bonds_comprehensive.sql` (Bond enhancements)
3. `20260202000000_create_mvp_tables.sql` (Rules, Boundaries, Contracts, Journal, Calendar, Resources)
4. `20260108000000_create_communication_hub.sql` (Communication tables)
5. `20260105080000_create_tasks.sql` (Tasks system)
6. `20260105140000_create_rewards.sql` (Rewards system)
7. `20260110065122_create_achievements_system.sql` (Achievements system)

**Migration Number**: `20260215000007` ensures it runs after all required migrations.

---

## SQL Syntax Verification

### Enum Type Verification

Verify all enum types match schema:

- [ ] `bond_type`: 'dyad', 'polycule', 'household', 'dynamic'
- [ ] `bond_status`: 'active', 'inactive', 'paused', 'archived'
- [ ] `rule_category`: 'standing', 'situational', 'temporary', 'protocol'
- [ ] `rule_status`: 'active', 'inactive', 'archived'
- [ ] `activity_category`: 'impact', 'rope', 'sensation', 'power_exchange', 'roleplay', 'other'
- [ ] `boundary_rating`: 'yes', 'maybe', 'no', 'hard_no'
- [ ] `experience_level`: 'none', 'curious', 'some', 'experienced', 'expert'
- [ ] `contract_status`: 'draft', 'pending_signature', 'active', 'archived', 'superseded'
- [ ] `signature_status`: 'pending', 'signed', 'declined'
- [ ] `check_in_status`: 'green', 'yellow', 'red', 'blue'
- [ ] `event_type`: 'scene', 'task_deadline', 'check_in', 'ritual', 'milestone', 'other'
- [ ] `journal_entry_type`: 'personal', 'shared', 'gratitude', 'scene_log'
- [ ] `resource_type`: 'article', 'video', 'book', 'podcast', 'forum', 'guide', 'other'
- [ ] `resource_category`: 'education', 'safety', 'technique', 'community', 'legal', 'other'
- [ ] `reward_type`: 'verbal', 'points', 'relational', 'achievement'
- [ ] `reward_status`: 'available', 'redeemed', 'completed', 'in_progress'

### UUID Format Verification

- [ ] All UUIDs use proper format: `'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'::uuid`
- [ ] No duplicate UUIDs across tables
- [ ] Foreign key UUIDs reference existing records

### Foreign Key Verification

- [ ] All `bond_id` references exist in `public.bonds`
- [ ] All `user_id` references exist in `public.profiles`
- [ ] All `created_by` references exist in `public.profiles`
- [ ] All `contract_id` references exist in `public.contracts`
- [ ] All `task_id` references exist in `public.tasks` (if applicable)

### ON CONFLICT Handling

- [ ] All INSERT statements use `ON CONFLICT (id) DO NOTHING`
- [ ] Safe to re-run migration multiple times

---

## Migration Execution

### Step 1: Backup Database

```bash
# Create backup before running migration
supabase db dump -f backup_before_seed_data.sql
```

### Step 2: Run Migration

```bash
# Run migration
supabase migration up

# Or run specific migration
supabase db reset  # Resets and runs all migrations
```

### Step 3: Verify Migration Success

Check migration logs for errors:

```sql
-- Check migration status
SELECT * FROM supabase_migrations.schema_migrations 
WHERE name = '20260215000007_create_comprehensive_seed_data.sql';
```

---

## Post-Migration Verification Queries

### Module 1: Bonds

```sql
-- Verify bond created
SELECT id, name, bond_type, bond_status 
FROM public.bonds 
WHERE id = '40000000-0000-0000-0000-000000000001'::uuid;

-- Verify bond members
SELECT bm.id, bm.bond_id, bm.user_id, bm.role_in_bond, bm.is_active
FROM public.bond_members bm
WHERE bm.bond_id = '40000000-0000-0000-0000-000000000001'::uuid;
```

**Expected Results**:
- 1 bond: "Simeon & Kevin's Dynamic"
- 2 bond members (Simeon as dominant, Kevin as submissive)

### Module 2: Rules & Protocols

```sql
-- Verify rules created
SELECT id, title, category, status, priority
FROM public.rules
WHERE bond_id = '40000000-0000-0000-0000-000000000001'::uuid
ORDER BY priority DESC;
```

**Expected Results**: 8 rules total

### Module 3: Boundaries

```sql
-- Verify boundaries created
SELECT id, activity_name, category, user_rating, partner_rating
FROM public.boundaries
WHERE bond_id = '40000000-0000-0000-0000-000000000001'::uuid
ORDER BY category;
```

**Expected Results**: 15 activities across all categories

### Module 4: Contracts

```sql
-- Verify contract created
SELECT id, title, version, status
FROM public.contracts
WHERE bond_id = '40000000-0000-0000-0000-000000000001'::uuid;

-- Verify signatures
SELECT cs.id, cs.contract_id, cs.user_id, cs.signature_status
FROM public.contract_signatures cs
JOIN public.contracts c ON c.id = cs.contract_id
WHERE c.bond_id = '40000000-0000-0000-0000-000000000001'::uuid;
```

**Expected Results**: 1 contract, 2 signatures

### Module 5: Communication

```sql
-- Verify messages
SELECT COUNT(*) FROM public.partner_messages
WHERE workspace_id = '00000000-0000-0000-0000-000000000001'::uuid;

-- Verify check-ins
SELECT COUNT(*) FROM public.check_ins
WHERE workspace_id = '00000000-0000-0000-0000-000000000001'::uuid;

-- Verify conversation prompts
SELECT COUNT(*) FROM public.conversation_prompts
WHERE workspace_id = '00000000-0000-0000-0000-000000000001'::uuid;

-- Verify scene debriefs
SELECT COUNT(*) FROM public.scene_debriefs
WHERE workspace_id = '00000000-0000-0000-0000-000000000001'::uuid;
```

**Expected Results**: 3 messages, 4 check-ins, 7 prompts, 1 debrief

### Module 6: Tasks

```sql
-- Verify tasks created
SELECT id, title, task_type, status, priority
FROM public.tasks
WHERE workspace_id = '00000000-0000-0000-0000-000000000001'::uuid
ORDER BY priority DESC;

-- Verify task proofs
SELECT COUNT(*) FROM public.task_proof
WHERE task_id IN (
  SELECT id FROM public.tasks 
  WHERE workspace_id = '00000000-0000-0000-0000-000000000001'::uuid
);
```

**Expected Results**: 8 tasks, 3 proofs

### Module 7: Rewards

```sql
-- Verify rewards created
SELECT id, reward_type, title, status
FROM public.rewards
WHERE workspace_id = '00000000-0000-0000-0000-000000000001'::uuid;

-- Verify points ledger entries
SELECT COUNT(*) FROM public.points_ledger
WHERE workspace_id = '00000000-0000-0000-0000-000000000001'::uuid;
```

**Expected Results**: 5 rewards, 6 ledger entries

### Module 8: Achievements

```sql
-- Verify achievement unlocks
SELECT ua.id, ua.achievement_code, ua.unlocked_at
FROM public.user_achievements ua
WHERE ua.user_id = '00000000-0000-0000-0000-000000000002'::uuid
AND ua.bond_id = '40000000-0000-0000-0000-000000000001'::uuid;
```

**Expected Results**: 4 achievement unlocks

### Module 9: Calendar

```sql
-- Verify calendar events
SELECT id, title, event_type, start_time, end_time
FROM public.calendar_events
WHERE bond_id = '40000000-0000-0000-0000-000000000001'::uuid
ORDER BY start_time;
```

**Expected Results**: 5 events

### Module 10: Journal

```sql
-- Verify journal entries
SELECT id, title, entry_type, created_by
FROM public.journal_entries
WHERE bond_id = '40000000-0000-0000-0000-000000000001'::uuid
ORDER BY created_at DESC;
```

**Expected Results**: 5 entries

### Module 11: Analytics

```sql
-- Analytics are calculated from data
-- Verify data exists for analytics calculation
SELECT 
  (SELECT COUNT(*) FROM public.tasks WHERE workspace_id = '00000000-0000-0000-0000-000000000001'::uuid) as task_count,
  (SELECT COUNT(*) FROM public.check_ins WHERE workspace_id = '00000000-0000-0000-0000-000000000001'::uuid) as check_in_count,
  (SELECT COUNT(*) FROM public.points_ledger WHERE workspace_id = '00000000-0000-0000-0000-000000000001'::uuid) as points_count;
```

**Expected Results**: Data exists for analytics calculation

### Module 12: Library

```sql
-- Verify resources created
SELECT id, title, resource_type, category
FROM public.resources
WHERE bond_id = '40000000-0000-0000-0000-000000000001'::uuid
ORDER BY category;
```

**Expected Results**: 7 resources

---

## Data Integrity Checks

### Foreign Key Integrity

```sql
-- Check for orphaned records
SELECT 'bond_members' as table_name, COUNT(*) as orphaned_count
FROM public.bond_members bm
WHERE NOT EXISTS (SELECT 1 FROM public.bonds b WHERE b.id = bm.bond_id)
UNION ALL
SELECT 'rules', COUNT(*)
FROM public.rules r
WHERE NOT EXISTS (SELECT 1 FROM public.bonds b WHERE b.id = r.bond_id)
UNION ALL
SELECT 'boundaries', COUNT(*)
FROM public.boundaries b
WHERE NOT EXISTS (SELECT 1 FROM public.bonds b2 WHERE b2.id = b.bond_id)
UNION ALL
SELECT 'contracts', COUNT(*)
FROM public.contracts c
WHERE NOT EXISTS (SELECT 1 FROM public.bonds b WHERE b.id = c.bond_id);
```

**Expected Results**: All counts should be 0 (no orphaned records)

### User Reference Integrity

```sql
-- Check user references
SELECT 'bond_members' as table_name, COUNT(*) as invalid_user_count
FROM public.bond_members bm
WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = bm.user_id)
UNION ALL
SELECT 'rules', COUNT(*)
FROM public.rules r
WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = r.created_by)
UNION ALL
SELECT 'contracts', COUNT(*)
FROM public.contracts c
WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = c.created_by);
```

**Expected Results**: All counts should be 0 (all user references valid)

---

## RLS Policy Testing

### Test Dominant Access

```sql
-- Set auth context to Simeon (dominant)
SET LOCAL role TO authenticated;
SET LOCAL request.jwt.claim.sub TO '00000000-0000-0000-0000-000000000001'::uuid;

-- Test viewing rules
SELECT COUNT(*) FROM public.rules 
WHERE bond_id = '40000000-0000-0000-0000-000000000001'::uuid;

-- Test viewing boundaries
SELECT COUNT(*) FROM public.boundaries 
WHERE bond_id = '40000000-0000-0000-0000-000000000001'::uuid;

-- Test viewing journal entries (should see submissive's personal entries)
SELECT COUNT(*) FROM public.journal_entries 
WHERE bond_id = '40000000-0000-0000-0000-000000000001'::uuid;
```

### Test Submissive Access

```sql
-- Set auth context to Kevin (submissive)
SET LOCAL role TO authenticated;
SET LOCAL request.jwt.claim.sub TO '00000000-0000-0000-0000-000000000002'::uuid;

-- Test viewing rules (should see all)
SELECT COUNT(*) FROM public.rules 
WHERE bond_id = '40000000-0000-0000-0000-000000000001'::uuid;

-- Test viewing boundaries (should see all)
SELECT COUNT(*) FROM public.boundaries 
WHERE bond_id = '40000000-0000-0000-0000-000000000001'::uuid;

-- Test viewing journal entries (should see own + shared)
SELECT COUNT(*) FROM public.journal_entries 
WHERE bond_id = '40000000-0000-0000-0000-000000000001'::uuid;
```

---

## UI Testing Checklist

### Module Display Tests

- [ ] **Bonds Module**
  - [ ] Bond displays correctly
  - [ ] Bond members show correct roles
  - [ ] Metadata displays properly

- [ ] **Rules & Protocols Module**
  - [ ] All 8 rules display
  - [ ] Rules sorted by priority
  - [ ] Categories display correctly
  - [ ] Status indicators work

- [ ] **Boundaries Module**
  - [ ] All 15 activities display
  - [ ] Categories filter correctly
  - [ ] Ratings display properly
  - [ ] Compatibility view works

- [ ] **Contracts Module**
  - [ ] Contract displays correctly
  - [ ] Signatures show properly
  - [ ] Version history displays

- [ ] **Communication Module**
  - [ ] Messages display correctly
  - [ ] Check-ins show status colors
  - [ ] Prompts list properly
  - [ ] Scene debrief displays

- [ ] **Tasks Module**
  - [ ] All 8 tasks display
  - [ ] Task proofs show correctly
  - [ ] Status indicators work
  - [ ] Priority sorting works

- [ ] **Rewards Module**
  - [ ] All 5 rewards display
  - [ ] Points ledger shows correctly
  - [ ] Reward types display properly

- [ ] **Achievements Module**
  - [ ] Achievement unlocks display
  - [ ] Progress indicators work

- [ ] **Calendar Module**
  - [ ] All 5 events display
  - [ ] Event types show correctly
  - [ ] Reminders work

- [ ] **Journal Module**
  - [ ] All 5 entries display
  - [ ] Entry types show correctly
  - [ ] Transparency default works (Dominant sees personal entries)

- [ ] **Analytics Module**
  - [ ] Analytics calculate correctly
  - [ ] Charts display properly
  - [ ] Role-based views work

- [ ] **Library Module**
  - [ ] All 7 resources display
  - [ ] Categories filter correctly
  - [ ] Resource types show properly

### Edit/Delete Tests

- [ ] **Edit Seed Data**
  - [ ] Can edit bond details
  - [ ] Can edit rules
  - [ ] Can edit boundaries
  - [ ] Can edit contracts
  - [ ] Can edit tasks
  - [ ] Can edit rewards
  - [ ] Can edit journal entries
  - [ ] Can edit resources

- [ ] **Delete Seed Data**
  - [ ] Can delete rules
  - [ ] Can delete boundaries
  - [ ] Can delete tasks
  - [ ] Can delete journal entries
  - [ ] Can delete resources
  - [ ] Cascade deletes work correctly

### Role-Based View Tests

- [ ] **Dominant View**
  - [ ] Sees all bond data
  - [ ] Can see submissive's personal journal entries
  - [ ] Can create/edit rules
  - [ ] Can create/edit contracts
  - [ ] Can assign tasks
  - [ ] Can create rewards

- [ ] **Submissive View**
  - [ ] Sees all bond data
  - [ ] Can see own journal entries + shared
  - [ ] Cannot edit rules (read-only)
  - [ ] Can sign contracts
  - [ ] Can complete tasks
  - [ ] Can view rewards

### Cross-Module Reference Tests

- [ ] **Rules → Tasks**: Protocol-linked tasks reference rules correctly
- [ ] **Tasks → Rewards**: Task completion links to rewards correctly
- [ ] **Contracts → Rules**: Contracts reference rules correctly
- [ ] **Calendar → Tasks**: Task deadlines appear on calendar
- [ ] **Journal → Scenes**: Scene logs reference calendar events

---

## Common Issues & Solutions

### Issue: Foreign Key Violations

**Symptoms**: Migration fails with foreign key constraint errors

**Solutions**:
1. Verify prerequisite migrations have run
2. Verify users exist in `public.profiles`
3. Verify bond exists before inserting related data
4. Check UUID format matches exactly

### Issue: Enum Type Errors

**Symptoms**: Migration fails with "invalid input value for enum" errors

**Solutions**:
1. Verify enum values match schema exactly
2. Check for typos in enum casting (e.g., `'protocol'::rule_category`)
3. Ensure enum types exist in database

### Issue: Duplicate Key Violations

**Symptoms**: Migration fails with unique constraint violations

**Solutions**:
1. Check if seed data already exists
2. Verify `ON CONFLICT DO NOTHING` is working
3. Check for duplicate UUIDs in migration file

### Issue: RLS Policy Blocks

**Symptoms**: Data exists but not visible in UI

**Solutions**:
1. Verify RLS policies allow access
2. Check auth context is set correctly
3. Verify user is member of bond
4. Check role permissions

---

## Performance Testing

### Migration Performance

- [ ] Migration completes in < 30 seconds
- [ ] No timeout errors
- [ ] Database connections remain stable

### Query Performance

- [ ] Module queries complete in < 1 second
- [ ] No N+1 query issues
- [ ] Indexes are used effectively

---

## Rollback Plan

If migration fails or causes issues:

```sql
-- Delete all seed data (if needed)
DELETE FROM public.resources WHERE bond_id = '40000000-0000-0000-0000-000000000001'::uuid;
DELETE FROM public.journal_entries WHERE bond_id = '40000000-0000-0000-0000-000000000001'::uuid;
DELETE FROM public.calendar_events WHERE bond_id = '40000000-0000-0000-0000-000000000001'::uuid;
DELETE FROM public.user_achievements WHERE bond_id = '40000000-0000-0000-0000-000000000001'::uuid;
DELETE FROM public.points_ledger WHERE workspace_id = '00000000-0000-0000-0000-000000000001'::uuid;
DELETE FROM public.rewards WHERE workspace_id = '00000000-0000-0000-0000-000000000001'::uuid;
DELETE FROM public.task_proof WHERE task_id IN (SELECT id FROM public.tasks WHERE workspace_id = '00000000-0000-0000-0000-000000000001'::uuid);
DELETE FROM public.tasks WHERE workspace_id = '00000000-0000-0000-0000-000000000001'::uuid;
DELETE FROM public.scene_debriefs WHERE workspace_id = '00000000-0000-0000-0000-000000000001'::uuid;
DELETE FROM public.conversation_prompts WHERE workspace_id = '00000000-0000-0000-0000-000000000001'::uuid;
DELETE FROM public.check_ins WHERE workspace_id = '00000000-0000-0000-0000-000000000001'::uuid;
DELETE FROM public.partner_messages WHERE workspace_id = '00000000-0000-0000-0000-000000000001'::uuid;
DELETE FROM public.contract_signatures WHERE contract_id IN (SELECT id FROM public.contracts WHERE bond_id = '40000000-0000-0000-0000-000000000001'::uuid);
DELETE FROM public.contracts WHERE bond_id = '40000000-0000-0000-0000-000000000001'::uuid;
DELETE FROM public.boundaries WHERE bond_id = '40000000-0000-0000-0000-000000000001'::uuid;
DELETE FROM public.rules WHERE bond_id = '40000000-0000-0000-0000-000000000001'::uuid;
DELETE FROM public.bond_members WHERE bond_id = '40000000-0000-0000-0000-000000000001'::uuid;
DELETE FROM public.bonds WHERE id = '40000000-0000-0000-0000-000000000001'::uuid;
```

---

## Success Criteria

### Migration Success ✅
- [ ] Migration runs without errors
- [ ] All data inserts successfully
- [ ] No foreign key violations
- [ ] No enum type errors
- [ ] All ON CONFLICT clauses work

### Data Integrity ✅
- [ ] All foreign keys valid
- [ ] All user references valid
- [ ] No orphaned records
- [ ] All UUIDs unique

### RLS Policies ✅
- [ ] Dominant can view all data
- [ ] Submissive can view appropriate data
- [ ] Role-based permissions work
- [ ] Journal transparency default works

### UI Display ✅
- [ ] All modules display seed data
- [ ] Edit/delete functions work
- [ ] Role-based views correct
- [ ] Cross-module references work

---

## Testing Checklist Summary

**Pre-Migration**: ✅ Prerequisites verified  
**Migration Execution**: ⏳ Ready to test  
**Post-Migration Verification**: ⏳ Ready to test  
**RLS Testing**: ⏳ Ready to test  
**UI Testing**: ⏳ Ready to test  

---

**Status**: Testing guide complete - Ready for migration execution
