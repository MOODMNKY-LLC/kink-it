# Notion MCP Chat Integration Implementation Plan

**Date**: 2026-01-31  
**Status**: Planning Complete, Ready for Implementation

---

## Overview

Integrate Notion MCP server with the chat system to enable users to query and interact with their Notion databases through natural language. This allows users to:
- Query tasks ("What's on my task list today?")
- Create tasks (Dom/admin only)
- Query ideas database
- Retrieve image generations
- Retrieve KINKSTER profiles with Supabase URLs
- And more...

---

## Architecture

### Components

1. **Notion MCP Tool Helper** (`lib/notion/mcp-tools.ts`)
   - Retrieve and decrypt user's Notion API key
   - Create MCP server connection
   - Map queries to Notion operations
   - Format responses

2. **Edge Function Updates** (`supabase/functions/chat-stream/index.ts`)
   - Check for Notion API key
   - Create Notion MCP tools dynamically
   - Add tools to agent
   - Handle tool calls

3. **Query Intent Detection**
   - Use AI to detect user intent
   - Map to appropriate Notion MCP tool
   - Apply role-based permissions

4. **Database ID Resolution**
   - Query `notion_databases` table
   - Map `database_type` to operations
   - Pass database IDs to tools

---

## Notion MCP Server Integration

### Option 1: Hosted MCP Tool (Recommended)

Use `HostedMCPTool` from OpenAI Agents SDK with Notion's hosted MCP server.

**Pros**:
- Simple setup
- OAuth handled by Notion
- Automatic updates

**Cons**:
- Requires OAuth flow per user
- Less control over authentication

### Option 2: Custom HTTP MCP Server (Chosen)

Create a custom HTTP endpoint that wraps Notion API calls and exposes MCP tools.

**Pros**:
- Full control over authentication
- Can use user's stored API key
- No OAuth complexity

**Cons**:
- Need to implement MCP protocol
- More maintenance

### Option 3: Stdio MCP Server (Alternative)

Use `@notionhq/notion-mcp-server` package via stdio.

**Pros**:
- Official package
- Well-maintained

**Cons**:
- Requires spawning subprocess in Edge Function
- Complex in Deno environment

---

## Implementation Approach: Custom HTTP MCP Server

Create a lightweight HTTP server that:
1. Accepts MCP tool calls
2. Authenticates using user's Notion API key
3. Calls Notion API
4. Returns formatted results

### MCP Tool Definitions

```typescript
const notionTools = [
  {
    name: "notion-search",
    description: "Search Notion workspace for pages, databases, or content",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Search query" },
        database_type: { type: "string", description: "Filter by database type (tasks, ideas, image_generations, etc.)" },
      },
      required: ["query"],
    },
  },
  {
    name: "notion-fetch-page",
    description: "Fetch a specific Notion page or database entry",
    inputSchema: {
      type: "object",
      properties: {
        page_id: { type: "string", description: "Notion page ID" },
      },
      required: ["page_id"],
    },
  },
  {
    name: "notion-create-task",
    description: "Create a new task in Notion Tasks database (Dom/admin only)",
    inputSchema: {
      type: "object",
      properties: {
        title: { type: "string", description: "Task title" },
        description: { type: "string", description: "Task description" },
        priority: { type: "string", enum: ["low", "medium", "high"] },
        due_date: { type: "string", description: "Due date (ISO 8601)" },
        assigned_to: { type: "string", description: "Partner user ID (optional)" },
      },
      required: ["title"],
    },
  },
  {
    name: "notion-create-idea",
    description: "Create a new idea in Notion Ideas database",
    inputSchema: {
      type: "object",
      properties: {
        title: { type: "string", description: "Idea title" },
        description: { type: "string", description: "Idea description" },
        category: { type: "string", description: "Idea category" },
      },
      required: ["title"],
    },
  },
  {
    name: "notion-query-database",
    description: "Query a Notion database with filters",
    inputSchema: {
      type: "object",
      properties: {
        database_type: { type: "string", description: "Database type (tasks, ideas, image_generations, kinksters)" },
        filter: { type: "object", description: "Notion filter object" },
        sorts: { type: "array", description: "Sort options" },
      },
      required: ["database_type"],
    },
  },
]
```

