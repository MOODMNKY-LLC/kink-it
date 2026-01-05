# API Test Script Fix

**Date**: 2026-01-05  
**Issue**: Test script failed because dev server wasn't running and HTTPS wasn't configured properly

---

## Problem

The `pnpm test:api` command failed with:
```
❌ Test failed: TypeError: fetch failed
[cause]: SocketError: other side closed
```

**Root Causes**:
1. Dev server wasn't running on port 3000
2. Test script was using HTTP instead of HTTPS
3. Self-signed certificate handling wasn't configured

---

## Solution

### 1. Updated BASE_URL
Changed from `http://127.0.0.1:3000` to `https://127.0.0.1:3000` to match the HTTPS dev server.

### 2. Added HTTPS Agent
Created an HTTPS agent that ignores self-signed certificates:

```typescript
const https = require('https')
const httpsAgent = new https.Agent({
  rejectUnauthorized: false,
})
```

### 3. Added Server Check
Added a function to check if the dev server is running before attempting tests:

```typescript
async function checkServerRunning(): Promise<boolean> {
  // Checks if server responds to HEAD request
  // Returns false if connection refused or socket error
}
```

### 4. Updated All Fetch Calls
All fetch calls now use the HTTPS agent:

```typescript
await fetch(`${BASE_URL}/api/endpoint`, {
  // ... other options
  agent: httpsAgent,
})
```

### 5. Fixed API Body Format
Changed `submission_state` to `state` in PATCH requests to match API expectations.

---

## Usage

### Before Running Tests

**Start the dev server first**:

```bash
# Terminal 1
pnpm dev
```

**Then run tests**:

```bash
# Terminal 2
pnpm test:api
```

### Expected Behavior

If server is not running:
```
❌ Dev server is not running!
📋 Please start the dev server first:
   pnpm dev
   Then run this test script in another terminal.
```

If server is running:
```
✅ Dev server is running
🧪 Testing API Endpoints...
```

---

## Files Modified

- `scripts/test-api-endpoints.ts`
  - Changed BASE_URL to HTTPS
  - Added HTTPS agent for self-signed certs
  - Added server check function
  - Updated all fetch calls to use agent
  - Fixed API body format

---

## Testing

After these changes, the test script will:
1. ✅ Check if server is running
2. ✅ Use HTTPS with self-signed cert support
3. ✅ Provide clear error messages
4. ✅ Test all API endpoints correctly

---

**Status**: ✅ Fixed and ready for testing



