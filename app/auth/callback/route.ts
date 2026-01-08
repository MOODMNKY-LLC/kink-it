import { createClient } from "@/lib/supabase/server"
import { storeNotionOAuthTokens } from "@/lib/notion-auth"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  const error = requestUrl.searchParams.get("error")
  const errorDescription = requestUrl.searchParams.get("error_description")

  // Handle OAuth errors
  if (error) {
    const errorUrl = new URL("/auth/login", requestUrl.origin)
    
    // Decode error description for better readability
    const decodedDescription = errorDescription 
      ? decodeURIComponent(errorDescription.replace(/\+/g, " "))
      : null
    
    // Map common OAuth errors to user-friendly messages
    let userFriendlyError = error
    if (error === "invalid_scope") {
      userFriendlyError = "Discord authentication is not available. Please use Notion to sign in."
    } else if (error === "access_denied") {
      userFriendlyError = "Authentication was cancelled. Please try again."
    }
    
    errorUrl.searchParams.set("error", userFriendlyError)
    if (decodedDescription) {
      errorUrl.searchParams.set("error_description", decodedDescription)
    }
    
    return NextResponse.redirect(errorUrl)
  }

  // Exchange code for session
  if (code) {
    const supabase = await createClient()
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

    if (exchangeError) {
      const errorUrl = new URL("/auth/login", requestUrl.origin)
      
      // Handle specific Supabase auth errors
      let userFriendlyError = exchangeError.message
      if (exchangeError.message.includes("refresh_token_not_found")) {
        userFriendlyError = "Session expired. Please sign in again."
      } else if (exchangeError.message.includes("invalid_grant")) {
        userFriendlyError = "Authentication code expired. Please try signing in again."
      }
      
      errorUrl.searchParams.set("error", userFriendlyError)
      return NextResponse.redirect(errorUrl)
    }
    
    // Get user and session after exchange
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const {
      data: { session },
    } = await supabase.auth.getSession()

    // Check if we have token data passed from custom callback
    const notionTokensParam = requestUrl.searchParams.get("notion_tokens")
    
    // Store Notion OAuth tokens if available
    if (user && session?.provider_token) {
      try {
        let tokenData: {
          access_token: string
          refresh_token: string
          bot_id: string
          workspace_id: string
          workspace_name?: string
          workspace_icon?: string
          owner_type?: string
          duplicated_template_id?: string
        } | null = null

        // If we have token data from custom callback, use it
        if (notionTokensParam) {
          try {
            tokenData = JSON.parse(Buffer.from(notionTokensParam, "base64").toString())
          } catch (e) {
            console.error("Error parsing notion_tokens param:", e)
          }
        }

        // If no token data from param, try to extract from session
        if (!tokenData) {
          const accessToken = session.provider_token
          // Try to get refresh token from session (Supabase doesn't expose this reliably)
          const refreshToken = (session as any).provider_refresh_token || null

          // Log session structure for debugging
          console.log("[Auth Callback] Session structure:", {
            hasProviderToken: !!accessToken,
            hasProviderRefreshToken: !!refreshToken,
            sessionKeys: Object.keys(session),
            userMetadata: session.user?.app_metadata,
            userMetadataKeys: session.user?.app_metadata ? Object.keys(session.user.app_metadata) : [],
          })

          if (accessToken) {
            // Fetch user info from Notion to get workspace details
            try {
              const notionUserResponse = await fetch("https://api.notion.com/v1/users/me", {
                headers: {
                  Authorization: `Bearer ${accessToken}`,
                  "Notion-Version": "2022-06-28",
                },
              })

              if (notionUserResponse.ok) {
                const notionUser = await notionUserResponse.json()
                
                // Extract workspace_id from bot owner or use bot ID as fallback
                // Notion API returns workspace_id in bot.owner.workspace_id
                const workspaceId = notionUser.bot?.owner?.workspace_id || 
                                  notionUser.bot?.workspace?.id ||
                                  notionUser.workspace?.id ||
                                  ""
                
                // Extract bot_id
                const botId = notionUser.bot?.id || notionUser.id || ""
                
                // Extract workspace name and icon from bot owner
                const workspaceName = notionUser.bot?.owner?.workspace_name || 
                                     notionUser.workspace?.name ||
                                     null
                const workspaceIcon = notionUser.bot?.owner?.workspace_icon ||
                                     notionUser.workspace?.icon ||
                                     null
                const ownerType = notionUser.bot?.owner?.type || "user"
                
                // Get duplicated_template_id from session metadata if available
                const duplicatedTemplateId = session.user?.app_metadata?.provider_metadata?.duplicated_template_id || null
                
                if (!workspaceId || !botId) {
                  console.warn("Could not extract workspace_id or bot_id from Notion user response:", {
                    notionUser,
                    workspaceId,
                    botId,
                  })
                }
                
                tokenData = {
                  access_token: accessToken,
                  refresh_token: refreshToken || "",
                  bot_id: botId,
                  workspace_id: workspaceId,
                  workspace_name: workspaceName,
                  workspace_icon: workspaceIcon,
                  owner_type: ownerType,
                  duplicated_template_id: duplicatedTemplateId,
                }
              } else {
                const errorText = await notionUserResponse.text()
                console.error("Failed to fetch Notion user info:", {
                  status: notionUserResponse.status,
                  statusText: notionUserResponse.statusText,
                  body: errorText,
                })
              }
            } catch (apiError) {
              console.error("Error fetching Notion user info:", apiError)
            }
          }
        }

        // Store tokens if we have them
        if (tokenData && tokenData.access_token) {
          // Validate required fields before storing
          if (!tokenData.workspace_id || !tokenData.bot_id) {
            console.error("Cannot store Notion OAuth tokens: missing required fields", {
              hasAccessToken: !!tokenData.access_token,
              hasWorkspaceId: !!tokenData.workspace_id,
              hasBotId: !!tokenData.bot_id,
              tokenData,
            })
          } else {
            try {
              await storeNotionOAuthTokens(user.id, {
                access_token: tokenData.access_token,
                refresh_token: tokenData.refresh_token,
                bot_id: tokenData.bot_id,
                workspace_id: tokenData.workspace_id,
                workspace_name: tokenData.workspace_name,
                workspace_icon: tokenData.workspace_icon,
                owner_type: tokenData.owner_type,
                duplicated_template_id: tokenData.duplicated_template_id,
                expires_in: 3600, // Default to 1 hour
              })
              console.log("Successfully stored Notion OAuth tokens for user:", user.id)
            } catch (storeError) {
              console.error("Failed to store Notion OAuth tokens:", storeError)
              // Don't fail auth flow if token storage fails - user can still use session token
            }
          }
        } else {
          console.warn("No token data available to store for user:", user.id)
        }
      } catch (error) {
        console.error("Error processing Notion OAuth tokens:", error)
        // Don't fail the auth flow if token storage fails
      }
    }
    
    // Check if user has completed onboarding
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("onboarding_completed")
        .eq("id", user.id)
        .single()

      // Redirect to onboarding if not completed
      if (!profile?.onboarding_completed) {
        return NextResponse.redirect(new URL("/onboarding", requestUrl.origin))
      }
    }

    // Successful authentication - redirect to home
    return NextResponse.redirect(new URL("/", requestUrl.origin))
  }

  // No code and no error - invalid callback state
  const errorUrl = new URL("/auth/login", requestUrl.origin)
  errorUrl.searchParams.set("error", "Invalid authentication request. Please try signing in again.")
  return NextResponse.redirect(errorUrl)
}