---

## Database Type Mapping

```typescript
const DATABASE_TYPE_MAP = {
  tasks: "tasks",
  ideas: "ideas",
  image_generations: "image_generations",
  kinksters: "kinksters",
  rules: "rules",
  rewards: "rewards",
  // ... etc
}
```

---

## Role-Based Permissions

```typescript
const PERMISSIONS = {
  // All users can query
  "notion-search": ["user", "admin"],
  "notion-fetch-page": ["user", "admin"],
  "notion-query-database": ["user", "admin"],
  
  // Only Dom/admin can create
  "notion-create-task": ["admin", "dominant"],
  "notion-create-idea": ["admin", "dominant"],
  
  // Only admin can update/delete
  "notion-update-page": ["admin"],
  "notion-delete-page": ["admin"],
}
```

---

## Query Examples

### User Queries → Notion Operations

1. **"What's on my task list today?"**
   - Tool: `notion-query-database`
   - Database: `tasks`
   - Filter: `{ property: "Due Date", date: { equals: "today" } }`

2. **"Add a new task: Clean the kitchen"**
   - Tool: `notion-create-task`
   - Check: User is Dom/admin
   - Create page in Tasks database

3. **"Show my latest image generation"**
   - Tool: `notion-query-database`
   - Database: `image_generations`
   - Sort: `[{ property: "Created", direction: "descending" }]`
   - Limit: 1

4. **"Show me KINKSTER profile for [name]"**
   - Tool: `notion-search`
   - Query: KINKSTER name
   - Filter: `database_type: "kinksters"`
   - Then: `notion-fetch-page` with page ID
   - Extract Supabase URL from properties

---

## Implementation Steps

### Step 1: Create Notion MCP Tool Helper

**File**: `lib/notion/mcp-tools.ts`

- Function to retrieve user's Notion API key
- Function to create MCP tools
- Function to execute Notion operations
- Function to format responses

### Step 2: Create Notion MCP API Endpoint

**File**: `app/api/notion/mcp/route.ts`

- HTTP endpoint that accepts MCP tool calls
- Authenticates using user's API key
- Calls Notion API
- Returns formatted results

### Step 3: Update Edge Function

**File**: `supabase/functions/chat-stream/index.ts`

- Check if user has Notion API key
- Create Notion MCP tools dynamically
- Add tools to agent
- Handle tool calls

### Step 4: Update Chat Hook

**File**: `hooks/use-chat-stream.ts`

- Pass user context (role, bond status)
- Enable Notion tools when available

### Step 5: Add Agent Instructions

Update agent instructions to:
- Explain available Notion tools
- Guide on when to use each tool
- Provide examples

---

## Security Considerations

1. **API Key Storage**: Encrypted in database, decrypted only in Edge Function
2. **Role-Based Access**: Check permissions before allowing create/update operations
3. **Database Access**: Only access user's own databases
4. **Input Validation**: Validate all inputs before calling Notion API
5. **Error Handling**: Don't expose API keys in error messages

---

## Testing Strategy

1. **Unit Tests**: Test query mapping, permission checks
2. **Integration Tests**: Test Notion API calls
3. **E2E Tests**: Test full chat flow with Notion queries
4. **Security Tests**: Test permission enforcement

---

## Future Enhancements

1. **Query Caching**: Cache frequent queries
2. **Batch Operations**: Support batch creates/updates
3. **Smart Suggestions**: Suggest queries based on user behavior
4. **Voice Commands**: Support voice input for queries
5. **Multi-Database Queries**: Query across multiple databases

---

## Notes

- Notion MCP server uses OAuth 2.1 for hosted version
- For custom implementation, use user's stored API key
- Database IDs are stored in `notion_databases` table
- Role-based permissions are enforced server-side
- All Notion operations are logged for audit


