# Seed Data Guide

**Date**: 2026-01-05  
**Purpose**: Create test data for local development and testing

---

## Overview

We have two methods for seeding the database:

1. **SQL Seed File** (`supabase/seed.sql`) - Runs automatically after `supabase db reset`
2. **TypeScript Seed Script** (`scripts/seed-db.ts`) - More flexible, uses Supabase Admin API

---

## Method 1: SQL Seed File (Automatic)

The `supabase/seed.sql` file runs automatically when you execute:

```bash
supabase db reset
```

**Note**: This method attempts to insert directly into `auth.users`, which may not work in all Supabase setups. If you encounter issues, use Method 2.

---

## Method 2: TypeScript Seed Script (Recommended)

### Prerequisites

Install required dependencies:

```bash
pnpm add -D tsx dotenv
```

### Usage

Run the seed script:

```bash
pnpm seed
```

Or reset database and seed in one command:

```bash
pnpm seed:reset
```

### Manual Execution

```bash
# Get service role key from Supabase status
supabase status

# Run seed script with explicit environment variables
SUPABASE_URL=http://127.0.0.1:55321 \
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key \
pnpm tsx scripts/seed-db.ts
```

---

## Test Users Created

### Simeon (Dominant, Admin)
- **Email**: `simeon@kinkit.app`
- **Password**: `password123`
- **Role**: Dominant, Admin
- **Partner**: Kevin

### Kevin (Submissive)
- **Email**: `kevin@kinkit.app`
- **Password**: `password123`
- **Role**: Submissive
- **Partner**: Simeon
- **Submission State**: `active`

---

## Seed Data Created

### Profiles
- ✅ 2 profiles (Simeon, Kevin)
- ✅ Partner relationships configured
- ✅ Love languages, limits configured

### Submission State Logs
- ✅ 1 initial log entry for Kevin (active state)

### Task Templates
- ✅ 3 templates:
  - Daily Check-In (text proof)
  - Exercise Routine (photo proof)
  - Protocol Review (text proof)

### Tasks
- ✅ 6 sample tasks:
  - **Pending**: Morning Routine (high priority)
  - **In Progress**: Daily Check-In (medium priority)
  - **Completed**: Exercise Routine (high priority, awaiting approval)
  - **Approved**: Protocol Review (medium priority)
  - **Pending**: Read Article (low priority)
  - **Pending**: Immediate Check-In (urgent priority)

### Task Proof
- ✅ 2 proof submissions:
  - Exercise Routine (photo)
  - Protocol Review (text)

---

## Testing with Seed Data

### 1. Login as Simeon (Dominant)
```bash
# Navigate to: http://127.0.0.1:3000/auth/login
# Email: simeon@kinkit.app
# Password: password123
```

**Expected**:
- Dashboard shows Kevin's submission state
- Tasks page shows all 6 tasks
- Can create new tasks
- Can approve completed tasks

### 2. Login as Kevin (Submissive)
```bash
# Navigate to: http://127.0.0.1:3000/auth/login
# Email: kevin@kinkit.app
# Password: password123
```

**Expected**:
- Dashboard shows submission state selector
- Tasks page shows assigned tasks
- Can update task status (pending → in_progress → completed)
- Cannot create tasks (only dominants can)

### 3. Test Submission State Changes
1. Login as Kevin
2. Change submission state from `active` to `low_energy`
3. Verify state updates in real-time (when Realtime is enabled)
4. Login as Simeon and verify state is visible

### 4. Test Task Enforcement
1. Login as Kevin
2. Change submission state to `paused`
3. Login as Simeon
4. Attempt to create a new task for Kevin
5. **Expected**: Error - "Cannot assign tasks to a paused submissive"

---

## Troubleshooting

### Error: "SUPABASE_SERVICE_ROLE_KEY is required"

**Solution**: Get the service role key from Supabase:

```bash
supabase status
```

Look for the "Secret" key under "Authentication Keys" and add it to `.env.local`:

```bash
SUPABASE_SERVICE_ROLE_KEY=sb_secret_...
```

### Error: "User already exists"

**Solution**: This is normal if you've run the seed before. The script uses `upsert` to handle existing data gracefully.

### Error: "Cannot insert into auth.users"

**Solution**: Use the TypeScript seed script (Method 2) instead, which uses the Supabase Admin API.

### Seed data not appearing

**Solution**:
1. Verify Supabase is running: `supabase status`
2. Check database connection in `.env.local`
3. Run seed script with verbose output
4. Check Supabase Studio: http://127.0.0.1:55323

---

## Next Steps

After seeding:
1. ✅ Test login with both users
2. ✅ Verify tasks appear in UI
3. ✅ Test submission state changes
4. ✅ Test task creation and completion
5. ✅ Test role-based access (dominant vs submissive)
6. ✅ Test submission state enforcement

---

**Status**: Ready for testing with comprehensive seed data



