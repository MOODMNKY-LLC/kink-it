# Chat Components Guide

**Date**: 2026-01-31  
**Status**: Complete ✅

---

## 📍 Component Locations

### Main Chat Components

All chat components are located in: **`components/chat/`**

#### Core Components:
- **`chat-interface.tsx`** - Main chat UI component
- **`message-list.tsx`** - Displays list of messages
- **`message-bubble.tsx`** - Individual message display
- **`streaming-message.tsx`** - Streaming AI response display
- **`types.ts`** - TypeScript type definitions

#### Supporting Components:
- **`chat-contact.tsx`** - Contact list (legacy)
- **`chat-conversation.tsx`** - Conversation view (legacy)
- **`chat-expanded.tsx`** - Expanded chat view (legacy)
- **`chat-header.tsx`** - Chat header (legacy)
- **`chat-message.tsx`** - Message component (legacy)
- **`chat-preview.tsx`** - Chat preview (legacy)
- **`chat-status-indicator.tsx`** - Status indicator (legacy)
- **`mobile-chat.tsx`** - Mobile chat wrapper
- **`mobile-chat-content.tsx`** - Mobile chat content
- **`index.tsx`** - Legacy chat component
- **`use-chat-state.ts`** - Legacy state hook
- **`utils.ts`** - Chat utilities

---

## 🎯 How to Access Chat

### 1. Via Sidebar Navigation

The chat is accessible through the sidebar navigation:

**Location**: Sidebar → Dashboard → **"AI Chat"**

**File**: `components/dashboard/sidebar/navigation-config.ts`
```typescript
{
  title: "AI Chat",
  url: "/chat",
  icon: MessageSquare,
}
```

### 2. Direct URL Access

Navigate directly to: **`/chat`**

**File**: `app/chat/page.tsx`

---

## 🏗️ UI Implementation

### Main Chat Page

**File**: `app/chat/page.tsx`

```typescript
export default async function ChatPage() {
  const user = await getCurrentUser()
  
  if (!user) {
    redirect("/auth/login")
  }

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-4xl mx-auto">
        <ChatInterface agentName="KINK IT Assistant" />
      </div>
    </div>
  )
}
```

### Chat Interface Component

**File**: `components/chat/chat-interface.tsx`

**Features**:
- Message input with send button
- Streaming message display
- Real-time updates via Supabase Realtime
- Conversation management
- Agent configuration

**Props**:
- `conversationId?: string` - Existing conversation ID
- `agentName?: string` - Name of the AI agent (default: "Assistant")
- `agentInstructions?: string` - Custom agent instructions
- `tools?: any[]` - Available tools for the agent
- `model?: string` - OpenAI model (default: "gpt-4o-mini")
- `temperature?: number` - Model temperature (default: 0.7)

---

## 🔌 Integration Points

### 1. Sidebar Navigation

**File**: `components/dashboard/sidebar/navigation-config.ts`

The chat link is added to the "Dashboard" navigation group:

```typescript
export const userNavigation: NavigationGroup[] = [
  {
    title: "Dashboard",
    items: [
      {
        title: "Overview",
        url: "/",
        icon: BracketsIcon,
      },
      {
        title: "AI Chat",  // ← Chat link here
        url: "/chat",
        icon: MessageSquare,
      },
      // ... other items
    ],
  },
  // ... other groups
]
```

### 2. Authentication

**File**: `app/chat/page.tsx`

The chat page requires authentication:
- Uses `getCurrentUser()` to check authentication
- Redirects to `/auth/login` if not authenticated

### 3. Layout Integration

**File**: `app/layout.tsx`

The chat page is rendered within the main dashboard layout:
- Includes sidebar navigation
- Includes header and footer
- Responsive design

---

## 🎨 Component Structure

```
components/chat/
├── chat-interface.tsx      # Main chat UI
├── message-list.tsx        # Message list container
├── message-bubble.tsx      # Individual message
├── streaming-message.tsx   # Streaming AI response
├── types.ts                # TypeScript types
└── [legacy components]     # Old chat components (not used)
```

---

## 🔐 Access Control

### Authentication Required
- ✅ User must be logged in
- ✅ Redirects to `/auth/login` if not authenticated

### Authorization
- ✅ All authenticated users can access chat
- ✅ No role-based restrictions (yet)

---

## 📱 Responsive Design

### Desktop
- Full-width chat interface
- Max width: 4xl (896px)
- Centered layout

### Mobile
- Responsive container
- Full-width on small screens
- Touch-friendly input

---

## 🚀 Usage Example

### Basic Usage

```typescript
import { ChatInterface } from "@/components/chat/chat-interface"

export default function MyPage() {
  return (
    <ChatInterface agentName="KINK IT Assistant" />
  )
}
```

### Advanced Usage

```typescript
import { ChatInterface } from "@/components/chat/chat-interface"

export default function MyPage() {
  return (
    <ChatInterface
      agentName="Task Management Agent"
      agentInstructions="You are a helpful task management assistant."
      model="gpt-4o"
      temperature={0.8}
      tools={[
        // Custom tools here
      ]}
    />
  )
}
```

---

## 🔗 Related Files

### Hooks
- **`hooks/use-chat-stream.ts`** - Chat streaming hook
- **`hooks/use-conversations.ts`** - Conversation management hook

### API Routes
- **`supabase/functions/chat-stream/index.ts`** - Edge Function for streaming

### Database
- **`supabase/migrations/20260131000005_create_ai_chat_system.sql`** - Database schema
- Tables: `conversations`, `messages`, `agent_sessions`

### Agent Definitions
- **`lib/ai/agent-definitions.ts`** - Pre-configured agents
- **`lib/ai/tools.ts`** - Available tools

---

## 📝 Notes

- Legacy chat components exist but are not currently used
- The new chat system uses OpenAI Agents SDK
- Streaming is handled via SSE and Supabase Realtime
- Messages are persisted to the database automatically

---

**Last Updated**: 2026-01-31  
**Status**: ✅ Complete



