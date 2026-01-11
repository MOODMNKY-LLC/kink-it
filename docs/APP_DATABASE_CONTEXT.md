# KINK IT - Comprehensive Database Context

**Date**: 2026-02-12  
**Status**: ✅ Complete - All 15 Databases Documented  
**Last Updated**: 2026-02-12

---

## Overview

This document provides comprehensive context for all 15 main Supabase database tables in KINK IT, including verification procedures, sync capabilities, data recovery, and integration points.

---

## Database Inventory (15 Total)

### Core User & Relationship Databases

#### 1. **profiles** ✅
**Purpose**: User profiles and authentication data  
**Key Fields**: `id`, `email`, `display_name`, `dynamic_role`, `submission_state`, `bond_id`, `kink_identity`, `onboarding_completed`  
**Verification**: 
- Check `profiles` table exists
- Verify RLS policies for user access
- Confirm `submission_state` enum values
- Validate `dynamic_role` (dominant/submissive/switch)

**Sync**: 
- Notion: Not synced (user data only)
- Supabase Realtime: Profile updates broadcast

**Data Recovery**:
- Backup: `pg_dump` profiles table
- Restore: Import from backup with user mapping
- Recovery: Restore from Supabase backups

**Integration Points**:
- Authentication (Supabase Auth)
- Bonds system (bond_id foreign key)
- Submission state management
- Onboarding tracking

---

#### 2. **bonds** ✅
**Purpose**: D/s relationship partnerships  
**Key Fields**: `id`, `name`, `invite_code`, `status`, `created_by`, `created_at`  
**Related Tables**: `bond_members`, `bond_settings`, `bond_activity_log`, `bond_join_requests`  
**Verification**:
- Check bonds table exists
- Verify bond_members relationships
- Confirm invite_code uniqueness
- Validate RLS policies for bond access

**Sync**:
- Notion: Not synced (internal relationship data)
- Supabase Realtime: Bond updates broadcast to members

**Data Recovery**:
- Backup: Include bonds + bond_members + bond_settings
- Restore: Restore bonds first, then members, then settings
- Recovery: Restore from Supabase backups with relationship integrity

**Integration Points**:
- Profiles (bond_id foreign key)
- Tasks (bond_id filtering)
- Rules (bond_id filtering)
- Calendar events (bond_id filtering)

---

#### 3. **tasks** ✅
**Purpose**: Task management and assignment  
**Key Fields**: `id`, `title`, `description`, `status`, `priority`, `due_date`, `assigned_by`, `assigned_to`, `bond_id`, `point_value`  
**Related Tables**: `task_templates`, `task_proof`  
**Verification**:
- Check tasks table exists
- Verify status enum (pending, in_progress, completed, approved, cancelled)
- Confirm priority enum (low, medium, high, urgent)
- Validate RLS policies for role-based access

**Sync**:
- Notion: ✅ SYNC IMPLEMENTED (`tasks` database type)
- Supabase Realtime: Task updates broadcast
- Sync Route: `/api/notion/sync/tasks`

**Data Recovery**:
- Backup: Include tasks + task_proof + task_templates
- Restore: Restore tasks, then proof submissions, then templates
- Recovery: Restore from Supabase backups with proof attachments

**Integration Points**:
- Bonds (bond_id filtering)
- Profiles (assigned_by, assigned_to)
- Points ledger (point_value on completion)
- Notion Tasks database (bi-directional sync)

---

#### 4. **rules** ✅
**Purpose**: Bond rules and protocols  
**Key Fields**: `id`, `title`, `description`, `rule_type`, `bond_id`, `assigned_to`, `active`, `created_by`  
**Verification**:
- Check rules table exists
- Verify rule_type enum (standing, situational, temporary, optional)
- Confirm RLS policies for bond access
- Validate assigned_to foreign key

**Sync**:
- Notion: ✅ SYNC IMPLEMENTED (`rules` database type)
- Supabase Realtime: Rule updates broadcast
- Sync Route: `/api/notion/sync/rules`

**Data Recovery**:
- Backup: Include rules table
- Restore: Restore rules with bond_id relationships
- Recovery: Restore from Supabase backups

