# Realtime Local Development Limitation

**Date**: 2026-01-05  
**Status**: Documented Limitation

---

## Issue

The `realtime.broadcast_changes()` function is not available in local Supabase development. This function is marked as "Public Alpha/Beta" in Supabase documentation and appears to only be available in production environments.

## Error Encountered

When running `supabase db reset`, migrations fail with:
```
ERROR: syntax error at or near "PERFORM" (SQLSTATE 42601)
```

This occurs when trying to use `PERFORM realtime.broadcast_changes(...)` in trigger functions.

## Solution

For local development, we've commented out the Realtime trigger functions in:
- `supabase/migrations/20260105070000_add_submission_state.sql`
- `supabase/migrations/20260105080000_create_tasks.sql`

The RLS policies for `realtime.messages` remain in place as they reference the `realtime.messages` table which should exist.

## Migration Strategy

### Local Development
- Realtime triggers are commented out
- Database schema and RLS policies are created
- Frontend hooks will still work but won't receive real-time updates locally
- Manual refresh will be needed to see updates

### Production Deployment
Before deploying to production, uncomment the trigger functions in both migration files:
1. Uncomment `notify_submission_state_change()` function
2. Uncomment `profiles_submission_state_broadcast_trigger` trigger
3. Uncomment `notify_task_changes()` function
4. Uncomment `tasks_broadcast_trigger` trigger

## Testing Realtime Locally

To test Realtime functionality locally, you can:
1. Deploy to production Supabase where `realtime.broadcast_changes` is available
2. Use client-side broadcasts (which work locally) for testing
3. Wait for Supabase to add local support for database broadcasts

## Files Modified

- `supabase/migrations/20260105070000_add_submission_state.sql`
- `supabase/migrations/20260105080000_create_tasks.sql`

Both files contain commented-out trigger functions with clear notes about when to uncomment them.

---

**Next Steps**: When deploying to production, uncomment the trigger functions and test Realtime functionality end-to-end.





