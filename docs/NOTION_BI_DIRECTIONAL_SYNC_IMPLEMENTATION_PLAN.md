# Bi-Directional Notion-Supabase Sync: Implementation Plan

**Date:** January 2025  
**Status:** Ready for Implementation  
**Based on:** Comprehensive Research Analysis

---

## Overview

This document provides a detailed, step-by-step implementation plan for adding bi-directional sync capabilities between Notion and Supabase, with focus on data recovery and restoration features. The implementation follows the existing codebase patterns and integrates seamlessly with current sync infrastructure.

---

## Architecture Components

### 1. Core Services

#### 1.1 Notion Retrieval Service
**Location:** `lib/notion/retrieve-service.ts`

**Purpose:** Handles paginated retrieval of all pages from Notion databases with rate limiting and error handling.

**Key Functions:**
- `retrieveAllPagesFromDatabase(databaseId, apiKey, progressCallback?)` - Main retrieval function with cursor pagination
- `handleRateLimit(response)` - Exponential backoff on 429 errors
- `transformNotionPageToSupabaseFormat(page, databaseType)` - Converts Notion page properties to Supabase record format

**Implementation Pattern:**
\`\`\`typescript
async function retrieveAllPagesFromDatabase(
  databaseId: string,
  apiKey: string,
  onProgress?: (current: number, total: number | null) => void
): Promise<NotionPage[]> {
  const allPages: NotionPage[] = []
  let hasMore = true
  let cursor: string | undefined = undefined
  let requestCount = 0
  const minDelay = 333 // ms between requests (3 req/sec)

  while (hasMore) {
    // Rate limiting delay
    if (requestCount > 0) {
      await new Promise(resolve => setTimeout(resolve, minDelay))
    }

    const response = await fetch(
      `https://api.notion.com/v1/databases/${databaseId}/query`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'Notion-Version': '2022-06-28',
        },
        body: JSON.stringify({
          start_cursor: cursor,
          page_size: 100,
        }),
      }
    )

    // Handle rate limits
    if (response.status === 429) {
      const retryAfter = parseInt(response.headers.get('Retry-After') || '1', 10)
      await new Promise(resolve => setTimeout(resolve, retryAfter * 1000))
      continue // Retry same request
    }

    if (!response.ok) {
      throw new Error(`Notion API error: ${response.statusText}`)
    }

    const data = await response.json()
    allPages.push(...data.results)
    hasMore = data.has_more
    cursor = data.next_cursor
    requestCount++

    if (onProgress) {
      onProgress(allPages.length, null) // Total unknown until complete
    }
  }

  return allPages
}
\`\`\`

#### 1.2 Matching Service
**Location:** `lib/notion/matching-service.ts`

**Purpose:** Matches Notion pages to Supabase records using multiple strategies.

**Key Functions:**
- `matchNotionPageToSupabaseRecord(notionPage, supabaseRecords, databaseType)` - Primary matching function
- `matchByNotionPageId(notionPageId, records)` - Exact match by stored ID
- `matchByTitle(title, records, databaseType)` - Fuzzy title matching
- `detectDuplicates(matches)` - Identifies ambiguous matches

**Matching Priority:**
1. **Primary:** Match by `notion_page_id` (exact, most reliable)
2. **Secondary:** Match by title with fuzzy matching (handles variations)
3. **Tertiary:** No match found (new record from Notion)

**Implementation Pattern:**
\`\`\`typescript
interface MatchResult {
  notionPage: NotionPage
  supabaseRecord: SupabaseRecord | null
  matchType: 'notion_page_id' | 'title' | 'none'
  confidence: 'high' | 'medium' | 'low'
}

function matchNotionPageToSupabaseRecord(
  notionPage: NotionPage,
  supabaseRecords: SupabaseRecord[],
  databaseType: string
): MatchResult {
  // Primary: Match by notion_page_id
  const pageIdMatch = supabaseRecords.find(
    r => r.notion_page_id === notionPage.id
  )
  if (pageIdMatch) {
    return {
      notionPage,
      supabaseRecord: pageIdMatch,
      matchType: 'notion_page_id',
      confidence: 'high',
    }
  }

  // Secondary: Match by title
  const title = extractTitle(notionPage, databaseType)
  const titleMatch = findTitleMatch(title, supabaseRecords, databaseType)
  if (titleMatch) {
    return {
      notionPage,
      supabaseRecord: titleMatch.record,
      matchType: 'title',
      confidence: titleMatch.confidence,
    }
  }

  // No match
  return {
    notionPage,
    supabaseRecord: null,
    matchType: 'none',
    confidence: 'low',
  }
}
\`\`\`

#### 1.3 Conflict Detection Service
**Location:** `lib/notion/conflict-detection-service.ts`

**Purpose:** Detects conflicts between Notion and Supabase data.

**Key Functions:**
- `detectConflicts(matchResult)` - Identifies record-level conflicts
- `detectFieldConflicts(notionData, supabaseData, databaseType)` - Field-level conflict detection
- `compareTimestamps(notionLastEdited, supabaseUpdated)` - Timestamp comparison

**Conflict Types:**
- **Record-level:** Both records modified since last sync
- **Field-level:** Specific properties differ meaningfully
- **Missing:** Record exists in one system but not the other

**Implementation Pattern:**
\`\`\`typescript
interface Conflict {
  type: 'record' | 'field' | 'missing'
  field?: string
  notionValue: any
  supabaseValue: any
  notionTimestamp: string
  supabaseTimestamp: string
}

function detectConflicts(
  matchResult: MatchResult
): Conflict[] {
  if (!matchResult.supabaseRecord) {
    return [{
      type: 'missing',
      notionValue: matchResult.notionPage,
      supabaseValue: null,
      notionTimestamp: matchResult.notionPage.last_edited_time,
      supabaseTimestamp: null,
    }]
  }

  const conflicts: Conflict[] = []
  const notionData = transformNotionPage(matchResult.notionPage)
  const supabaseData = matchResult.supabaseRecord

  // Check if both modified since last sync
  const notionTime = new Date(matchResult.notionPage.last_edited_time)
  const supabaseTime = new Date(supabaseData.updated_at)
  const lastSyncTime = supabaseData.notion_synced_at
    ? new Date(supabaseData.notion_synced_at)
    : null

  if (lastSyncTime) {
    const notionModified = notionTime > lastSyncTime
    const supabaseModified = supabaseTime > lastSyncTime

    if (notionModified && supabaseModified) {
      // Record-level conflict
      conflicts.push({
        type: 'record',
        notionValue: notionData,
        supabaseValue: supabaseData,
        notionTimestamp: matchResult.notionPage.last_edited_time,
        supabaseTimestamp: supabaseData.updated_at,
      })
    }
  }

  // Field-level conflicts
  const fieldConflicts = detectFieldConflicts(
    notionData,
    supabaseData,
    matchResult.databaseType
  )
  conflicts.push(...fieldConflicts)

  return conflicts
}
\`\`\`

#### 1.4 Conflict Resolution Service
**Location:** `lib/notion/conflict-resolution-service.ts`

**Purpose:** Applies user-chosen resolution strategies.

**Key Functions:**
- `resolveConflict(conflict, resolution)` - Applies resolution choice
- `preferSupabase(conflict)` - Updates Notion with Supabase data
- `preferNotion(conflict)` - Updates Supabase with Notion data
- `mergeData(conflict, fieldChoices)` - Merges based on field-level choices

**Resolution Strategies:**
- `prefer_supabase` - Use Supabase data (default)
- `prefer_notion` - Use Notion data
- `merge` - Field-by-field merge
- `skip` - Don't sync this record

---

### 2. API Routes

#### 2.1 Retrieve from Notion
**Location:** `app/api/notion/retrieve-from-database/route.ts`

**Endpoint:** `POST /api/notion/retrieve-from-database`

**Request Body:**
\`\`\`typescript
{
  databaseType: 'tasks' | 'rules' | 'contracts' | 'journal' | 'calendar' | 'kinksters' | 'image_generations' | 'app_ideas'
  conflictResolution?: 'prefer_supabase' | 'prefer_notion' | 'manual'
  autoResolve?: boolean // Auto-resolve non-conflicting records
}
\`\`\`

**Response:**
\`\`\`typescript
{
  success: boolean
  retrieved: number
  matched: number
  conflicts: Conflict[]
  newRecords: number
  errors: Error[]
  progress?: {
    current: number
    total: number
  }
}
\`\`\`

**Implementation Flow:**
1. Authenticate user
2. Get Notion API key
3. Get database ID from `notion_databases` table
4. Retrieve all pages from Notion (with pagination)
5. Get all Supabase records for database type
6. Match Notion pages to Supabase records
7. Detect conflicts
8. Apply resolution (auto or manual)
9. Return results

#### 2.2 Sync from Supabase to Notion (Restoration)
**Location:** `app/api/notion/sync-from-supabase/route.ts`

**Endpoint:** `POST /api/notion/sync-from-supabase`

**Purpose:** Syncs Supabase data to Notion when Notion pages are missing.

**Request Body:**
\`\`\`typescript
{
  databaseType: string
  recordIds?: string[] // Optional: specific records to sync
}
\`\`\`

**Implementation:**
- Uses existing sync routes but detects missing Notion pages
- Offers to recreate pages in Notion
- Updates sync status accordingly

---

### 3. UI Components

#### 3.1 Data Recovery Flow Component
**Location:** `components/notion/data-recovery-flow.tsx`

**Purpose:** Main recovery interface for returning users.

**Features:**
- Detects recovery scenarios
- Shows available databases
- Displays progress during retrieval
- Presents conflict resolution UI
- Shows success summary

**Shadcn Components Used:**
- `Card` - Container for recovery options
- `Dialog` - Modal for recovery flow
- `Progress` - Progress indicators
- `Alert` - Guidance messages
- `Button` - Actions
- `Table` - Conflict comparison

**Magic UI Components:**
- `animated-shiny-text` - Attention-grabbing headers
- `blur-fade` - Smooth transitions
- `number-ticker` - Animated counts

**Component Structure:**
\`\`\`tsx
export function DataRecoveryFlow() {
  const [step, setStep] = useState<'detect' | 'select' | 'retrieve' | 'resolve' | 'complete'>('detect')
  const [databases, setDatabases] = useState<Database[]>([])
  const [selectedDatabase, setSelectedDatabase] = useState<string | null>(null)
  const [progress, setProgress] = useState({ current: 0, total: 0 })
  const [conflicts, setConflicts] = useState<Conflict[]>([])
  const [resolutions, setResolutions] = useState<Record<string, Resolution>>({})

  // Auto-detect recovery scenario
  useEffect(() => {
    detectRecoveryScenario().then(scenario => {
      if (scenario.needsRecovery) {
        setStep('select')
        setDatabases(scenario.availableDatabases)
      }
    })
  }, [])

  // Recovery flow steps...
}
\`\`\`

#### 3.2 Conflict Resolution Component
**Location:** `components/notion/conflict-resolution.tsx`

**Purpose:** Side-by-side comparison and resolution interface.

**Features:**
- Side-by-side data comparison
- Field-level conflict highlighting
- Resolution choice per conflict
- Bulk actions (prefer all Supabase, prefer all Notion)
- Guidance tooltips

**Component Structure:**
\`\`\`tsx
export function ConflictResolution({
  conflicts,
  onResolve,
}: {
  conflicts: Conflict[]
  onResolve: (conflictId: string, resolution: Resolution) => void
}) {
  return (
    <div className="space-y-4">
      {conflicts.map(conflict => (
        <Card key={conflict.id}>
          <CardHeader>
            <CardTitle>Conflict: {conflict.title}</CardTitle>
            <CardDescription>
              Both versions modified since last sync
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4>Supabase (Preferred)</h4>
                <DataPreview data={conflict.supabaseValue} />
                <Button onClick={() => onResolve(conflict.id, 'prefer_supabase')}>
                  Use This
                </Button>
              </div>
              <div>
                <h4>Notion</h4>
                <DataPreview data={conflict.notionValue} />
                <Button onClick={() => onResolve(conflict.id, 'prefer_notion')}>
                  Use This
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
\`\`\`

#### 3.3 Recovery Detection Hook
**Location:** `hooks/use-notion-recovery-detection.ts`

**Purpose:** Detects when recovery might be needed.

**Logic:**
- Checks if `notion_databases` exist
- Checks if Supabase tables are empty or have few records
- Checks sync status for widespread failures
- Returns recovery recommendation

---

### 4. Database Schema Enhancements

#### 4.1 Recovery Tracking Table (Optional)
**Location:** Migration file

**Purpose:** Track recovery operations for audit and debugging.

\`\`\`sql
CREATE TABLE IF NOT EXISTS notion_recovery_operations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id),
  database_type text NOT NULL,
  operation_type text NOT NULL, -- 'retrieve_from_notion' | 'sync_to_notion'
  status text NOT NULL, -- 'pending' | 'in_progress' | 'completed' | 'failed'
  records_processed integer DEFAULT 0,
  records_total integer,
  conflicts_detected integer DEFAULT 0,
  conflicts_resolved integer DEFAULT 0,
  errors jsonb DEFAULT '[]'::jsonb,
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_recovery_operations_user_id ON notion_recovery_operations(user_id);
CREATE INDEX idx_recovery_operations_status ON notion_recovery_operations(status);
\`\`\`

---

## Implementation Phases

### Phase 1: Core Retrieval Infrastructure (Week 1)

**Tasks:**
1. ✅ Create `lib/notion/retrieve-service.ts` with pagination
2. ✅ Create `lib/notion/matching-service.ts` with multi-tier matching
3. ✅ Create `lib/notion/conflict-detection-service.ts`
4. ✅ Create `app/api/notion/retrieve-from-database/route.ts`
5. ✅ Add rate limiting and error handling
6. ✅ Write unit tests for services

**Deliverables:**
- Working API endpoint that retrieves pages from Notion
- Matching logic that identifies relationships
- Conflict detection that identifies differences

### Phase 2: Conflict Resolution (Week 2)

**Tasks:**
1. ✅ Create `lib/notion/conflict-resolution-service.ts`
2. ✅ Implement resolution strategies (prefer_supabase, prefer_notion, merge)
3. ✅ Create `components/notion/conflict-resolution.tsx`
4. ✅ Integrate resolution into API route
5. ✅ Add field-level conflict detection
6. ✅ Write tests for resolution logic

**Deliverables:**
- Conflict resolution service
- UI component for conflict comparison
- API endpoint that applies resolutions

### Phase 3: Recovery UI (Week 3)

**Tasks:**
1. ✅ Create `hooks/use-notion-recovery-detection.ts`
2. ✅ Create `components/notion/data-recovery-flow.tsx`
3. ✅ Add recovery detection to settings page
4. ✅ Add recovery option to onboarding flow
5. ✅ Integrate progress indicators
6. ✅ Add success/error messaging

**Deliverables:**
- Recovery detection hook
- Complete recovery flow component
- Integration into user-facing pages

### Phase 4: Auto-Detection and Enhancement (Week 4)

**Tasks:**
1. ✅ Add auto-detection on reauthentication
2. ✅ Enhance existing sync routes to detect missing Notion pages
3. ✅ Create `app/api/notion/sync-from-supabase/route.ts`
4. ✅ Add recovery tracking table (optional)
5. ✅ Add comprehensive error handling
6. ✅ Write integration tests

**Deliverables:**
- Automatic recovery detection
- Enhanced sync routes
- Supabase-to-Notion restoration endpoint
- Complete error handling

### Phase 5: Testing and Refinement (Week 5)

**Tasks:**
1. ✅ Test with various database sizes
2. ✅ Test conflict scenarios
3. ✅ Test error cases (rate limits, network failures)
4. ✅ Performance optimization
5. ✅ User experience refinement
6. ✅ Documentation

**Deliverables:**
- Comprehensive test coverage
- Performance optimizations
- User documentation
- Developer documentation

---

## Testing Strategy

### Unit Tests
- Matching algorithms (various scenarios)
- Conflict detection (timestamp comparisons, field differences)
- Resolution strategies (all options)
- Data transformation (Notion → Supabase)

### Integration Tests
- End-to-end retrieval flow
- Conflict resolution flow
- Error handling (rate limits, network failures)
- Large database handling (1000+ pages)

### User Acceptance Tests
- Recovery detection accuracy
- UI clarity and guidance
- Conflict resolution ease of use
- Performance with real data

---

## Error Handling

### Rate Limiting
- Exponential backoff on 429 errors
- Respect Retry-After headers
- Queue requests to stay under limits
- Show progress to users during delays

### Network Failures
- Retry logic with exponential backoff
- Checkpoint/resume capability
- Clear error messages
- Partial success handling

### Authentication Failures
- Token refresh integration
- Clear error messages
- Re-authentication prompts

### Data Validation
- Validate Notion page structure
- Validate Supabase record structure
- Handle missing required fields
- Handle type mismatches

---

## Performance Considerations

### Pagination
- Process in batches (100 pages at a time)
- Show progress indicators
- Allow cancellation
- Background processing where possible

### Rate Limiting
- 333ms minimum delay between requests
- Queue management for burst handling
- User feedback during rate limit delays

### Large Databases
- Stream processing where possible
- Progress callbacks for UI updates
- Allow selective database recovery
- Background job processing for very large operations

---

## Security Considerations

### Access Control
- Verify user owns Notion databases
- Verify Notion API token permissions
- RLS policies on Supabase data
- Audit logging for recovery operations

### Data Privacy
- Encrypt sensitive data in transit
- Secure API key storage
- No cross-user data exposure
- Clear data retention policies

---

## Success Metrics

### Functionality
- ✅ Can retrieve all pages from Notion databases
- ✅ Can match Notion pages to Supabase records
- ✅ Can detect conflicts accurately
- ✅ Can resolve conflicts per user choice
- ✅ Can sync Supabase data to Notion when missing

### User Experience
- Clear recovery detection
- Intuitive conflict resolution UI
- Progress feedback during operations
- Helpful error messages
- Fast performance (< 30s for 100 pages)

### Reliability
- Handles rate limits gracefully
- Recovers from network failures
- Maintains data integrity
- No data loss during conflicts

---

## Next Steps

1. **Review and Approve Plan** - Stakeholder review of implementation plan
2. **Set Up Development Environment** - Ensure Notion API access for testing
3. **Begin Phase 1** - Start with core retrieval infrastructure
4. **Iterative Development** - Build and test each phase incrementally
5. **User Testing** - Beta test with real users before full release

---

## References

- [Notion API Documentation](https://developers.notion.com/reference)
- [Notion API Pagination Guide](https://developers.notion.com/reference/intro#pagination)
- [Notion API Rate Limits](https://developers.notion.com/reference/request-limits)
- Research Report: `docs/NOTION_BI_DIRECTIONAL_SYNC_RESEARCH.md`
- Current Sync Implementation: `app/api/notion/sync-*/route.ts`