**Integration Points**:
- Bonds (bond_id filtering)
- Profiles (assigned_to, created_by)
- Notion Rules database (bi-directional sync)

---

#### 5. **journal_entries** ✅
**Purpose**: Personal and shared journaling  
**Key Fields**: `id`, `title`, `content`, `entry_type`, `tags`, `bond_id`, `user_id`, `is_shared`, `created_at`  
**Verification**:
- Check journal_entries table exists
- Verify entry_type enum (personal, shared, gratitude, reflection, scene_log)
- Confirm RLS policies for visibility
- Validate tags array handling

**Sync**:
- Notion: ✅ SYNC IMPLEMENTED (`journal` database type)
- Supabase Realtime: Journal entry updates broadcast
- Sync Route: `/api/notion/sync/journal`

**Data Recovery**:
- Backup: Include journal_entries table
- Restore: Restore entries with user_id and bond_id relationships
- Recovery: Restore from Supabase backups with content preservation

**Integration Points**:
- Bonds (bond_id filtering)
- Profiles (user_id)
- Notion Journal database (bi-directional sync)

---

#### 6. **calendar_events** ✅
**Purpose**: Event scheduling and scenes  
**Key Fields**: `id`, `title`, `event_type`, `start_date`, `end_date`, `bond_id`, `created_by`, `ical_uid`  
**Verification**:
- Check calendar_events table exists
- Verify event_type enum (scene, task_deadline, important_date, ritual, check_in)
- Confirm ical_uid for external calendar sync
- Validate RLS policies for bond access

**Sync**:
- Notion: ✅ SYNC IMPLEMENTED (`calendar` database type)
- Supabase Realtime: Calendar event updates broadcast
- Sync Route: `/api/notion/sync/calendar`
- External: iCal export/import via ical_uid

**Data Recovery**:
- Backup: Include calendar_events table
- Restore: Restore events with bond_id relationships
- Recovery: Restore from Supabase backups with date preservation

**Integration Points**:
- Bonds (bond_id filtering)
- Profiles (created_by)
- Notion Calendar database (bi-directional sync)
- External calendars (iCal via ical_uid)

---

#### 7. **rewards** ✅
**Purpose**: Reward tracking and management  
**Key Fields**: `id`, `title`, `description`, `reward_type`, `point_value`, `bond_id`, `assigned_by`, `assigned_to`, `status`  
**Verification**:
- Check rewards table exists
- Verify reward_type enum (verbal, points, relational, achievement)
- Confirm RLS policies for bond access
- Validate point_value calculations

**Sync**:
- Notion: ❌ DATABASE CONFIGURED, NO SYNC
- Supabase Realtime: Reward updates broadcast
- Future: Sync route to be implemented

**Data Recovery**:
- Backup: Include rewards table
- Restore: Restore rewards with bond_id relationships
- Recovery: Restore from Supabase backups

**Integration Points**:
- Bonds (bond_id filtering)
- Profiles (assigned_by, assigned_to)
- Points ledger (point_value on redemption)

---

#### 8. **points_ledger** ✅
**Purpose**: Point transaction tracking  
**Key Fields**: `id`, `user_id`, `points`, `reason`, `source_type`, `source_id`, `created_at`  
**Verification**:
- Check points_ledger table exists
- Verify source_type enum (task, reward, manual)
- Confirm points balance calculations
- Validate RLS policies for user access

**Sync**:
- Notion: ❌ DATABASE CONFIGURED, NO SYNC
- Supabase Realtime: Point transactions broadcast
- Future: Sync route to be implemented

**Data Recovery**:
- Backup: Include points_ledger table
- Restore: Restore transactions chronologically
- Recovery: Restore from Supabase backups with transaction integrity

**Integration Points**:
- Profiles (user_id)
- Tasks (source_type: task, source_id: task_id)
- Rewards (source_type: reward, source_id: reward_id)

---

#### 9. **boundaries** ✅
**Purpose**: Kink activity and boundary management  
**Key Fields**: `id`, `activity_name`, `category`, `my_rating`, `partner_rating`, `is_hard_limit`, `is_soft_limit`, `bond_id`  
**Verification**:
- Check boundaries table exists
- Verify rating enum (yes, maybe, no, hard_no)
- Confirm RLS policies for bond access
- Validate mutual visibility settings

