# Edge Function Realtime Broadcast Fix ✅

## Problem

Edge Functions were failing to broadcast Realtime messages with error:
\`\`\`
Failed to broadcast progress: supabase.realtime.send is not a function
\`\`\`

## Root Cause

The Supabase JavaScript client library's `supabase.realtime.send()` method is **not available in Edge Functions**. This method only works in browser/client environments where WebSocket connections can be established.

Edge Functions run in a Deno runtime environment and cannot use the client library's WebSocket-based Realtime methods directly.

## Solution

Use the **Realtime REST API** endpoint `/realtime/v1/api/broadcast` to send broadcast messages from Edge Functions.

### Before (Doesn't Work in Edge Functions)
\`\`\`typescript
// ❌ This doesn't work - realtime.send() is not available
await supabase.realtime.send(
  topic,
  "event_name",
  payload,
  false
)
\`\`\`

### After (Works in Edge Functions)
\`\`\`typescript
// ✅ Use REST API endpoint instead
const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? ""
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""

await fetch(`${supabaseUrl}/realtime/v1/api/broadcast`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "apikey": serviceRoleKey,
    "Authorization": `Bearer ${serviceRoleKey}`,
  },
  body: JSON.stringify({
    messages: [
      {
        topic: topic,
        event: "event_name",
        payload: payload,
      },
    ],
  }),
})
\`\`\`

## Implementation Details

### Broadcast Progress Function
Updated `broadcastProgress()` in `generate-kinkster-avatar/index.ts`:
- Removed `supabase.realtime.send()` call
- Added REST API fetch call to `/realtime/v1/api/broadcast`
- Uses `SUPABASE_SERVICE_ROLE_KEY` for authentication
- Wrapped in try-catch to prevent failures from breaking the main flow

### Chat Stream Function
Updated `chat-stream/index.ts`:
- Replaced `supabase.realtime.send()` calls with REST API calls
- Added error handling to prevent broadcast failures from affecting SSE streaming
- Broadcasts are optional - SSE is the primary communication method

## REST API Format

The Realtime REST API expects:
\`\`\`json
{
  "messages": [
    {
      "topic": "topic_name",
      "event": "event_name",
      "payload": { /* your data */ }
    }
  ]
}
\`\`\`

**Headers Required:**
- `Content-Type: application/json`
- `apikey: <SERVICE_ROLE_KEY>`
- `Authorization: Bearer <SERVICE_ROLE_KEY>`

## Why This Works

1. **REST API is Server-Compatible**: The REST endpoint works from any HTTP client, including Edge Functions
2. **No WebSocket Required**: Doesn't require maintaining a WebSocket connection
3. **Service Role Key**: Uses service role key for authentication, allowing server-side broadcasts
4. **Same Functionality**: Provides the same broadcast functionality as the client library

## Alternative Approaches

### Option 1: Database Triggers (For Database Changes)
If broadcasting based on database changes, use `realtime.broadcast_changes()` in a database trigger:

\`\`\`sql
CREATE OR REPLACE FUNCTION notify_avatar_generation()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM realtime.broadcast_changes(
    'user:' || NEW.user_id::text || ':avatar',
    TG_OP,
    TG_OP,
    TG_TABLE_NAME,
    TG_TABLE_SCHEMA,
    NEW,
    OLD
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
\`\`\`

### Option 2: Channel.send() (Requires Subscription)
You could create a channel and use `channel.send()`, but this requires:
- Subscribing to the channel first
- Maintaining the connection
- More complex error handling

The REST API approach is simpler and more reliable for Edge Functions.

## Files Modified

- `supabase/functions/generate-kinkster-avatar/index.ts`:
  - Updated `broadcastProgress()` to use REST API

- `supabase/functions/chat-stream/index.ts`:
  - Updated broadcast calls to use REST API
  - Added error handling for broadcast failures

## Testing

After this fix, check the Edge Function logs. You should see:
- ✅ No more "realtime.send is not a function" errors
- ✅ Broadcast messages successfully sent (check Realtime logs)
- ✅ Clients receiving broadcast messages on subscribed channels

## References

- [Supabase Realtime Broadcast REST API](https://supabase.com/docs/guides/realtime/broadcast#broadcast-using-the-rest-api)
- [Realtime Authorization](https://supabase.com/docs/guides/realtime/authorization)
