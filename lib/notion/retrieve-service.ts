/**
 * Notion Retrieval Service
 * 
 * Handles paginated retrieval of all pages from Notion databases
 * with rate limiting, error handling, and progress tracking.
 */

export interface NotionPage {
  id: string
  url: string
  last_edited_time: string
  created_time: string
  properties: Record<string, any>
  archived?: boolean
}

export interface RetrieveOptions {
  databaseId: string
  apiKey: string
  onProgress?: (current: number, total: number | null) => void
  maxRetries?: number
}

export interface RetrieveResult {
  pages: NotionPage[]
  totalRetrieved: number
  errors: Error[]
  rateLimitHits: number
}

/**
 * Retrieves all pages from a Notion database using cursor-based pagination
 * Handles rate limiting with exponential backoff
 */
export async function retrieveAllPagesFromDatabase(
  options: RetrieveOptions
): Promise<RetrieveResult> {
  const {
    databaseId,
    apiKey,
    onProgress,
    maxRetries = 3,
  } = options

  const allPages: NotionPage[] = []
  const errors: Error[] = []
  let hasMore = true
  let cursor: string | undefined = undefined
  let requestCount = 0
  let rateLimitHits = 0
  const minDelay = 333 // ms between requests (3 req/sec average)

  while (hasMore) {
    // Rate limiting delay - wait between requests
    if (requestCount > 0) {
      await new Promise((resolve) => setTimeout(resolve, minDelay))
    }

    let retries = 0
    let success = false

    while (retries <= maxRetries && !success) {
      try {
        const response = await fetch(
          `https://api.notion.com/v1/databases/${databaseId}/query`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${apiKey}`,
              "Content-Type": "application/json",
              "Notion-Version": "2022-06-28",
            },
            body: JSON.stringify({
              start_cursor: cursor,
              page_size: 100, // Maximum allowed by Notion API
            }),
          }
        )

        // Handle rate limits with exponential backoff
        if (response.status === 429) {
          rateLimitHits++
          const retryAfterHeader = response.headers.get("Retry-After")
          const retryAfter = retryAfterHeader
            ? parseInt(retryAfterHeader, 10)
            : Math.pow(2, retries) // Exponential backoff: 1s, 2s, 4s

          console.warn(
            `[Notion Retrieve] Rate limit hit. Retrying after ${retryAfter}s...`
          )

          await new Promise((resolve) =>
            setTimeout(resolve, retryAfter * 1000)
          )

          retries++
          continue // Retry same request
        }

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          const errorMessage =
            errorData.message || errorData.error || response.statusText

          throw new Error(
            `Notion API error (${response.status}): ${errorMessage}`
          )
        }

        const data = await response.json()

        // Filter out archived pages
        const activePages = (data.results || []).filter(
          (page: NotionPage) => !page.archived
        )

        allPages.push(...activePages)
        hasMore = data.has_more === true
        cursor = data.next_cursor
        requestCount++
        success = true

        // Progress callback
        if (onProgress) {
          onProgress(allPages.length, null) // Total unknown until complete
        }
      } catch (error) {
        if (retries < maxRetries) {
          retries++
          const backoffDelay = Math.pow(2, retries) * 1000 // Exponential backoff
          console.warn(
            `[Notion Retrieve] Error (attempt ${retries}/${maxRetries}):`,
            error
          )
          await new Promise((resolve) => setTimeout(resolve, backoffDelay))
        } else {
          errors.push(
            error instanceof Error
              ? error
              : new Error(String(error))
          )
          console.error("[Notion Retrieve] Failed after retries:", error)
          // Continue to next page if possible, or break if critical error
          if (error instanceof Error && error.message.includes("404")) {
            // Database not found - stop trying
            hasMore = false
            break
          }
          // For other errors, try to continue
          success = true // Mark as handled to exit retry loop
        }
      }
    }
  }

  return {
    pages: allPages,
    totalRetrieved: allPages.length,
    errors,
    rateLimitHits,
  }
}

/**
 * Retrieves a single page by ID
 */
export async function retrievePageById(
  pageId: string,
  apiKey: string
): Promise<NotionPage> {
  const response = await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Notion-Version": "2022-06-28",
    },
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(
      `Failed to retrieve page: ${errorData.message || response.statusText}`
    )
  }

  return response.json()
}

/**
 * Extracts title from a Notion page based on database type
 */
export function extractTitleFromNotionPage(
  page: NotionPage,
  databaseType: string
): string {
  const properties = page.properties || {}

  // Different database types use different title property names
  const titleProperty =
    properties.Title || properties.Name || properties["Task Name"] || {}

  if (titleProperty.title && titleProperty.title.length > 0) {
    return titleProperty.title[0].plain_text || ""
  }

  if (titleProperty.rich_text && titleProperty.rich_text.length > 0) {
    return titleProperty.rich_text[0].plain_text || ""
  }

  return "Untitled"
}
