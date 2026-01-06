# Fix: Notion Integration Status Shows Connection But No Databases

## 🔍 Root Cause

**Issue**: Integration status page shows "connection" but no databases are synced.

**Findings**:
- ✅ Connection works (can reach Notion API)
- ❌ **0 users** have added Notion API keys
- ❌ **0 databases** synced in `notion_databases` table
- ❌ **0 profiles** exist (local dev database is empty)

**Why "Connection" Shows as Connected**:
The integration-status endpoint successfully connects to Notion API, but:
1. It's not checking if the **authenticated user** has an API key
2. It's not checking if the **authenticated user** has synced databases
3. It might be using a fallback/service account key for connection test

---

## 🔧 The Fix

### Issue in Integration Status Logic

The endpoint needs to properly check:
1. **Does authenticated user have API key?**
   ```typescript
   const { data: apiKeys } = await supabase
     .from("user_notion_api_keys")
     .select("*")
     .eq("user_id", user.id) // ← Must check authenticated user
     .eq("is_active", true)
   ```

2. **Does authenticated user have synced databases?**
   ```typescript
   const { data: databases } = await supabase
     .from("notion_databases")
     .select("*")
     .eq("user_id", user.id) // ← Must check authenticated user
   ```

3. **Connection status should be**:
   ```typescript
   connected: apiKeys && apiKeys.length > 0 && canConnectToNotion
   ```

---

## 📋 Steps to Fix

### Step 1: Verify Integration Status Logic

Check `/app/api/notion/integration-status/route.ts`:

```typescript
// Should check authenticated user's API key
const { data: apiKeys } = await supabase
  .from("user_notion_api_keys")
  .select("*")
  .eq("user_id", user.id) // ← Ensure this is checking authenticated user
  .eq("is_active", true)
  .single()

// Connection status should depend on user having API key
const connected = !!apiKeys && canConnectToNotion
```

### Step 2: Test with Authenticated User

1. **Create a test user** (if in local dev):
   ```bash
   # Sign up/login through your app
   ```

2. **Add Notion API key**:
   ```bash
   POST /api/notion/api-keys
   {
     "key_name": "My Workspace",
     "api_key": "your-notion-api-key"
   }
   ```

3. **Sync template**:
   ```bash
   POST /api/onboarding/notion/sync-template
   ```

4. **Check status**:
   - Should now show databases synced

### Step 3: Fix Integration Status Endpoint

If the endpoint is not checking authenticated user's data:

```typescript
// In integration-status route
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({
      connected: false,
      error: "Not authenticated"
    })
  }

  // Check authenticated user's API key
  const { data: apiKeys } = await supabase
    .from("user_notion_api_keys")
    .select("*")
    .eq("user_id", user.id) // ← Authenticated user
    .eq("is_active", true)

  // Check authenticated user's synced databases
  const { data: databases } = await supabase
    .from("notion_databases")
    .select("*")
    .eq("user_id", user.id) // ← Authenticated user

  // Connection = has API key AND can connect
  const connected = apiKeys && apiKeys.length > 0

  return NextResponse.json({
    connected,
    synced_databases_count: databases?.length || 0,
    // ... rest of response
  })
}
```

---

## 🎯 Summary

**Problem**: 
- Integration status shows "connection" but no databases synced
- Root cause: No users have API keys or synced databases
- Integration status might not be checking authenticated user's data

**Solution**:
1. Verify integration-status checks authenticated user's API keys
2. Verify integration-status checks authenticated user's databases
3. Ensure onboarding flow prompts users to add API key and sync
4. Test with authenticated user

**Next Steps**:
1. Review integration-status route logic
2. Ensure it checks authenticated user's data
3. Test with a real authenticated user
4. Verify onboarding flow works correctly


