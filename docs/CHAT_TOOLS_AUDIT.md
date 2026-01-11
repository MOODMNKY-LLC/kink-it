# Chat Tools Audit & Recommendations

**Date**: 2026-02-12  
**Status**: Completed Audit & Recommendations

---

## Executive Summary

This document audits the chat tools configuration to ensure only **in-app tools** are available (not MCP tools that only work in Cursor IDE), and provides recommendations for additional app context-aware tools.

---

## ✅ Currently Implemented Tools

### 1. Notion Integration Tools
**Status**: ✅ Fully Implemented in Edge Function  
**Requirements**: User must have Notion API key configured

- **`notion_search`**: Search Notion workspace for pages, databases, or content
- **`notion_fetch_page`**: Get full details of a specific Notion page by ID
- **`notion_query_database`**: Query Notion databases (tasks, ideas, kinksters, etc.) with filters
- **`notion_create_task`**: Create a new task in Notion Tasks database (Dominant/Admin only)
- **`notion_create_idea`**: Create a new idea in Notion Ideas database (Dominant/Admin only)

**Implementation**: `supabase/functions/chat-stream/index.ts` (lines 362-551)

### 2. YouTube Transcript Tool
**Status**: ✅ Fully Implemented in Edge Function  
**Requirements**: None (always available)

- **`youtube_transcript`**: Fetch transcript from a YouTube video URL with timestamps

**Implementation**: `supabase/functions/chat-stream/index.ts` (lines 558-602)

---

## ❌ Removed Tools (MCP-Only, Don't Work In-App)

The following tools were **removed** from the command window because they only work in Cursor IDE, not in the app:

- ❌ `mcp-agent-mode` - MCP Agent Mode
- ❌ `mcp-notion` - Notion MCP
- ❌ `mcp-github` - GitHub MCP
- ❌ `mcp-supabase` - Supabase MCP
- ❌ `mcp-filesystem` - Filesystem MCP
- ❌ `mcp-brave-search` - Brave Search MCP
- ❌ `mcp-tavily` - Tavily Research MCP
- ❌ `mcp-firecrawl` - Firecrawl MCP

**Note**: These MCP tools are configured in `.cursor/mcp.json` and are **exclusive to Cursor IDE**. They cannot be used in the web app.

---

## ❌ Removed Placeholder Tools

The following tools were shown in the UI but **not actually implemented**:

- ❌ `code-assistant` - Code Assistant (placeholder)
- ❌ `database-query` - Database Query (placeholder)
- ❌ `terminal` - Terminal (placeholder)
- ❌ `deep-research` - Deep Research (placeholder)
- ❌ `web-search` - Web Search (placeholder)

---

## 🎯 Recommended Additional App Context-Aware Tools

Based on the PRD and available API routes, here are recommended tools that would make the AI assistant more context-aware of the app's data:

### High Priority (Core App Features)

#### 1. **Bonds Management Tools**
**API Routes**: `/api/bonds/*`  
**Purpose**: Allow AI to help users manage their D/s bonds

- `query_bonds`: Query user's bonds (active, pending, archived)
- `get_bond_details`: Get details of a specific bond
- `create_bond_request`: Create a bond request (with proper permissions)
- `search_bonds`: Search for bonds by criteria

**Use Cases**:
- "Show me my active bonds"
- "What are the pending bond requests?"
- "Create a bond request for [partner name]"

#### 2. **Tasks Management Tools**
**API Routes**: `/api/tasks/*`  
**Purpose**: Allow AI to help manage tasks assigned to submissives

- `query_tasks`: Query tasks (assigned to me, assigned by me, due today, etc.)
- `create_task`: Create a new task (Dominant only)
- `update_task_status`: Update task status (complete, in progress, etc.)
- `get_task_details`: Get full details of a task

**Use Cases**:
- "What tasks are due today?"
- "Show me tasks assigned to [submissive name]"
- "Mark task [id] as complete"

#### 3. **Kinksters Management Tools**
**API Routes**: `/api/kinksters/*`  
**Purpose**: Allow AI to help manage Kinkster profiles

- `query_kinksters`: Query Kinkster profiles
- `get_kinkster_details`: Get full details of a Kinkster
- `create_kinkster`: Create a new Kinkster profile
- `update_kinkster`: Update Kinkster profile

**Use Cases**:
- "Show me all my Kinksters"
- "What's the bio for [Kinkster name]?"
- "Create a new Kinkster profile for [name]"

#### 4. **Journal Tools**
**API Routes**: `/api/journal/*`  
**Purpose**: Allow AI to help with journal entries

- `query_journal_entries`: Query journal entries (by date, tags, etc.)
- `create_journal_entry`: Create a new journal entry
- `get_journal_entry`: Get full details of a journal entry

**Use Cases**:
- "Show me journal entries from last week"
- "Create a journal entry about today's scene"
- "What did I write about [topic]?"

#### 5. **Rules Management Tools**
**API Routes**: `/api/rules/*`  
**Purpose**: Allow AI to help manage relationship rules

- `query_rules`: Query rules (active, archived, by category)
- `get_rule_details`: Get full details of a rule
- `create_rule`: Create a new rule (Dominant only)

**Use Cases**:
- "Show me all active rules"
- "What are the rules about [category]?"
- "Create a new rule: [rule text]"

