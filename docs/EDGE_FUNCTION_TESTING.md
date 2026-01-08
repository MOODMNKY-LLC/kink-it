# Edge Function Testing & Debugging Guide

## Test Results Summary

### ✅ Functions Are Accessible
All three edge functions are accessible and responding:
- `chat-stream` - ✅ Accessible (OPTIONS works)
- `generate-kinkster-avatar` - ✅ Working (returns processing status)
- `setup-notion-fdw` - ✅ Accessible

### ❌ Issues Found

#### 1. chat-stream Function
**Error:** Foreign key constraint violation
```
Key (user_id)=(00000000-0000-0000-0000-000000000000) is not present in table "profiles"
```

**Root Cause:** 
- The function requires a valid `user_id` that exists in the `profiles` table
- The frontend must pass an authenticated user's ID, not a test UUID
- The function uses `SUPABASE_SERVICE_ROLE_KEY` which bypasses RLS, but still enforces foreign key constraints

**Solution:**
- Ensure user is authenticated before calling the function
- Pass the actual authenticated user's ID from `supabase.auth.getUser()`
- The function will create the conversation automatically if `conversation_id` is not provided

#### 2. Environment Variables
**Status:** Need verification
- Edge functions need: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `OPENAI_API_KEY`
- These should be available automatically when Supabase starts
- Check with: `supabase secrets list` (if available)

#### 3. SSE Connection Issues
**Potential Issues:**
- Certificate errors with HTTPS in local dev (self-signed certs)
- CORS headers are set correctly in functions
- Frontend must handle certificate warnings

## Testing Commands

### Test chat-stream (requires valid user_id)
```bash
# Get a real user_id from Supabase Studio first
USER_ID="<actual-user-uuid-from-profiles-table>"

curl -k -X POST "https://127.0.0.1:55321/functions/v1/chat-stream" \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <access-token>" \
  -d '{
    "user_id": "'"${USER_ID}"'",
    "messages": [{"role": "user", "content": "Hello"}],
    "stream": true
  }'
```

### Test generate-kinkster-avatar
```bash
curl -k -X POST "https://127.0.0.1:55321/functions/v1/generate-kinkster-avatar" \
  -H "apikey: <anon-key>" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <access-token>" \
  -d '{
    "user_id": "<valid-user-id>",
    "character_data": {
      "name": "Test Character",
      "appearance_description": "Test description"
    }
  }'
```

## Frontend Integration Issues

### Common Errors in App

1. **"Missing or incomplete Client ID"**
   - Check: `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set
   - Verify: User is authenticated before calling functions
   - Ensure: Access token is included in Authorization header

2. **SSE Connection Fails**
   - Check: Edge function is running (`supabase functions serve chat-stream --no-verify-jwt`)
   - Verify: Certificate warnings are accepted in browser
   - Test: Direct curl request to function endpoint

3. **Foreign Key Constraint Errors**
   - Ensure: User has a profile record in `profiles` table
   - Check: User is authenticated and `user_id` matches `auth.uid()`
   - Verify: Profile was created during signup/onboarding

## Debugging Steps

1. **Check Edge Function Logs**
   ```bash
   docker logs supabase_edge_runtime_KINK-IT -f
   ```

2. **Check Database Logs**
   ```bash
   docker logs supabase_db_KINK-IT 2>&1 | grep -i error
   ```

3. **Verify Environment Variables**
   ```bash
   # Check Supabase status
   supabase status
   
   # Check if secrets are set (if available)
   supabase secrets list
   ```

4. **Test Function Directly**
   ```bash
   # Start function in serve mode
   supabase functions serve chat-stream --no-verify-jwt
   
   # In another terminal, test with curl
   curl -k -X POST "https://127.0.0.1:55321/functions/v1/chat-stream" \
     -H "apikey: <anon-key>" \
     -H "Content-Type: application/json" \
     -d '{"user_id":"<valid-user-id>","messages":[{"role":"user","content":"test"}]}'
   ```

## Fixes Applied

1. ✅ Fixed line endings in `.env.local` (removed `\r\n`)
2. ✅ Verified functions are accessible
3. ✅ Identified foreign key constraint issue
4. ✅ Documented testing procedures

## Next Steps

1. **For chat-stream:**
   - Ensure frontend passes authenticated user's ID
   - Verify user has profile record
   - Test with real authenticated user

2. **For generate-kinkster-avatar:**
   - Function is working correctly
   - Test with real user_id and character data
   - Monitor background task completion via Realtime

3. **For setup-notion-fdw:**
   - Requires `NOTION_API_KEY_PROD` environment variable
   - Test after setting up Notion integration

## Environment Variables Required

### Edge Functions Need:
- `SUPABASE_URL` - Auto-provided by Supabase
- `SUPABASE_SERVICE_ROLE_KEY` - Auto-provided by Supabase  
- `OPENAI_API_KEY` - Must be set in `.env.local` and available to edge functions

### To Set Secrets for Edge Functions:
```bash
# If Supabase CLI supports it:
supabase secrets set OPENAI_API_KEY=<your-key>

# Or ensure it's in .env.local and restart Supabase
```