**Sync**:
- Notion: ❌ DATABASE CONFIGURED, NO SYNC
- Supabase Realtime: Boundary updates broadcast
- Future: Sync route to be implemented

**Data Recovery**:
- Backup: Include boundaries table
- Restore: Restore boundaries with bond_id relationships
- Recovery: Restore from Supabase backups

**Integration Points**:
- Bonds (bond_id filtering)
- Profiles (my_rating, partner_rating)

---

#### 10. **contracts** ✅
**Purpose**: Version-controlled relationship contracts  
**Key Fields**: `id`, `title`, `content`, `version_number`, `status`, `bond_id`, `created_by`, `signed_at`, `expires_at`  
**Related Tables**: `contract_signatures`  
**Verification**:
- Check contracts table exists
- Verify status enum (draft, active, expired, superseded)
- Confirm version_number tracking
- Validate RLS policies for bond access

**Sync**:
- Notion: ✅ SYNC IMPLEMENTED (`contracts` database type)
- Supabase Realtime: Contract updates broadcast
- Sync Route: `/api/notion/sync/contracts`

**Data Recovery**:
- Backup: Include contracts + contract_signatures
- Restore: Restore contracts, then signatures
- Recovery: Restore from Supabase backups with version history

**Integration Points**:
- Bonds (bond_id filtering)
- Profiles (created_by)
- Contract signatures (contract_id foreign key)
- Notion Contracts database (bi-directional sync)

---

#### 11. **scenes** ✅
**Purpose**: Scene documentation and logging  
**Key Fields**: `id`, `title`, `scene_date`, `duration_minutes`, `activities`, `consent_details`, `aftercare_provided`, `bond_id`, `created_by`  
**Related Tables**: `scene_compositions`, `character_poses`  
**Verification**:
- Check scenes table exists
- Verify activities JSONB structure
- Confirm RLS policies for bond access
- Validate scene_date timestamps

**Sync**:
- Notion: ❌ DATABASE CONFIGURED, NO SYNC
- Supabase Realtime: Scene updates broadcast
- Future: Sync route to be implemented

**Data Recovery**:
- Backup: Include scenes + scene_compositions + character_poses
- Restore: Restore scenes, then compositions, then poses
- Recovery: Restore from Supabase backups with JSONB preservation

**Integration Points**:
- Bonds (bond_id filtering)
- Profiles (created_by)
- Journal entries (scene_log entry_type)

---

#### 12. **resources** ✅
**Purpose**: Educational content and bookmarks  
**Key Fields**: `id`, `title`, `url`, `resource_type`, `category`, `description`, `tags`, `user_id`, `shared_with_partner`  
**Verification**:
- Check resources table exists
- Verify resource_type enum (article, video, book, tool, other)
- Confirm RLS policies for user access
- Validate URL format

**Sync**:
- Notion: ❌ DATABASE CONFIGURED, NO SYNC
- Supabase Realtime: Resource updates broadcast
- Future: Sync route to be implemented

**Data Recovery**:
- Backup: Include resources table
- Restore: Restore resources with user_id relationships
- Recovery: Restore from Supabase backups

**Integration Points**:
- Profiles (user_id)
- Bonds (shared_with_partner filtering)

---

#### 13. **check_ins** ✅
**Purpose**: Daily check-ins and communication  
**Key Fields**: `id`, `status`, `notes`, `bond_id`, `user_id`, `created_at`  
**Verification**:
- Check check_ins table exists
- Verify status enum (green, yellow, red)
- Confirm RLS policies for bond access
- Validate date-based queries

**Sync**:
- Notion: ❌ DATABASE CONFIGURED, NO SYNC (communication database type)
- Supabase Realtime: Check-in updates broadcast
- Future: Sync route to be implemented

**Data Recovery**:
- Backup: Include check_ins table
- Restore: Restore check-ins chronologically
- Recovery: Restore from Supabase backups

**Integration Points**:
- Bonds (bond_id filtering)
- Profiles (user_id)
- Notifications (check-in alerts)

---

