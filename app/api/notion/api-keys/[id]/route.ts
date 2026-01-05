import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

/**
 * PATCH /api/notion/api-keys/[id]
 * Update an API key (rename, activate/deactivate)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    const { key_name, is_active } = body

    // Update API key
    const updateData: any = {}
    if (key_name !== undefined) updateData.key_name = key_name
    if (is_active !== undefined) updateData.is_active = is_active

    const { data, error } = await supabase
      .from("user_notion_api_keys")
      .update(updateData)
      .eq("id", params.id)
      .eq("user_id", user.id) // Ensure user owns this key
      .select()
      .single()

    if (error) {
      console.error("Error updating API key:", error)
      return NextResponse.json(
        { error: "Failed to update API key" },
        { status: 500 }
      )
    }

    if (!data) {
      return NextResponse.json(
        { error: "API key not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      apiKey: {
        id: data.id,
        key_name: data.key_name,
        key_hash: data.key_hash,
        is_active: data.is_active,
        last_used_at: data.last_used_at,
        last_validated_at: data.last_validated_at,
        created_at: data.created_at,
        updated_at: data.updated_at,
      },
    })
  } catch (error) {
    console.error("Unexpected error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/notion/api-keys/[id]
 * Delete an API key
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Delete API key
    const { error } = await supabase
      .from("user_notion_api_keys")
      .delete()
      .eq("id", params.id)
      .eq("user_id", user.id) // Ensure user owns this key

    if (error) {
      console.error("Error deleting API key:", error)
      return NextResponse.json(
        { error: "Failed to delete API key" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "API key deleted successfully",
    })
  } catch (error) {
    console.error("Unexpected error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

/**
 * POST /api/notion/api-keys/[id]/test
 * Test an API key against Notion API
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Get encryption key
    const encryptionKey = process.env.NOTION_API_KEY_ENCRYPTION_KEY || process.env.SUPABASE_ENCRYPTION_KEY
    
    if (!encryptionKey) {
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      )
    }

    // Get decrypted API key
    const { data: decryptedKey, error: decryptError } = await supabase.rpc("get_user_notion_api_key", {
      p_user_id: user.id,
      p_key_id: params.id,
      p_encryption_key: encryptionKey,
    })

    if (decryptError || !decryptedKey) {
      return NextResponse.json(
        { error: "Failed to retrieve API key" },
        { status: 500 }
      )
    }

    // Test the API key against Notion API
    const testResponse = await fetch("https://api.notion.com/v1/users/me", {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${decryptedKey}`,
        "Notion-Version": "2022-06-28",
      },
    })

    if (!testResponse.ok) {
      const errorData = await testResponse.json().catch(() => ({}))
      return NextResponse.json(
        {
          success: false,
          valid: false,
          error: "API key is invalid or expired",
          details: errorData,
        },
        { status: 400 }
      )
    }

    const userData = await testResponse.json()

    // Update last_validated_at
    await supabase
      .from("user_notion_api_keys")
      .update({ last_validated_at: new Date().toISOString() })
      .eq("id", params.id)
      .eq("user_id", user.id)

    return NextResponse.json({
      success: true,
      valid: true,
      message: "API key is valid",
      user: userData,
    })
  } catch (error) {
    console.error("Unexpected error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

