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
    const { key_name, api_key } = body

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
    const testResponse = await fetch("https://api.notion.com/v1/users/me", {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${api_key}`,
        "Notion-Version": "2022-06-28",
      },
    })

    if (!testResponse.ok) {
      return NextResponse.json(
        { error: "Invalid API key. Please check your key and try again." },
        { status: 400 }
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
    console.error("Unexpected error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