#### 14. **messages** ✅
**Purpose**: Private messaging between partners  
**Key Fields**: `id`, `content`, `from_user_id`, `to_user_id`, `bond_id`, `read_at`, `created_at`  
**Related Tables**: `ai_message_attachments` (for chat attachments)  
**Verification**:
- Check messages table exists
- Verify RLS policies for bond access
- Confirm read_at timestamp handling
- Validate attachment relationships

**Sync**:
- Notion: ❌ DATABASE CONFIGURED, NO SYNC (communication database type)
- Supabase Realtime: ✅ Message updates broadcast
- Future: Sync route to be implemented

**Data Recovery**:
- Backup: Include messages + ai_message_attachments
- Restore: Restore messages, then attachments
- Recovery: Restore from Supabase backups with attachment URLs

**Integration Points**:
- Bonds (bond_id filtering)
- Profiles (from_user_id, to_user_id)
- Conversations (conversation_id foreign key)
- Chat attachments (ai_message_attachments)

---

#### 15. **kinksters** ✅ **NEW**
**Purpose**: AI character profiles and chat companions  
**Key Fields**: `id`, `name`, `display_name`, `role`, `pronouns`, `archetype`, `bio`, `backstory`, `personality_traits`, `top_kinks`, `hard_limits`, `soft_limits`, `experience_level`, `body_type`, `height`, `build`, `hair_color`, `hair_style`, `eye_color`, `skin_tone`, `facial_hair`, `age_range`, `clothing_style`, `favorite_colors`, `fetish_wear`, `aesthetic`, `stats` (JSONB), `avatar_urls`, `provider` (flowise/openai_responses), `openai_model`, `openai_instructions`, `flowise_chatflow_id`, `preset_id`, `user_id`, `is_primary`, `created_at`, `updated_at`  
**Related Tables**: `kinkster_creation_sessions`  
**Verification**:
- Check kinksters table exists
- Verify role enum (dominant, submissive, switch)
- Confirm provider enum (flowise, openai_responses)
- Validate stats JSONB structure (dominance, submission, charisma, stamina, creativity, control)
- Check avatar_urls array handling
- Verify RLS policies for user access
- Confirm provider-specific fields (openai_model, flowise_chatflow_id)

**Sync**:
- Notion: ✅ SYNC IMPLEMENTED (`kinkster_profiles` database type)
- Supabase Realtime: ✅ Kinkster updates broadcast
- Sync Route: `/api/notion/sync/kinksters`
- Multi-Database Sync: ✅ Implemented (`kinkster_multi_database_sync` migration)

**Data Recovery**:
- Backup: Include kinksters + kinkster_creation_sessions
- Restore: Restore kinksters with user_id relationships
- Recovery: Restore from Supabase backups with avatar URLs preserved
- Avatar Recovery: Restore from Supabase Storage (`kinkster-avatars` bucket)

**Integration Points**:
- Profiles (user_id)
- Notion Kinkster Profiles database (bi-directional sync)
- Chat system (`/api/kinksters/chat` for OpenAI Responses API, `/api/flowise/chat` for Flowise)
- Avatar generation (DALL-E 3 via `/api/kinksters/generate-avatar`)
- Preset system (preset_id foreign key to preset_config)
- Storage: `kinkster-avatars` bucket for avatar images

**Special Features**:
- **Hybrid Mode**: Supports both Flowise and OpenAI Responses API providers
- **Avatar Management**: Multiple avatar URLs, preset images, DALL-E generation
- **Stats System**: 6 stat categories with point allocation
- **Provider Configuration**: Per-Kinkster AI provider selection
- **Conversation Continuity**: OpenAI Responses API uses `openai_previous_response_id`

---

## Verification Procedures

### Database Existence Check
```sql
-- Verify all 15 main tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'profiles', 'bonds', 'tasks', 'rules', 'journal_entries',
  'calendar_events', 'rewards', 'points_ledger', 'boundaries',
  'contracts', 'scenes', 'resources', 'check_ins', 'messages', 'kinksters'
)
ORDER BY table_name;
```

