/**
 * Custom Notion OAuth Callback Handler
 * 
 * This handler exchanges the OAuth code directly with Notion to get both
 * access_token and refresh_token, then stores them in our database.
 * After storing tokens, it creates a Supabase session.
 */

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { storeNotionOAuthTokens } from "@/lib/notion-auth"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  const error = requestUrl.searchParams.get("error")
  const errorDescription = requestUrl.searchParams.get("error_description")
  const state = requestUrl.searchParams.get("state")

  // Handle OAuth errors
  if (error) {
    const errorUrl = new URL("/auth/login", requestUrl.origin)
    const decodedDescription = errorDescription
      ? decodeURIComponent(errorDescription.replace(/\+/g, " "))
      : null

    let userFriendlyError = error
    if (error === "access_denied") {
      userFriendlyError = "Authentication was cancelled. Please try again."
    }

    errorUrl.searchParams.set("error", userFriendlyError)
    if (decodedDescription) {
      errorUrl.searchParams.set("error_description", decodedDescription)
    }

    return NextResponse.redirect(errorUrl)
  }

  // Exchange code for tokens
  if (code) {
    const clientId = process.env.SUPABASE_AUTH_EXTERNAL_NOTION_CLIENT_ID
    const clientSecret = process.env.SUPABASE_AUTH_EXTERNAL_NOTION_SECRET
    const redirectUri = `${requestUrl.origin}/api/auth/notion/callback`

    if (!clientId || !clientSecret) {
      const errorUrl = new URL("/auth/login", requestUrl.origin)
      errorUrl.searchParams.set("error", "OAuth configuration error. Please contact support.")
      return NextResponse.redirect(errorUrl)
    }

    try {
      // Exchange authorization code for tokens directly with Notion
      const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64")

      const tokenResponse = await fetch("https://api.notion.com/v1/oauth/token", {
        method: "POST",
        headers: {
          Authorization: `Basic ${credentials}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          grant_type: "authorization_code",
          code: code,
          redirect_uri: redirectUri,
        }),
      })

      if (!tokenResponse.ok) {
        const errorData = await tokenResponse.json().catch(() => ({}))
        const errorUrl = new URL("/auth/login", requestUrl.origin)
        errorUrl.searchParams.set(
          "error",
          `Failed to exchange token: ${errorData.error || tokenResponse.statusText}`
        )
        return NextResponse.redirect(errorUrl)
      }

      const tokenData = await tokenResponse.json()

      // Extract token information
      const {
        access_token,
        refresh_token,
        bot_id,
        workspace_id,
        workspace_name,
        workspace_icon,
        owner,
        duplicated_template_id,
      } = tokenData

      // Get user info from Notion to create/update Supabase user
      const userResponse = await fetch("https://api.notion.com/v1/users/me", {
        headers: {
          Authorization: `Bearer ${access_token}`,
          "Notion-Version": "2022-06-28",
        },
      })

      if (!userResponse.ok) {
        const errorUrl = new URL("/auth/login", requestUrl.origin)
        errorUrl.searchParams.set("error", "Failed to fetch user information from Notion")
        return NextResponse.redirect(errorUrl)
      }

      const notionUser = await userResponse.json()

      // Get user email from Notion (bot owner email or user email)
      const userEmail = notionUser.bot?.owner?.user?.person?.email || 
                       notionUser.bot?.owner?.workspace?.name ||
                       `notion-${bot_id}@notion.local`

      // Create or get Supabase user using Admin API
      const adminClient = createAdminClient()
      
      // Check if user exists by email
      let supabaseUser
      const { data: existingUsers } = await adminClient.auth.admin.listUsers()
      const existingUser = existingUsers?.users?.find(
        (u: any) => u.email === userEmail || 
        (u.app_metadata?.provider === "notion" && u.app_metadata?.providers?.some((p: any) => p.id === bot_id))
      )

      if (existingUser) {
        supabaseUser = existingUser
      } else {
        // Create new user
        const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
          email: userEmail,
          email_confirm: true,
          app_metadata: {
            provider: "notion",
            providers: [{
              provider: "notion",
              id: bot_id,
              workspace_id: workspace_id,
            }],
          },
          user_metadata: {
            full_name: workspace_name || userEmail,
            avatar_url: workspace_icon,
          },
        })

        if (createError) {
          throw new Error(`Failed to create user: ${createError.message}`)
        }

        supabaseUser = newUser.user
      }

      // Store OAuth tokens BEFORE creating session
      await storeNotionOAuthTokens(supabaseUser.id, {
        access_token,
        refresh_token,
        bot_id,
        workspace_id,
        workspace_name: workspace_name || null,
        workspace_icon: workspace_icon || null,
        owner_type: owner?.type || (owner?.workspace ? "workspace" : "user"),
        duplicated_template_id: duplicated_template_id || null,
        expires_in: 3600, // Notion tokens expire in 1 hour
      })

      // Generate a session token for the user
      const { data: sessionData, error: sessionError } = await adminClient.auth.admin.generateLink({
        type: "magiclink",
        email: supabaseUser.email!,
      })

      if (sessionError) {
        throw new Error(`Failed to generate session: ${sessionError.message}`)
      }

      // Create a session using the regular client
      const supabase = await createClient()
      
      // Set the session using the properties token
      const propertiesToken = sessionData.properties?.token
      if (propertiesToken) {
        // Exchange the properties token for a session
        const { data: session, error: exchangeError } = await supabase.auth.setSession({
          access_token: propertiesToken,
          refresh_token: propertiesToken, // Use same token for both (Supabase will handle refresh)
        })

        if (exchangeError) {
          console.error("Error setting session:", exchangeError)
          // Fallback: redirect to login with success message
          const successUrl = new URL("/auth/login", requestUrl.origin)
          successUrl.searchParams.set("success", "Authentication successful. Please sign in.")
          return NextResponse.redirect(successUrl)
        }
      }

      // Success - redirect to home
      return NextResponse.redirect(new URL("/", requestUrl.origin))
    } catch (error) {
      console.error("Error in Notion OAuth callback:", error)
      const errorUrl = new URL("/auth/login", requestUrl.origin)
      errorUrl.searchParams.set(
        "error",
        error instanceof Error ? error.message : "Authentication failed"
      )
      return NextResponse.redirect(errorUrl)
    }
  }

  // No code and no error - invalid callback state
  const errorUrl = new URL("/auth/login", requestUrl.origin)
  errorUrl.searchParams.set("error", "Invalid authentication request. Please try signing in again.")
  return NextResponse.redirect(errorUrl)
}

