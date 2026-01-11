# Flowise Chat Integration

**Date**: 2026-02-03  
**Status**: Complete ✅  
**Updated**: 2026-02-03 - Kinky Kincade now uses OpenAI, Flowise is only for Kinksters

---

## Overview

The KINK IT app integrates with Flowise AI **exclusively for Kinkster characters**. This integration allows users to chat with:

1. **Kinksters** - User-created character avatars, each with their own Flowise chatflow

**Note**: Kinky Kincade uses OpenAI (not Flowise). See `docs/AI_PROVIDER_ARCHITECTURE.md` for details.

## Architecture

### Components

#### 1. Flowise Client (`lib/flowise/client.ts`)
- Singleton Flowise client manager
- Handles initialization with baseUrl and API key
- Works in both server and client environments

#### 2. Flowise Chat Utilities (`lib/flowise/chat.ts`)
- `sendFlowiseMessage()` - Non-streaming chat
- `streamFlowiseMessage()` - Streaming chat (async generator)
- `getKinksterChatflowId()` - Get Kinkster-specific chatflow ID (required, no fallback)

#### 3. Flowise Chat API Route (`app/api/flowise/chat/route.ts`)
- POST endpoint for streaming chat responses
- Handles authentication
- **ONLY supports Kinkster chatflows** (Kinky Kincade uses OpenAI)
- Requires `kinksterId` or `chatflowId` parameter
- Returns Server-Sent Events (SSE) stream

#### 4. Unified Chat Interface (`components/chat/flowise-chat-interface.tsx`)
- Main chat UI component using shadcn chat components
- Tab switching between Kinky Kincade (OpenAI) and Kinksters (Flowise)
- Routes to appropriate API based on active tab
- Streaming message display
- Conversation history management

#### 5. Shadcn Chat Components (`components/ui/chat.tsx`)
- Chat, ChatHeader, ChatMessages, ChatToolbar components
- ChatEvent components for message display
- Based on [shadcn-chat.vercel.app](https://shadcn-chat.vercel.app/)

## Database Schema

### Migration: `20260203000001_add_flowise_chatflow_id_to_kinksters.sql`

Adds `flowise_chatflow_id` column to `kinksters` table:

```sql
ALTER TABLE public.kinksters
  ADD COLUMN IF NOT EXISTS flowise_chatflow_id text;
```

- **Required**: Each Kinkster must have `flowise_chatflow_id` configured
- **No fallback**: Kinksters without chatflowId will error (they don't fall back to Kinky Kincade)
- Indexed for faster lookups

## Environment Variables

### Required

```bash
# Flowise instance URL
NEXT_PUBLIC_FLOWISE_URL=https://flowise-dev.moodmnky.com
FLOWISE_URL=https://flowise-dev.moodmnky.com

# Flowise API Key
FLOWISE_API_KEY=3-5qP08qhP9NUOUw0-yAdIz78ZWt166orwnHvRM2c2s

# Note: Kinky Kincade uses OpenAI, not Flowise
# NEXT_PUBLIC_FLOWISE_KINKY_KINCADE_CHATFLOW_ID is deprecated and not used
```

### Setup Instructions

1. **Create Flowise Chatflows for Kinksters**:
   - Log into Flowise at `https://flowise-dev.moodmnky.com`
   - Create chatflows for each Kinkster character
   - Copy the chatflow IDs
   - **Note**: Kinky Kincade does NOT use Flowise (uses OpenAI instead)

2. **Configure Environment Variables**:
   - Add `NEXT_PUBLIC_FLOWISE_URL` and `FLOWISE_API_KEY` to `.env.local`
   - **Do NOT** configure `NEXT_PUBLIC_FLOWISE_KINKY_KINCADE_CHATFLOW_ID` (deprecated)

3. **Assign Chatflows to Kinksters** (required):
   ```sql
   UPDATE kinksters 
   SET flowise_chatflow_id = 'your-kinkster-chatflow-id' 
   WHERE id = 'kinkster-id';
   ```
   
   **Important**: Each Kinkster must have a `flowise_chatflow_id` configured. There is no fallback.

## Usage

### Chat Page (`/chat`)

The chat page now uses `FlowiseChatInterface` component:

```tsx
<FlowiseChatInterface
  profile={profile}
  initialKinksterId={kinksterId} // Optional
/>
```

### Features

- **Tab Switching**: Switch between "Kinky Kincade" (OpenAI) and "Kinksters" (Flowise) tabs
- **Provider Routing**: Automatically routes to correct API based on active tab
- **Streaming Responses**: Real-time streaming from Flowise chatflows (Kinksters only)
- **Conversation History**: Maintains conversation context per chat
- **Kinkster Selection**: Select a Kinkster to chat with (if Kinksters tab is active)
- **Chat Continuity**: Uses `chatId` for maintaining conversation context (Flowise only)

## Flowise SDK

### Installation

```bash
pnpm add flowise-sdk
```

### Usage Example

```typescript
import { getFlowiseClient } from "@/lib/flowise/client"

const client = getFlowiseClient()

const response = await client.createPrediction({
  chatflowId: "your-chatflow-id",
  question: "Hello!",
  streaming: true,
})
```

## Integration Points

### 1. Chat Page (`app/chat/page.tsx`)
- Uses `FlowiseChatInterface` component
- Supports `?kinkster=id` query parameter for direct Kinkster chat

### 2. Kinksters Table
- `flowise_chatflow_id` column stores chatflow ID per Kinkster
- Falls back to Kinky Kincade if not configured

### 3. API Route (`app/api/flowise/chat/route.ts`)
- Handles authentication
- Determines chatflow ID based on active chat
- Streams responses as SSE

## Future Enhancements

- [ ] Update `KinkyTerminalPopup` component to use new chat UI
- [ ] Add chatflow configuration UI in Kinkster settings
- [ ] Support for multiple conversation threads
- [ ] Chat history persistence in database
- [ ] File upload support in Flowise chatflows
- [ ] Voice input/output integration

## Troubleshooting

### Error: "Flowise URL not configured"
- Ensure `NEXT_PUBLIC_FLOWISE_URL` is set in `.env.local`
- Restart dev server after adding environment variables

### Error: "Flowise API key not configured"
- Ensure `FLOWISE_API_KEY` is set in `.env.local`
- Verify API key is correct

### Error: "Kinkster has no chatflowId configured"
- Kinksters must have `flowise_chatflow_id` configured in the database
- Create a chatflow in Flowise for the Kinkster
- Update the `flowise_chatflow_id` column in the `kinksters` table
- Note: Kinky Kincade uses OpenAI, not Flowise

### Chat not streaming
- Check browser console for errors
- Verify Flowise instance is accessible
- Check API route logs for errors

## References

- [Flowise Documentation](https://docs.flowiseai.com/)
- [Flowise SDK GitHub](https://github.com/FlowiseAI/FlowiseSDK)
- [Shadcn Chat Component](https://shadcn-chat.vercel.app/)
