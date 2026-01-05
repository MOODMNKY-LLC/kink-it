# Testing Instructions

**Date**: 2026-01-05  
**Purpose**: Step-by-step guide for running tests

---

## Prerequisites

1. ✅ Supabase running locally: `supabase status`
2. ✅ Seed data created: `pnpm seed` (already done)
3. ✅ Certificates exist: Check `certs/` directory

---

## Running API Tests

### Option 1: Manual (Recommended)

**Terminal 1 - Start Dev Server**:
```bash
pnpm dev
```

Wait for server to start (look for "Ready" message), then:

**Terminal 2 - Run Tests**:
```bash
pnpm test:api
```

### Option 2: Automated (If server is already running)

Just run:
```bash
pnpm test:api
```

The script will check if the server is running and provide clear instructions if it's not.

---

## Expected Test Output

### Successful Run:
```
🧪 Testing API Endpoints...

🔍 Checking if dev server is running...
✅ Dev server is running

🔐 Authenticating as Kevin (Submissive)...
✅ Kevin authenticated

📊 Testing Submission State API...
✅ GET /api/submission-state: {"state":"active",...}
✅ PATCH /api/submission-state: {"success":true,...}

✅ Testing Tasks API...
✅ GET /api/tasks: Found 6 tasks
✅ GET /api/tasks/[id]: Complete Morning Routine
✅ PATCH /api/tasks/[id]: Updated to in_progress

🔐 Authenticating as Simeon (Dominant)...
✅ Simeon authenticated

📝 Testing Task Creation (Dominant only)...
✅ POST /api/tasks: Created task "Test Task from API"
   ✅ Test task cleaned up

✨ API Testing Complete!

📋 Test Summary:
   ✅ Authentication (Kevin & Simeon)
   ✅ GET /api/submission-state
   ✅ PATCH /api/submission-state
   ✅ GET /api/tasks
   ✅ GET /api/tasks/[id]
   ✅ PATCH /api/tasks/[id]
   ✅ POST /api/tasks (Dominant only)
   ✅ DELETE /api/tasks/[id] (cleanup)

✅ All tests passed!
```

### If Server Not Running:
```
❌ Dev server is not running!

📋 Please start the dev server first:
   pnpm dev

   Then run this test script in another terminal.
```

---

## Troubleshooting

### Issue: "Dev server is not running"

**Solution**:
1. Check if server is actually running: `curl -k -I https://127.0.0.1:3000`
2. Start server: `pnpm dev`
3. Wait 10-15 seconds for server to fully start
4. Run tests again: `pnpm test:api`

### Issue: Certificate Errors

**Solution**:
- The script uses `rejectUnauthorized: false` to handle self-signed certs
- If you see certificate errors, check that `NODE_TLS_REJECT_UNAUTHORIZED=0` is set
- Or regenerate certificates using mkcert

### Issue: Authentication Errors

**Solution**:
1. Verify seed data exists: `pnpm verify:seed`
2. Check Supabase is running: `supabase status`
3. Verify credentials in seed script match test script

### Issue: Connection Timeout

**Solution**:
- Server might be starting slowly
- Wait 20-30 seconds after starting `pnpm dev`
- Check server logs for errors
- Try increasing timeout in test script if needed

---

## Manual UI Testing

After API tests pass, test the UI:

1. **Start dev server**: `pnpm dev`
2. **Open browser**: `https://127.0.0.1:3000`
3. **Login as Kevin**: `kevin@kinkit.app` / `password123`
4. **Test features**:
   - Change submission state
   - View tasks
   - Update task status
5. **Login as Simeon**: `simeon@kinkit.app` / `password123`
6. **Test features**:
   - View Kevin's submission state
   - Create new tasks
   - Approve completed tasks

---

## Next Steps

After successful testing:
1. ✅ Fix any bugs found
2. ✅ Document issues
3. ✅ Update test coverage
4. ✅ Prepare for production deployment

---

**Status**: Ready for testing



