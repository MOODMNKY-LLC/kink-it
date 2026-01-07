import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import { getUserProfile } from "@/lib/auth/get-user"
import { getNotionAccessToken } from "@/lib/notion-auth"
import { setSyncPending, setSyncSynced, setSyncFailed } from "@/lib/notion/sync-status"

/**
 * Sync Contract to Notion Contracts Database
 * 
 * Creates or updates a Notion page in the user's Contracts database
 * with the contract data from KINK IT.
 */

interface SyncContractRequest {
  contractId: string
  // Or provide contract data directly
  contract?: {
    id: string
    title: string
    content: string
    version: number
    status: "draft" | "pending_signature" | "active" | "archived" | "superseded"
    effective_from?: string | null
    effective_until?: string | null
    parent_contract_id?: string | null
  }
}

export async function POST(request: NextRequest) {
  try {
    const profile = await getUserProfile()
    if (!profile) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = (await request.json()) as SyncContractRequest
    const supabase = await createClient()

    // Get user's Notion API key using utility (handles refresh automatically)
    const notionApiKey = await getNotionAccessToken(profile.id)

    if (!notionApiKey) {
      return NextResponse.json(
        {
          success: false,
          error: "Notion API key not found. Please add your Notion API key in Account Settings.",
        },
        { status: 400 }
      )
    }

    // Get Contracts database ID from notion_databases table
    const { data: contractsDb } = await supabase
      .from("notion_databases")
      .select("database_id")
      .eq("user_id", profile.id)
      .eq("database_type", "contracts")
      .single()

    if (!contractsDb?.database_id) {
      return NextResponse.json(
        {
          success: false,
          error: "Contracts database not found. Please sync your Notion template.",
        },
        { status: 404 }
      )
    }

    const databaseId = contractsDb.database_id

    // Fetch contract data if contractId provided
    let contractData = body.contract
    if (body.contractId && !contractData) {
      const { data: contract, error: contractError } = await supabase
        .from("contracts")
        .select("*")
        .eq("id", body.contractId)
        .single()

      if (contractError || !contract) {
        return NextResponse.json(
          { success: false, error: "Contract not found" },
          { status: 404 }
        )
      }

      contractData = contract as any
    }

    if (!contractData) {
      return NextResponse.json(
        { success: false, error: "Contract data is required" },
        { status: 400 }
      )
    }

    // Set sync status to pending
    try {
      await setSyncPending("contracts", contractData.id)
    } catch (error) {
      console.warn("[Sync Contract] Could not set pending status:", error)
    }

    // Map status to Notion select option
    const statusMap: Record<string, string> = {
      draft: "Draft",
      pending_signature: "Pending Signature",
      active: "Active",
      archived: "Archived",
      superseded: "Superseded",
    }

    const notionStatus = statusMap[contractData.status] || "Draft"

    // Build Notion page properties
    const properties: any = {
      Title: {
        title: [
          {
            text: {
              content: contractData.title,
            },
          },
        ],
      },
      Status: {
        select: {
          name: notionStatus,
        },
      },
      Version: {
        number: contractData.version || 1,
      },
      Content: {
        rich_text: [
          {
            text: {
              content: contractData.content,
            },
          },
        ],
      },
    }

    // Add effective from date if available
    if (contractData.effective_from) {
      properties["Effective From"] = {
        date: {
          start: new Date(contractData.effective_from).toISOString(),
        },
      }
    }

    // Add effective until date if available
    if (contractData.effective_until) {
      properties["Effective Until"] = {
        date: {
          start: new Date(contractData.effective_until).toISOString(),
        },
      }
    }

    // Check if page already exists (by searching for contract with same title and version)
    let existingPageId: string | null = null
    try {
      const searchResponse = await fetch(
        `https://api.notion.com/v1/databases/${databaseId}/query`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${notionApiKey}`,
            "Content-Type": "application/json",
            "Notion-Version": "2022-06-28",
          },
          body: JSON.stringify({
            filter: {
              and: [
                {
                  property: "Title",
                  title: {
                    equals: contractData.title,
                  },
                },
                {
                  property: "Version",
                  number: {
                    equals: contractData.version || 1,
                  },
                },
              ],
            },
            page_size: 1,
          }),
        }
      )

      if (searchResponse.ok) {
        const searchData = await searchResponse.json()
        if (searchData.results && searchData.results.length > 0) {
          existingPageId = searchData.results[0].id
        }
      }
    } catch (error) {
      console.warn("[Notion] Error searching for existing page:", error)
      // Continue to create new page
    }

    // Create or update page in Notion
    const url = existingPageId
      ? `https://api.notion.com/v1/pages/${existingPageId}`
      : "https://api.notion.com/v1/pages"

    const method = existingPageId ? "PATCH" : "POST"

    const pageData: any = {
      properties,
    }

    if (!existingPageId) {
      pageData.parent = { database_id: databaseId }
    }

    const response = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${notionApiKey}`,
        "Content-Type": "application/json",
        "Notion-Version": "2022-06-28",
      },
      body: JSON.stringify(pageData),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error("[Notion] API error:", errorData)
      throw new Error(`Notion API error: ${errorData.message || response.statusText}`)
    }

    const notionPage = await response.json()

    // Update sync status to synced
    try {
      await setSyncSynced("contracts", contractData.id, notionPage.id)
    } catch (error) {
      console.warn("[Sync Contract] Could not update sync status:", error)
    }

    return NextResponse.json({
      success: true,
      pageId: notionPage.id,
      pageUrl: notionPage.url,
      message: existingPageId
        ? "Contract updated in Notion successfully"
        : "Contract synced to Notion successfully",
    })
  } catch (error) {
    console.error("[Notion] Error syncing contract:", error)
    
    // Update sync status to failed
    if (contractData?.id) {
      try {
        await setSyncFailed(
          "contracts",
          contractData.id,
          error instanceof Error ? error.message : "Unknown error"
        )
      } catch (statusError) {
        console.warn("[Sync Contract] Could not update failed status:", statusError)
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    )
  }
}

