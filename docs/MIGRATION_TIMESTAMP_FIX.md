# Migration Timestamp Conflict Fix ✅

## Problem

Multiple migrations had duplicate timestamps, causing a unique constraint violation:
\`\`\`
ERROR: duplicate key value violates unique constraint "schema_migrations_pkey"
Key (version)=(20260131000005) already exists.
\`\`\`

## Root Cause

Two migrations were created with the same timestamp `20260131000005`:
1. `20260131000005_create_ai_chat_system.sql`
2. `20260131000005_create_task_proof_storage_bucket.sql`

Additionally, there were duplicates at `20260131000006`:
1. `20260131000006_add_chat_realtime_policies.sql`
2. `20260131000006_fix_bond_settings_trigger_rls.sql`

## Solution

Renamed migrations to have unique, sequential timestamps:

### Renamed Files:
1. `20260131000005_create_task_proof_storage_bucket.sql` → `20260131000006_create_task_proof_storage_bucket.sql`
2. `20260131000006_add_chat_realtime_policies.sql` → `20260131000007_add_chat_realtime_policies.sql`
3. `20260131000006_fix_bond_settings_trigger_rls.sql` → `20260131000008_fix_bond_settings_trigger_rls.sql`
4. `20260131000007_add_bond_settings_insert_policy.sql` → `20260131000009_add_bond_settings_insert_policy.sql`
5. `20260131000008_add_system_kinksters.sql` → `20260131000010_add_system_kinksters.sql`
6. `20260131000009_create_saved_prompts.sql` → `20260131000011_create_saved_prompts.sql`

## Final Migration Order (2026-01-31)

1. `20260131000000_create_user_notion_api_keys.sql`
2. `20260131000001_create_kinksters_system.sql`
3. `20260131000002_create_kinkster_storage_bucket.sql`
4. `20260131000003_create_avatar_management_functions.sql`
5. `20260131000004_add_avatar_realtime_policies.sql`
6. `20260131000005_create_ai_chat_system.sql`
7. `20260131000006_create_task_proof_storage_bucket.sql` ✅ (renamed)
8. `20260131000007_add_chat_realtime_policies.sql` ✅ (renamed)
9. `20260131000008_fix_bond_settings_trigger_rls.sql` ✅ (renamed)
10. `20260131000009_add_bond_settings_insert_policy.sql` ✅ (renamed)
11. `20260131000010_add_system_kinksters.sql` ✅ (renamed)
12. `20260131000011_create_saved_prompts.sql` ✅ (renamed)

## Next Steps

After fixing the migration timestamps, restart Supabase:

\`\`\`bash
supabase stop
supabase start
\`\`\`

The migrations should now apply in order without conflicts.

## Prevention

When creating new migrations, always check existing timestamps:

\`\`\`bash
Get-ChildItem -Path "supabase/migrations" -Filter "*.sql" | Sort-Object Name | Select-Object Name
\`\`\`

Use a unique timestamp format: `YYYYMMDDHHMMSS_description.sql`
