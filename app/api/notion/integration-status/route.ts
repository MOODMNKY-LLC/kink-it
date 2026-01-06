import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

interface DatabaseStatus {
  id: string
  title: string
  url: string
  type: string | null
  accessible: boolean
  synced: boolean
  synced_name?: string
  error?: string
  entry_count?: number
}

interface PageStatus {
  id: string
  title: string
  url: string
  accessible: boolean
  has_databases: boolean
  error?: string
}

interface IntegrationStatus {
  connected: boolean
  user?: {
    id: string
    name: string
    email?: string
    avatar_url?: string
  }
  api_key?: {
    id: string
    name: string
    last_validated_at: string | null
  }
  databases: DatabaseStatus[]
  pages: PageStatus[]
  synced_databases_count: number
  accessible_databases_count: number
  total_databases: number
  total_pages: number
  error?: string
  pagination?: {
    databases_page: number
    databases_per_page: number
    databases_total: number
    pages_page: number
    pages_per_page: number
    pages_total: number
  }
}

/**
 * GET /api/notion/integration-status
 * Get comprehensive Notion integration status
 * OPTIMIZED: Parallel API calls, reduced unnecessary requests
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const dbPage = parseInt(searchParams.get("db_page") || "1", 10)
    const dbPerPage = parseInt(searchParams.get("db_per_page") || "10", 10)
    const pagePage = parseInt(searchParams.get("page_page") || "1", 10)
    const pagePerPage = parseInt(searchParams.get("page_per_page") || "10", 10)
    
    const supabase = await createClient()
    
    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Get encryption key
    const encryptionKey = process.env.NOTION_API_KEY_ENCRYPTION_KEY || process.env.SUPABASE_ENCRYPTION_KEY
    
    if (!encryptionKey) {
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      )
    }

    // Get active API key and synced databases in parallel
    const [apiKeysResult, syncedDatabasesResult] = await Promise.all([
      supabase
        .from("user_notion_api_keys")
        .select("id, key_name, last_validated_at")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .order("last_validated_at", { ascending: false, nullsFirst: false })
        .limit(1)
        .single(),
      supabase
        .from("notion_databases")
        .select("database_id, database_name, database_type")
        .eq("user_id", user.id)
    ])

    const { data: apiKeys, error: keysError } = apiKeysResult
    const { data: syncedDatabases } = syncedDatabasesResult

    if (keysError || !apiKeys) {
      return NextResponse.json({
        connected: false,
        error: "No active API key found",
        databases: [],
        pages: [],
        synced_databases_count: 0,
        accessible_databases_count: 0,
        total_databases: 0,
        total_pages: 0,
      })
    }

    // Get decrypted API key
    const { data: decryptedKey, error: decryptError } = await supabase.rpc("get_user_notion_api_key", {
      p_user_id: user.id,
      p_key_id: apiKeys.id,
      p_encryption_key: encryptionKey,
    })

    if (decryptError || !decryptedKey) {
      return NextResponse.json({
        connected: false,
        error: "Failed to retrieve API key",
        databases: [],
        pages: [],
        synced_databases_count: 0,
        accessible_databases_count: 0,
        total_databases: 0,
        total_pages: 0,
      })
    }

    const notionApiKey = decryptedKey
    const notionHeaders = {
      "Authorization": `Bearer ${notionApiKey}`,
      "Notion-Version": "2022-06-28",
    }

    const syncedDbMap = new Map(
      (syncedDatabases || []).map((db) => [db.database_id, db])
    )

    // Parallel fetch: User info, databases search, pages search
    const [userResponse, databasesSearchResponse, pagesSearchResponse] = await Promise.all([
      fetch("https://api.notion.com/v1/users/me", { headers: notionHeaders }).catch(() => null),
      fetch("https://api.notion.com/v1/search", {
        method: "POST",
        headers: {
          ...notionHeaders,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          filter: {
            property: "object",
            value: "database",
          },
        }),
      }).catch(() => null),
      fetch("https://api.notion.com/v1/search", {
        method: "POST",
        headers: {
          ...notionHeaders,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          filter: {
            property: "object",
            value: "page",
          },
          page_size: 20, // Reduced from 50
        }),
      }).catch(() => null),
    ])

    let notionUser: any = null
    if (userResponse?.ok) {
      notionUser = await userResponse.json()
    }

    // Process databases - only check access for synced databases or first 10
    const databases: DatabaseStatus[] = []
    if (databasesSearchResponse?.ok) {
      const searchData = await databasesSearchResponse.json()
      const dbResults = searchData.results || []

      // Only check access for synced databases or first 10 unsynced ones
      const databasesToCheck = dbResults
        .filter((db: any) => syncedDbMap.has(db.id))
        .concat(dbResults.filter((db: any) => !syncedDbMap.has(db.id)).slice(0, 10))

      // Parallel access checks (limited to 10 at a time to avoid rate limits)
      const accessChecks = databasesToCheck.slice(0, 10).map(async (db: any) => {
        const dbId = db.id
        const dbTitle = db.title?.[0]?.plain_text || "Untitled Database"
        const dbUrl = db.url || ""
        const syncedDb = syncedDbMap.get(dbId)

        // Single query with page_size: 1 to check access and get count estimate
        try {
          const queryResponse = await fetch(`https://api.notion.com/v1/databases/${dbId}/query`, {
            method: "POST",
            headers: {
              ...notionHeaders,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ page_size: 1 }),
          })

          const accessible = queryResponse.ok
          let entryCount = 0
          let error: string | undefined

          if (queryResponse.ok) {
            const queryData = await queryResponse.json()
            entryCount = queryData.results?.length || 0
            // If has_more, estimate at least 1+
            if (queryData.has_more) {
              entryCount = 1 // Indicate there are entries, but don't count all
            }
          } else {
            const errorData = await queryResponse.json().catch(() => ({}))
            error = errorData.message || "Access denied"
          }

          return {
            id: dbId,
            title: dbTitle,
            url: dbUrl,
            type: syncedDb?.database_type || null,
            accessible,
            synced: !!syncedDb,
            synced_name: syncedDb?.database_name,
            error,
            entry_count: accessible ? entryCount : undefined,
          }
        } catch (err) {
          return {
            id: dbId,
            title: dbTitle,
            url: dbUrl,
            type: syncedDb?.database_type || null,
            accessible: false,
            synced: !!syncedDb,
            synced_name: syncedDb?.database_name,
            error: err instanceof Error ? err.message : "Unknown error",
            entry_count: undefined,
          }
        }
      })

      const checkedDatabases = await Promise.all(accessChecks)
      databases.push(...checkedDatabases)

      // Add remaining databases without access checks (marked as unknown)
      const remainingDbs = dbResults
        .filter((db: any) => !databasesToCheck.slice(0, 10).some((d: any) => d.id === db.id))
        .map((db: any) => {
          const syncedDb = syncedDbMap.get(db.id)
          return {
            id: db.id,
            title: db.title?.[0]?.plain_text || "Untitled Database",
            url: db.url || "",
            type: syncedDb?.database_type || null,
            accessible: false, // Unknown, not checked
            synced: !!syncedDb,
            synced_name: syncedDb?.database_name,
            entry_count: undefined,
          }
        })

      databases.push(...remainingDbs)
    }

    // Process pages - parallel children checks (limited to 10)
    const pages: PageStatus[] = []
    if (pagesSearchResponse?.ok) {
      const searchData = await pagesSearchResponse.json()
      const pageResults = searchData.results || []

      // Parallel children checks for first 10 pages
      const pageChecks = pageResults.slice(0, 10).map(async (page: any) => {
        const pageId = page.id
        const pageTitle = page.properties?.title?.title?.[0]?.plain_text || 
                        page.properties?.["Name"]?.title?.[0]?.plain_text ||
                        "Untitled Page"
        const pageUrl = page.url || ""

        try {
          const childrenResponse = await fetch(`https://api.notion.com/v1/blocks/${pageId}/children`, {
            headers: notionHeaders,
          })
          
          const accessible = childrenResponse.ok
          let hasDatabases = false
          let error: string | undefined

          if (childrenResponse.ok) {
            const childrenData = await childrenResponse.json()
            hasDatabases = (childrenData.results || []).some(
              (block: any) => block.type === "child_database" || block.type === "database"
            )
          } else {
            const errorData = await childrenResponse.json().catch(() => ({}))
            error = errorData.message || "Access denied"
          }

          return {
            id: pageId,
            title: pageTitle,
            url: pageUrl,
            accessible,
            has_databases: hasDatabases,
            error,
          }
        } catch (err) {
          return {
            id: pageId,
            title: pageTitle,
            url: pageUrl,
            accessible: false,
            has_databases: false,
            error: err instanceof Error ? err.message : "Unknown error",
          }
        }
      })

      const checkedPages = await Promise.all(pageChecks)
      pages.push(...checkedPages)

      // Add remaining pages without checks
      const remainingPages = pageResults.slice(10).map((page: any) => ({
        id: page.id,
        title: page.properties?.title?.title?.[0]?.plain_text || 
               page.properties?.["Name"]?.title?.[0]?.plain_text ||
               "Untitled Page",
        url: page.url || "",
        accessible: false, // Unknown
        has_databases: false, // Unknown
      }))

      pages.push(...remainingPages)
    }

    // Apply pagination
    const totalDatabases = databases.length
    const totalPages = pages.length
    const dbStart = (dbPage - 1) * dbPerPage
    const dbEnd = dbStart + dbPerPage
    const pageStart = (pagePage - 1) * pagePerPage
    const pageEnd = pageStart + pagePerPage

    const paginatedDatabases = databases.slice(dbStart, dbEnd)
    const paginatedPages = pages.slice(pageStart, pageEnd)

    const status: IntegrationStatus = {
      connected: true,
      user: notionUser ? {
        id: notionUser.id,
        name: notionUser.name || "Unknown",
        email: notionUser.person?.email,
        avatar_url: notionUser.avatar_url,
      } : undefined,
      api_key: {
        id: apiKeys.id,
        name: apiKeys.key_name,
        last_validated_at: apiKeys.last_validated_at,
      },
      databases: paginatedDatabases,
      pages: paginatedPages,
      synced_databases_count: syncedDbMap.size,
      accessible_databases_count: databases.filter((db) => db.accessible).length,
      total_databases: totalDatabases,
      total_pages: totalPages,
      pagination: {
        databases_page: dbPage,
        databases_per_page: dbPerPage,
        databases_total: totalDatabases,
        pages_page: pagePage,
        pages_per_page: pagePerPage,
        pages_total: totalPages,
      },
    }

    return NextResponse.json(status)
  } catch (error) {
    console.error("Unexpected error:", error)
    return NextResponse.json(
      {
        connected: false,
        error: error instanceof Error ? error.message : "Internal server error",
        databases: [],
        pages: [],
        synced_databases_count: 0,
        accessible_databases_count: 0,
        total_databases: 0,
        total_pages: 0,
      },
      { status: 500 }
    )
  }
}
