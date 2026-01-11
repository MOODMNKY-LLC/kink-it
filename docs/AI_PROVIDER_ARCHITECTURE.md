# AI Provider Architecture

**Date**: 2026-02-03  
**Status**: Complete ✅

---

## Overview

The KINK IT app uses **two distinct AI providers** with clear separation:

1. **Kinky Kincade** → **OpenAI** (via Supabase Edge Function)
2. **Kinksters** → **Flowise** (via Flowise API)

This document explains the architecture, routing logic, and how to maintain this separation.

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Chat Interface                            │
│              (FlowiseChatInterface)                          │
└──────────────────────┬──────────────────────────────────────┘
                       │
        ┌──────────────┴──────────────┐
        │                             │
        ▼                             ▼
┌───────────────┐           ┌──────────────────┐
│ Kinky Kincade │           │    Kinksters      │
│   (OpenAI)    │           │    (Flowise)      │
└───────┬───────┘           └────────┬─────────┘
        │                            │
        ▼                            ▼
┌───────────────┐           ┌──────────────────┐
│ /api/openai/  │           │ /api/flowise/    │
│     chat      │           │      chat        │
└───────┬───────┘           └────────┬─────────┘
        │                            │
        ▼                            ▼
┌───────────────┐           ┌──────────────────┐
│ Supabase Edge │           │  Flowise API      │
│   Function    │           │  (flowise-dev.    │
│ chat-stream  │           │   moodmnky.com)   │
└───────┬───────┘           └──────────────────┘
        │
        ▼
┌───────────────┐
│   OpenAI API  │
│  (gpt-4o-mini)│
└───────────────┘
```

---

## Component Routing Logic

### FlowiseChatInterface (`components/chat/flowise-chat-interface.tsx`)

The main chat interface routes messages based on the active tab:

```typescript
// Determine API endpoint based on active tab
const isKinkyKincade = activeTab === "kinky"
const apiEndpoint = isKinkyKincade 
  ? "/api/openai/chat"      // Kinky Kincade → OpenAI
  : "/api/flowise/chat"     // Kinksters → Flowise
```

**Key Points:**
- `activeTab === "kinky"` → Routes to `/api/openai/chat`
- `activeTab === "kinksters"` → Routes to `/api/flowise/chat`
- Conversation metadata includes `provider: "openai"` or `provider: "flowise"`

---

## API Routes

### 1. OpenAI Chat API (`/api/openai/chat`)

**Purpose**: Handle Kinky Kincade chat requests

**Endpoint**: `POST /api/openai/chat`

**Request Body**:
```typescript
{
  message: string
  conversationId?: string
  history?: Array<{ role: "user" | "assistant"; content: string }>
  realtime?: boolean
}
```

**Implementation**:
- Proxies to Supabase Edge Function `/functions/v1/chat-stream`
- Uses OpenAI Agents SDK via Edge Function
- Model: `gpt-4o-mini`
- Temperature: `0.8`
- Agent Instructions: Built from `kinkyKincadeProfile`

**Response**: SSE stream with text chunks

---

### 2. Flowise Chat API (`/api/flowise/chat`)

**Purpose**: Handle Kinkster chat requests

**Endpoint**: `POST /api/flowise/chat`

**Request Body**:
```typescript
{
  message: string
  kinksterId?: string
  chatflowId?: string
  chatId?: string
  conversationId?: string
  history?: Array<{ role: "user" | "assistant"; content: string }>
  realtime?: boolean
}
```

**Implementation**:
- Calls Flowise API directly
- Uses `flowise-sdk` package
- Requires `kinksterId` or `chatflowId` (no fallback to Kinky Kincade)
- Returns error if neither provided

**Response**: SSE stream with text chunks

**Validation**:
- ✅ Requires `kinksterId` or `chatflowId`
- ❌ Rejects requests without Kinkster identification
- ❌ Does NOT fall back to Kinky Kincade

---

## Database Schema

### Conversations Table

The `conversations` table stores metadata about each chat:

```sql
agent_config jsonb DEFAULT '{}'::jsonb
```

**Kinky Kincade conversations**:
```json
{
  "provider": "openai",
  "model": "gpt-4o-mini"
}
```

**Kinkster conversations**:
```json
{
  "provider": "flowise",
  "chatflowId": "uuid-of-flowise-chatflow",
  "kinksterId": "uuid-of-kinkster"
}
```

---

## Environment Variables

### OpenAI (Kinky Kincade)

```env
# Required for OpenAI chat
OPENAI_API_KEY=your_openai_api_key

