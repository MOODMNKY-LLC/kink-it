# Discord MCP Capabilities Analysis

## Executive Summary

The Discord MCP server provides **one-way text messaging** capabilities to Discord channels. It's well-suited for automated notifications, alerts, and reminders as specified in the KINK IT PRD. The server is operational and ready for integration.

## Available Functions

### 1. `mcp_mcp-discord_test`
**Purpose**: Verify Discord MCP server connectivity  
**Status**: ✅ Operational  
**Use Case**: Health checks, debugging connection issues

### 2. `mcp_mcp-discord_discord_login`
**Purpose**: Authenticate with Discord using configured bot token  
**Parameters**: 
- `random_string` (string, required) - Used for authentication flow

**Status**: Available  
**Use Case**: Initial authentication, token validation

### 3. `mcp_mcp-discord_discord_send`
**Purpose**: Send text messages to Discord channels  
**Parameters**:
- `channelId` (string, required) - Discord channel ID where message will be sent
- `message` (string, required) - Message content to send

**Status**: Available  
**Use Case**: Primary function for all Discord notifications

## Capabilities

### ✅ What You CAN Do

1. **Send Text Messages**
   - Send messages to any Discord text channel
   - Bot must have "Send Messages" permission
   - Messages up to 2000 characters (Discord limit)
   - Supports Markdown formatting

2. **Automated Notifications**
   - Task assignment notifications
   - Task completion alerts
   - Reward redemption notifications
   - Submission state change alerts
   - Scheduled reminders

3. **Integration Points**
   - Can be called from Next.js API routes
   - Can be integrated with n8n workflows
   - Can be triggered by Supabase database events
   - Can be called from server-side code

### ❌ What You CANNOT Do

1. **Read/Receive Messages**
   - Cannot read messages from channels
   - Cannot receive DMs
   - No message history access

2. **Rich Formatting**
   - No embeds (rich message cards)
   - No file attachments
   - No image uploads
   - Plain text + Markdown only

3. **Interactions**
   - No buttons or interactive components
   - No reactions
   - No slash commands
   - No message editing/deletion

4. **Direct Messages**
   - Cannot send DMs directly (would need user Discord ID)
   - Must use channels instead

## Technical Requirements

### Authentication
- **Token**: Discord bot token stored in `DISCORD_TOKEN` environment variable
- **Setup**: Bot must be added to Discord server
- **Permissions**: Bot needs "Send Messages" permission in target channels

### Channel Access
- **Channel ID Required**: Must provide exact Discord channel ID (not name)
- **Access**: Bot must be a member of the server and have channel access
- **Format**: Channel IDs are numeric strings (e.g., "123456789012345678")

### Rate Limits
- Discord API has rate limits (varies by endpoint)
- Recommended: Implement retry logic with exponential backoff
- Best Practice: Batch notifications when possible

## Integration Architecture

### Recommended Pattern

```
┌─────────────────┐
│  KINK IT App    │
│  (Next.js)      │
└────────┬────────┘
         │
         │ Event Triggered
         ▼
┌─────────────────┐
│  API Route      │
│  /api/discord   │
└────────┬────────┘
         │
         │ Calls MCP
         ▼
┌─────────────────┐
│  Discord MCP    │
│  Server         │
└────────┬────────┘
         │
         │ Sends Message
         ▼
┌─────────────────┐
│  Discord API    │
│  Channel        │
└─────────────────┘
```

### Alternative: n8n Integration

```
Supabase Event → n8n Workflow → Discord MCP → Discord Channel
```

## Use Cases for KINK IT

### 1. Task Management Notifications
- **Task Assigned**: "New task assigned: [Task Name]"
- **Task Completed**: "[Submissive] completed: [Task Name]"
- **Task Approved**: "Task approved: [Task Name] - Points awarded!"

### 2. Rewards System
- **Reward Created**: "New reward available: [Reward Name]"
- **Reward Redeemed**: "[Submissive] redeemed: [Reward Name]"

### 3. Submission State Changes
- **State Updated**: "[Submissive] updated state to: [State]"
- **Paused Alert**: "⚠️ [Submissive] has paused their submission"

### 4. Scheduled Reminders
- **Daily Task Reminders**: "Don't forget your tasks for today!"
- **Check-in Reminders**: "Time for your scheduled check-in"
- **Weekly Summaries**: "Your weekly progress summary"

### 5. Contract & Consent
- **Contract Renewal**: "Contract renewal reminder - expires in [X] days"
- **Consent Updates**: "Consent boundaries have been updated"

## Implementation Recommendations

### Phase 1: Basic Notifications (MVP)
1. Create `/api/discord/send` route
2. Store Discord channel IDs in user profiles or dynamics table
3. Send notifications for:
   - Task assignments
   - Task completions
   - Task approvals

### Phase 2: Enhanced Notifications
1. Add user preference toggles for Discord notifications
2. Implement message templates following LANGUAGE_GUIDE.md
3. Add retry logic and error handling
4. Log all Discord sends for audit trail

### Phase 3: Scheduled Reminders
1. Integrate with calendar/scheduling system
2. Set up cron jobs or scheduled functions
3. Send daily/weekly summaries
4. Send check-in reminders

### Phase 4: Advanced Features (Future)
1. Rich message formatting (if Discord webhooks support embeds)
2. File attachments (via Discord webhooks)
3. Multiple channel support per dynamic
4. Notification preferences per event type

## Code Example

### Basic Implementation

```typescript
// app/api/discord/send/route.ts
import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getCurrentUser } from "@/lib/auth/get-user"

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const { channelId, message } = await request.json()

    // Call Discord MCP (would need to be implemented via MCP client)
    // For now, this is a placeholder showing the structure
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[Discord Send Error]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}
```

### Database Schema Addition

```sql
-- Add Discord channel preferences to profiles or dynamics table
ALTER TABLE profiles ADD COLUMN discord_channel_id TEXT;
ALTER TABLE profiles ADD COLUMN discord_notifications_enabled BOOLEAN DEFAULT false;
```

## Security Considerations

1. **Token Security**: Discord bot token stored in environment variables (secure)
2. **Channel Access**: Validate bot has permission before sending
3. **User Consent**: Require explicit opt-in for Discord notifications
4. **Rate Limiting**: Implement rate limiting to prevent abuse
5. **Error Handling**: Don't expose sensitive information in error messages

## Limitations & Workarounds

### Limitation: No Rich Formatting
**Workaround**: Use Markdown formatting in messages, or use Discord webhooks for embeds

### Limitation: No File Attachments
**Workaround**: Use Discord webhooks for file uploads, or provide links to files

### Limitation: No Direct Messages
**Workaround**: Create private channels per user, or use a notification channel they monitor

### Limitation: No Read Capabilities
**Workaround**: Use Discord webhooks with message IDs to track delivery, or rely on Discord's delivery confirmation

## Next Steps

1. ✅ Discord MCP server configured and tested
2. ⏳ Create Discord service layer in codebase
3. ⏳ Add Discord channel preferences to database
4. ⏳ Implement API route for sending messages
5. ⏳ Add user preference toggles in UI
6. ⏳ Integrate with task/reward/notification systems
7. ⏳ Test end-to-end notification flow
8. ⏳ Document user-facing Discord setup instructions

## Conclusion

The Discord MCP server provides a solid foundation for one-way notifications to Discord channels. While it has limitations (no rich formatting, no file uploads, no read capabilities), it perfectly matches the PRD's requirement for Discord as a "delivery channel" for notifications and reminders. The implementation should focus on reliable text-based notifications with proper error handling and user preferences.




