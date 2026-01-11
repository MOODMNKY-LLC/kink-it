import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getNotionAccessToken } from "@/lib/notion-auth"

/**
 * GET /api/notion/check-oauth
 * Check if user has an active Notion OAuth connection
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

    // Check if user has OAuth tokens stored
    const { data: oauthTokens, error: tokensError } = await supabase
      .from("user_notion_oauth_tokens")
      .select("id")
      .eq("user_id", user.id)
      .limit(1)
      .single()

    // Also try to get access token (which checks OAuth tokens first)
    const accessToken = await getNotionAccessToken(user.id)

    // User has OAuth if:
    // 1. OAuth tokens exist in database, OR
    // 2. Access token can be retrieved (which includes OAuth tokens)
    const hasOAuth = !!(oauthTokens || accessToken)

    return NextResponse.json({ 
      hasOAuth,
      hasStoredTokens: !!oauthTokens,
      hasAccessToken: !!accessToken
    })
  } catch (error) {
    console.error("Unexpected error checking OAuth:", error)
    return NextResponse.json(
      { hasOAuth: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}
