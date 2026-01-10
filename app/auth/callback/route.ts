import { createServerClient } from "@supabase/ssr"
import { storeNotionOAuthTokens } from "@/lib/notion-auth"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { cookies } from "next/headers"

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  const token = requestUrl.searchParams.get("token")
  const type = requestUrl.searchParams.get("type")
  const error = requestUrl.searchParams.get("error")
  const errorDescription = requestUrl.searchParams.get("error_description")

  // Normalize origin to use 127.0.0.1 instead of localhost in development
  // This ensures consistency with Next.js server and Supabase config
  const normalizedOrigin = requestUrl.origin.replace(/localhost/i, "127.0.0.1")
  
  // Create server client with proper cookie handling for PKCE code verifier
  // The PKCE code verifier is stored in cookies by createBrowserClient
  // and must be readable by the server client during code exchange
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          } catch {
            // Ignore errors in route handlers - cookies are set via response
          }
        },
      },
    }
  )

  // Handle OAuth errors
  if (error) {
    const errorUrl = new URL("/auth/login", normalizedOrigin)
    
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

  // Handle magic link callback (from Notion OAuth flow)
  if (type === "magiclink") {
    // Use the same route handler client created above
    
    console.log("[Auth Callback] Magic link callback received")
    
    // When Supabase redirects to our callback after magic link verification,
    // the session should already be established via cookies
    // We just need to verify the user is authenticated
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    console.log("[Auth Callback] User check:", {
      hasUser: !!user,
      userId: user?.id,
      email: user?.email,
      error: userError?.message,
    })

    // Also check session to ensure it's established
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    console.log("[Auth Callback] Session check:", {
      hasSession: !!session,
      sessionUserId: session?.user?.id,
      error: sessionError?.message,
    })

    if (userError || !user) {
      console.error("[Auth Callback] Magic link user error:", userError)
      // If we have a session but getUser failed, try refreshing
      if (session) {
        console.log("[Auth Callback] Have session but getUser failed, trying refresh")
        const { data: refreshedUser } = await supabase.auth.getUser()
        if (refreshedUser?.user) {
          // Use refreshed user
          const { data: profile } = await supabase
            .from("profiles")
            .select("onboarding_completed")
            .eq("id", refreshedUser.user.id)
            .single()

          if (!profile?.onboarding_completed) {
            return NextResponse.redirect(new URL("/onboarding", normalizedOrigin))
          }
          return NextResponse.redirect(new URL("/", normalizedOrigin))
        }
      }
      
      const errorUrl = new URL("/auth/login", normalizedOrigin)
      errorUrl.searchParams.set("error", "Failed to verify authentication. Please try again.")
      return NextResponse.redirect(errorUrl)
    }

    // Session is now established via cookies
    // Check if user needs onboarding
    const { data: profile } = await supabase
      .from("profiles")
      .select("onboarding_completed")
      .eq("id", user.id)
      .single()

    console.log("[Auth Callback] Profile check:", {
      hasProfile: !!profile,
      onboardingCompleted: profile?.onboarding_completed,
    })

    if (!profile?.onboarding_completed) {
      return NextResponse.redirect(new URL("/onboarding", normalizedOrigin))
    }

    // Success - redirect to home
    console.log("[Auth Callback] Authentication successful, redirecting to home")
    console.log("[Auth Callback] Redirect URL:", new URL("/", normalizedOrigin).toString())
    console.log("[Auth Callback] Request origin:", requestUrl.origin)
    console.log("[Auth Callback] Normalized origin:", normalizedOrigin)
    return NextResponse.redirect(new URL("/", normalizedOrigin))
  }

  // Exchange code for session (Supabase OAuth flow)
  // Use createServerClient for proper PKCE code verifier handling
  if (code) {
    // Log cookies for debugging PKCE issues
    if (process.env.NODE_ENV === "development") {
      const allCookies = cookieStore.getAll()
      console.log("[Auth Callback] All cookies:", allCookies.map(c => ({ name: c.name, hasValue: !!c.value })))
      
      const pkceCookies = allCookies.filter(c => 
        c.name.includes("pkce") || 
        c.name.includes("code-verifier") ||
        c.name.includes("code_verifier") ||
        (c.name.includes("sb-") && (c.name.includes("auth") || c.name.includes("code")))
      )
      console.log("[Auth Callback] PKCE-related cookies:", pkceCookies.map(c => ({ 
        name: c.name, 
        hasValue: !!c.value,
        valueLength: c.value?.length || 0 
      })))
      
      if (pkceCookies.length === 0) {
        console.warn("[Auth Callback] ⚠️ No PKCE code verifier cookies found!")
        console.warn("[Auth Callback] This will cause 'PKCE code verifier not found' error")
        console.warn("[Auth Callback] Check that cookies are being set during OAuth initiation")
      }
    }
    
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

    if (exchangeError) {
      const errorUrl = new URL("/auth/login", normalizedOrigin)
      
      // Handle specific Supabase auth errors
      let userFriendlyError = exchangeError.message
      if (exchangeError.message.includes("refresh_token_not_found")) {
        userFriendlyError = "Session expired. Please sign in again."
      } else if (exchangeError.message.includes("invalid_grant")) {
        userFriendlyError = "Authentication code expired. Please try signing in again."
      } else if (exchangeError.message.includes("PKCE") || exchangeError.message.includes("code verifier")) {
        // PKCE code verifier not found - this happens when cookies aren't available
        userFriendlyError = "Authentication session expired. Please try signing in again. If this persists, clear your browser cookies and try again."
      }
      
      errorUrl.searchParams.set("error", userFriendlyError)
      if (exchangeError.message) {
        errorUrl.searchParams.set("error_description", exchangeError.message)
      }
      return NextResponse.redirect(errorUrl)
    }
    
    // Get user and session after exchange
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const {
      data: { session },
    } = await supabase.auth.getSession()

    console.log("[Auth Callback] Session after exchange:", {
      hasUser: !!user,
      hasSession: !!session,
      hasProviderToken: !!session?.provider_token,
      hasProviderRefreshToken: !!session?.provider_refresh_token,
      sessionKeys: session ? Object.keys(session) : [],
    })

    // Try to extract and store Notion OAuth tokens from session
    // Note: Supabase may not expose refresh_token, but we'll try to capture what we can
    // Check if we have token data passed from custom callback (legacy support)
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
        return NextResponse.redirect(new URL("/onboarding", normalizedOrigin))
      }
    }

    // Successful authentication - redirect to home
    return NextResponse.redirect(new URL("/", normalizedOrigin))
  }

  // No code and no error - invalid callback state
  const errorUrl = new URL("/auth/login", normalizedOrigin)
  errorUrl.searchParams.set("error", "Invalid authentication request. Please try signing in again.")
  return NextResponse.redirect(errorUrl)
}