### RLS Policy Verification
```sql
-- Check RLS is enabled on all tables
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN (
  'profiles', 'bonds', 'tasks', 'rules', 'journal_entries',
  'calendar_events', 'rewards', 'points_ledger', 'boundaries',
  'contracts', 'scenes', 'resources', 'check_ins', 'messages', 'kinksters'
);
```

### Foreign Key Integrity Check
```sql
-- Verify foreign key relationships
SELECT
  tc.table_name, 
  kcu.column_name, 
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_schema = 'public'
ORDER BY tc.table_name;
```

---

## Sync Status Summary

### Fully Synced with Notion (7 databases)
1. ✅ `tasks` - Bi-directional sync
2. ✅ `rules` - Bi-directional sync
3. ✅ `journal_entries` - Bi-directional sync
4. ✅ `calendar_events` - Bi-directional sync
5. ✅ `contracts` - Bi-directional sync
6. ✅ `image_generations` - Bi-directional sync
7. ✅ `kinksters` - Bi-directional sync (multi-database support)

### Configured but Not Synced (8 databases)
1. ❌ `boundaries` - Database configured, sync route pending
2. ❌ `rewards` - Database configured, sync route pending
3. ❌ `points_ledger` - Database configured, sync route pending
4. ❌ `scenes` - Database configured, sync route pending
5. ❌ `resources` - Database configured, sync route pending
6. ❌ `check_ins` - Database configured, sync route pending
7. ❌ `messages` - Database configured, sync route pending
8. ❌ `analytics` - Database configured, sync route pending

---

## Data Recovery Procedures

### Full Database Backup
```bash
# Backup all 15 main tables
pg_dump -h <host> -U <user> -d <database> \
  -t profiles -t bonds -t tasks -t rules -t journal_entries \
  -t calendar_events -t rewards -t points_ledger -t boundaries \
  -t contracts -t scenes -t resources -t check_ins -t messages -t kinksters \
  > kink-it-backup-$(date +%Y%m%d).sql
```

### Selective Table Restore
```sql
-- Restore specific table from backup
\i kink-it-backup-20260212.sql

-- Or restore via Supabase Dashboard
-- Database → Backups → Restore Point → Select Tables
```

### Kinksters-Specific Recovery
```bash
# 1. Restore kinksters table
pg_restore -t kinksters kink-it-backup-20260212.sql

# 2. Restore avatar images from Storage
# Use Supabase Dashboard → Storage → kinkster-avatars → Download

# 3. Verify avatar URLs
SELECT id, name, avatar_urls FROM kinksters WHERE avatar_urls IS NOT NULL;
```

---

## Integration Points Summary

### Authentication & Profiles
- **Supabase Auth** → `profiles` table
- **Onboarding** → `profiles.onboarding_completed`
- **Submission State** → `profiles.submission_state`

### Relationship Management
- **Bonds** → Central relationship hub
- **Bond Members** → Multi-user relationships
- **Bond Settings** → Relationship configuration

### Content Management
- **Tasks** → Task assignment and tracking
- **Rules** → Protocol and rule management
- **Journal** → Personal and shared entries
- **Calendar** → Event scheduling
- **Scenes** → Scene documentation

### Communication
- **Messages** → Private messaging
- **Check-ins** → Daily status updates
- **Conversations** → AI chat threads

### AI & Characters
- **Kinksters** → AI character profiles
- **Conversations** → Chat history
- **Messages** → Chat messages
- **Agent Sessions** → AI session tracking

### Rewards & Points
- **Rewards** → Reward tracking
- **Points Ledger** → Point transactions

### Contracts & Boundaries
- **Contracts** → Relationship contracts
- **Boundaries** → Kink boundaries

### Resources & Analytics
- **Resources** → Educational content
- **Analytics** → Progress tracking (future)

---

## Next Steps

1. ✅ **Documentation**: All 15 databases documented
2. ⏳ **Sync Implementation**: Implement sync routes for 8 pending databases
3. ⏳ **Verification Scripts**: Create automated verification scripts
4. ⏳ **Recovery Testing**: Test data recovery procedures
5. ⏳ **Monitoring**: Set up database health monitoring

---

**Document Status**: ✅ Complete  
**Last Updated**: 2026-02-12  
**Maintained By**: Development Team