# Supabase configuration (for Edge Function)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

### Flowise (Kinksters)

```env
# Required for Flowise chat
NEXT_PUBLIC_FLOWISE_URL=https://flowise-dev.moodmnky.com
FLOWISE_API_KEY=your_flowise_api_key

# Note: Kinky Kincade does NOT use Flowise
# NEXT_PUBLIC_FLOWISE_KINKY_KINCADE_CHATFLOW_ID is deprecated
```

---

## Code Organization

### Files Structure

```
app/api/
├── openai/
│   └── chat/
│       └── route.ts          # Kinky Kincade (OpenAI)
└── flowise/
    └── chat/
        └── route.ts           # Kinksters (Flowise)

components/chat/
└── flowise-chat-interface.tsx  # Unified interface (routes to both)

lib/
├── flowise/
│   ├── client.ts              # Flowise client (Kinksters only)
│   └── chat.ts                # Flowise utilities (Kinksters only)
└── kinky/
    └── kinky-kincade-profile.ts  # Kinky Kincade character data

supabase/functions/
└── chat-stream/
    └── index.ts               # OpenAI Edge Function (Kinky Kincade)
```

---

## Key Functions

### `getKinksterChatflowId()`

**Location**: `lib/flowise/chat.ts`

**Purpose**: Get Flowise chatflow ID for a Kinkster

**Behavior**:
- ✅ Requires `kinksterChatflowId` to be configured
- ❌ Does NOT fall back to Kinky Kincade
- ❌ Throws error if not configured

**Usage**:
```typescript
const chatflowId = getKinksterChatflowId(kinksterId, kinkster.flowise_chatflow_id)
```

### `getKinkyKincadeChatflowId()` (Deprecated)

**Status**: ⚠️ **DEPRECATED**

**Reason**: Kinky Kincade uses OpenAI, not Flowise

**Behavior**: Throws error if called

**Migration**: Use `/api/openai/chat` endpoint instead

---

## Testing Checklist

- [x] Kinky Kincade routes to `/api/openai/chat`
- [x] Kinksters route to `/api/flowise/chat`
- [x] Flowise API rejects requests without Kinkster ID
- [x] OpenAI API uses Kinky Kincade profile
- [x] Conversation metadata includes correct provider
- [x] No cross-contamination between providers

---

## Migration Notes

### Removed/Deprecated

1. **`NEXT_PUBLIC_FLOWISE_KINKY_KINCADE_CHATFLOW_ID`** - No longer needed
2. **`getKinkyKincadeChatflowId()`** - Deprecated, throws error
3. **Fallback logic** - Kinksters no longer fall back to Kinky Kincade

### Updated

1. **FlowiseChatInterface** - Routes based on active tab
2. **Flowise API** - Requires Kinkster identification
3. **Conversation metadata** - Includes `provider` field

---

## Best Practices

1. **Always check `activeTab`** before routing
2. **Never route Kinky Kincade to Flowise**
3. **Never route Kinksters to OpenAI** (unless explicitly requested)
4. **Include `provider` in conversation metadata**
5. **Validate Kinkster has `flowise_chatflow_id`** before Flowise requests

---

## Troubleshooting

### "Kinkster has no chatflowId configured"

**Solution**: Configure `flowise_chatflow_id` in the `kinksters` table for the specific Kinkster.

### "Flowise API is only for Kinksters"

**Solution**: Use `/api/openai/chat` for Kinky Kincade instead.

### "Kinky Kincade uses OpenAI, not Flowise"

**Solution**: Remove any Flowise configuration for Kinky Kincade. Use OpenAI API directly.

---

## Summary

✅ **Clear Separation**: Kinky Kincade = OpenAI, Kinksters = Flowise  
✅ **Explicit Routing**: Component checks active tab before routing  
✅ **No Fallbacks**: Each provider is independent  
✅ **Metadata Tracking**: Conversations include provider information  
✅ **Error Handling**: Clear errors when wrong provider is used
