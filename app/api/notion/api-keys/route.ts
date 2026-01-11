import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

/**
 * GET /api/notion/api-keys
 * List all API keys for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
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

    // Fetch user's API keys (without decrypted values)
    const { data: apiKeys, error } = await supabase
      .from("user_notion_api_keys")
      .select("id, key_name, key_hash, is_active, last_used_at, last_validated_at, created_at, updated_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching API keys:", error)
      return NextResponse.json(
        { error: "Failed to fetch API keys" },
        { status: 500 }
      )
    }

    return NextResponse.json({ apiKeys: apiKeys || [] })
  } catch (error) {
    console.error("Unexpected error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

/**
 * POST /api/notion/api-keys
 * Add a new Notion API key
 */
export async function POST(request: NextRequest) {
  try {
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

    const body = await request.json()
    let { key_name, api_key } = body

    // Trim whitespace from inputs
    key_name = typeof key_name === "string" ? key_name.trim() : key_name
    api_key = typeof api_key === "string" ? api_key.trim() : api_key

    // Validate input
    if (!key_name || !api_key) {
      return NextResponse.json(
        { error: "key_name and api_key are required" },
        { status: 400 }
      )
    }

    // Validate API key format
    if (!api_key.match(/^(secret_|ntn_)/)) {
      return NextResponse.json(
        { error: "Invalid Notion API key format. Keys must start with 'secret_' or 'ntn_'" },
        { status: 400 }
      )
    }

    // Test the API key against Notion API
    let testResponse: Response
    let errorDetails: any = {}
    
    try {
      // Use the latest Notion API version
      testResponse = await fetch("https://api.notion.com/v1/users/me", {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${api_key}`,
          "Notion-Version": "2022-06-28",
          "Content-Type": "application/json",
        },
      })

      // Try to read error details even if response is not ok
      if (!testResponse.ok) {
        try {
          const responseText = await testResponse.text()
          if (responseText) {
            try {
              errorDetails = JSON.parse(responseText)
            } catch (e) {
              errorDetails = { raw: responseText.substring(0, 500) }
            }
          }
        } catch (e) {
          console.error("[Notion API Keys] Failed to read error response:", e)
        }
        
        console.error("[Notion API Keys] API key validation failed:", {
          status: testResponse.status,
          statusText: testResponse.statusText,
          errorDetails: errorDetails,
          errorCode: errorDetails?.code,
          errorMessage: errorDetails?.message,
          apiKeyPrefix: api_key.substring(0, 10) + "...", // Log first 10 chars for debugging (not full key)
          apiKeyLength: api_key.length,
        })
        
        // Provide more helpful error messages based on status code and Notion's error
        let errorMessage = "Invalid API key. Please check your key and try again."
        
        if (testResponse.status === 401) {
          if (errorDetails?.code === "unauthorized") {
            errorMessage = "Invalid API key. Please verify that:\n" +
              "1. You copied the correct 'Internal Integration Token' from your Notion integration settings\n" +
              "2. You copied the entire token (it should be quite long)\n" +
              "3. The integration is still active and hasn't been deleted\n" +
              "4. There are no extra spaces before or after the token"
          } else {
            errorMessage = "Invalid API key. Please verify that you copied the correct 'Internal Integration Token' from your Notion integration settings."
          }
        } else if (testResponse.status === 403) {
          errorMessage = "API key is valid but lacks necessary permissions. Make sure your integration has access to your workspace and that you've shared at least one page with it."
        } else if (testResponse.status === 404) {
          errorMessage = "Notion API endpoint not found. Please try again later."
        } else if (errorDetails?.message) {
          errorMessage = `Notion API error: ${errorDetails.message}`
        } else if (errorDetails?.code) {
          errorMessage = `Notion API error (${errorDetails.code}). Please check your integration settings.`
        }
        
        return NextResponse.json(
          { 
            error: errorMessage,
            details: errorDetails,
            status: testResponse.status,
            statusText: testResponse.statusText,
          },
          { status: 400 }
        )
      }
    } catch (fetchError) {
      console.error("[Notion API Keys] Network error during API key validation:", fetchError)
      return NextResponse.json(
        { 
          error: "Failed to connect to Notion API. Please check your internet connection and try again.",
          details: fetchError instanceof Error ? fetchError.message : "Unknown network error"
        },
        { status: 500 }
      )
    }

    // Get encryption key from environment variable
    // In production, this should be stored in Supabase Vault
    const encryptionKey = process.env.NOTION_API_KEY_ENCRYPTION_KEY || process.env.SUPABASE_ENCRYPTION_KEY
    
    if (!encryptionKey) {
      console.error("Encryption key not configured")
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      )
    }

    // Store encrypted API key using database function
    const { data, error } = await supabase.rpc("store_user_notion_api_key", {
      p_user_id: user.id,
      p_key_name: key_name,
      p_api_key: api_key,
      p_encryption_key: encryptionKey,
    })

    if (error) {
      console.error("Error storing API key:", error)
      console.error("Error details:", JSON.stringify(error, null, 2))
      return NextResponse.json(
        { 
          error: "Failed to store API key",
          details: error.message || "Unknown error",
          code: error.code || "UNKNOWN"
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      key_id: data,
      message: "API key stored successfully",
    })
  } catch (error) {
    console.error("[Notion API Keys POST] Unexpected error:", error)
    const errorMessage = error instanceof Error ? error.message : "Internal server error"
    const errorStack = error instanceof Error ? error.stack : undefined
    return NextResponse.json(
      { 
        error: errorMessage,
        details: errorStack ? "Check server logs for details" : undefined
      },
      { status: 500 }
    )
  }
}
