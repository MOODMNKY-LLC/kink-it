import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

/**
 * DELETE /api/notion/disconnect
 * Disconnect Notion OAuth integration by deleting stored OAuth tokens
 */
export async function DELETE(request: NextRequest) {
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

    // Delete user's Notion OAuth tokens
    // RLS policies ensure users can only delete their own tokens
    const { error: deleteError } = await supabase
      .from("user_notion_oauth_tokens")
      .delete()
      .eq("user_id", user.id)

    if (deleteError) {
      console.error("Error deleting Notion OAuth tokens:", deleteError)
      return NextResponse.json(
        { error: "Failed to disconnect Notion integration" },
        { status: 500 }
      )
    }

    // Note: We do NOT delete manual API keys (user_notion_api_keys)
    // Those are separate and should remain available

    return NextResponse.json({ 
      success: true,
      message: "Notion OAuth integration disconnected successfully. You can reconnect anytime by signing in with Notion again."
    })
  } catch (error) {
    console.error("Unexpected error disconnecting Notion:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