### Medium Priority (Supporting Features)

#### 6. **Contracts Tools**
**API Routes**: `/api/contracts/*`  
**Purpose**: Allow AI to help manage contracts

- `query_contracts`: Query contracts (active, pending, expired)
- `get_contract_details`: Get full details of a contract
- `create_contract`: Create a new contract (with proper permissions)

#### 7. **Rewards Tools**
**API Routes**: `/api/rewards/*`  
**Purpose**: Allow AI to help manage rewards

- `query_rewards`: Query rewards (available, earned, redeemed)
- `get_reward_details`: Get full details of a reward
- `award_reward`: Award a reward to a submissive (Dominant only)

#### 8. **Boundaries Tools**
**API Routes**: `/api/boundaries/*`  
**Purpose**: Allow AI to help manage boundaries

- `query_boundaries`: Query boundaries (active, soft limits, hard limits)
- `get_boundary_details`: Get full details of a boundary
- `create_boundary`: Create a new boundary

#### 9. **Check-ins Tools**
**API Routes**: `/api/check-ins/*`  
**Purpose**: Allow AI to help with emotional check-ins

- `query_check_ins`: Query check-ins (by date, partner, etc.)
- `create_check_in`: Create a new check-in
- `get_check_in_details`: Get full details of a check-in

#### 10. **Calendar Tools**
**API Routes**: `/api/calendar/*`  
**Purpose**: Allow AI to help manage calendar events

- `query_calendar_events`: Query calendar events (by date, type, etc.)
- `create_calendar_event`: Create a new calendar event
- `get_calendar_event_details`: Get full details of an event

### Lower Priority (Nice-to-Have)

#### 11. **Achievements Tools**
**API Routes**: `/api/achievements/*`  
**Purpose**: Allow AI to help track achievements

- `query_achievements`: Query achievements (earned, available)
- `get_achievement_details`: Get full details of an achievement
- `check_achievement_progress`: Check progress toward an achievement

#### 12. **Points Tools**
**API Routes**: `/api/points/*`  
**Purpose**: Allow AI to help manage points/rewards system

- `get_points_balance`: Get current points balance
- `get_points_history`: Get points history
- `award_points`: Award points (Dominant only)

---

## 🔧 Implementation Recommendations

### Phase 1: Core Tools (Immediate)
1. **Bonds Management** - Core feature, high usage
2. **Tasks Management** - Core feature, high usage
3. **Kinksters Management** - Core feature, high usage

### Phase 2: Supporting Tools (Short-term)
4. **Journal Tools** - Frequently used
5. **Rules Management** - Important for relationship structure
6. **Calendar Tools** - Helps with scheduling

### Phase 3: Enhancement Tools (Medium-term)
7. **Contracts Tools**
8. **Rewards Tools**
9. **Boundaries Tools**
10. **Check-ins Tools**

### Phase 4: Gamification Tools (Long-term)
11. **Achievements Tools**
12. **Points Tools**

---

## 📋 Implementation Pattern

Each tool should follow this pattern:

1. **Edge Function Tool Definition** (`supabase/functions/chat-stream/index.ts`):
   ```typescript
   tool({
     name: "tool_name",
     description: "Clear description of what the tool does",
     parameters: {
       type: "object",
       properties: {
         // Tool-specific parameters
       },
       required: ["param1", "param2"],
       additionalProperties: false,
     },
     execute: async ({ param1, param2 }) => {
       // Call internal API route
       const response = await fetch(`${apiBaseUrl}/api/endpoint`, {
         method: "POST",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify({ param1, param2, user_id }),
       })
       const result = await response.json()
       return formatResult(result)
     },
   })
   ```

2. **Internal API Route** (`app/api/endpoint/route.ts`):
   - Authenticate user
   - Validate permissions (Dominant/Admin checks)
   - Query/update database
   - Return formatted result

3. **Command Window Entry** (`components/chat/command-window.tsx`):
   - Add to appropriate category
   - Set permissions/requirements
   - Add description

---

## 🔒 Security Considerations

1. **Permission Checks**: All tools must verify user permissions (Dominant/Admin for write operations)
2. **User Context**: All tools must operate within the authenticated user's context
3. **Data Isolation**: Tools must never expose data from other users
4. **Input Validation**: All tool parameters must be validated
5. **Rate Limiting**: Consider rate limiting for tool calls

---

## 📊 Success Metrics

- **Tool Usage**: Track which tools are used most frequently
- **Error Rate**: Monitor tool execution errors
- **User Satisfaction**: Gather feedback on tool usefulness
- **Response Time**: Monitor tool execution latency

---

## 🎯 Next Steps

1. ✅ **Completed**: Removed MCP tools and placeholder tools from command window
2. ✅ **Completed**: Verified only implemented tools (Notion, YouTube) are shown
3. 🔄 **Next**: Implement Phase 1 tools (Bonds, Tasks, Kinksters)
4. 🔄 **Future**: Implement Phase 2-4 tools based on user feedback

---

## 📚 References

- **Edge Function**: `supabase/functions/chat-stream/index.ts`
- **Command Window**: `components/chat/command-window.tsx`
- **Notion Chat Tools**: `app/api/notion/chat-tools/route.ts`
- **YouTube Transcript**: `app/api/youtube/transcript/route.ts`
- **PRD**: `PRD.md`
