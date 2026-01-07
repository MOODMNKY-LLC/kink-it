/**
 * Notion OAuth Token Management Utility
 * 
 * Handles persistent storage and refresh of Notion OAuth tokens.
 * Enables token persistence across sessions without requiring re-authentication.
 */

import { createClient } from "@/lib/supabase/server"

export interface NotionOAuthTokenData {
  access_token: string
  refresh_token: string
  bot_id: string
  workspace_id: string
  workspace_name?: string
  workspace_icon?: string
  owner_type?: string
  duplicated_template_id?: string
  expires_in?: number // Token expiry in seconds (typically 3600)
}

export interface NotionRefreshTokenResponse {
  access_token: string
  refresh_token: string
  token_type: string
  bot_id: string
  workspace_id: string
  workspace_name?: string
  workspace_icon?: string
  owner?: {
    type: string
    user?: {
      object: string
      id: string
    }
  }
}

/**
 * Stores Notion OAuth tokens in the database after successful authentication
 */
export async function storeNotionOAuthTokens(
  userId: string,
  tokenData: NotionOAuthTokenData
): Promise<void> {
  const supabase = await createClient()
  const encryptionKey =
    process.env.NOTION_API_KEY_ENCRYPTION_KEY || process.env.SUPABASE_ENCRYPTION_KEY

  if (!encryptionKey) {
    throw new Error("Encryption key not configured. Ensure NOTION_API_KEY_ENCRYPTION_KEY or SUPABASE_ENCRYPTION_KEY is set.")
  }

  const { error } = await supabase.rpc("store_user_notion_oauth_tokens", {
    p_user_id: userId,
    p_access_token: tokenData.access_token,
    p_refresh_token: tokenData.refresh_token,
    p_bot_id: tokenData.bot_id,
    p_workspace_id: tokenData.workspace_id,
    p_workspace_name: tokenData.workspace_name || null,
    p_workspace_icon: tokenData.workspace_icon || null,
    p_owner_type: tokenData.owner_type || null,
    p_duplicated_template_id: tokenData.duplicated_template_id || null,
    p_expires_in: tokenData.expires_in || 3600, // Default to 1 hour
    p_encryption_key: encryptionKey,
  })

  if (error) {
    console.error("Error storing Notion OAuth tokens:", error)
    throw new Error(`Failed to store OAuth tokens: ${error.message}`)
  }
}

/**
 * Refreshes a Notion OAuth access token using the refresh token
 */
async function refreshNotionAccessToken(
  refreshToken: string
): Promise<NotionRefreshTokenResponse> {
  const clientId = process.env.SUPABASE_AUTH_EXTERNAL_NOTION_CLIENT_ID
  const clientSecret = process.env.SUPABASE_AUTH_EXTERNAL_NOTION_SECRET

  if (!clientId || !clientSecret) {
    throw new Error("Notion OAuth credentials not configured")
  }

  // Encode credentials for Basic Auth
  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64")

  const response = await fetch("https://api.notion.com/v1/oauth/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(
      `Failed to refresh Notion token: ${response.status} ${errorData.error || response.statusText}`
    )
  }

  return response.json()
}

/**
 * Gets a valid Notion access token for a user, refreshing if necessary
 * 
 * This function:
 * 1. Checks for stored OAuth tokens
 * 2. If expired or expiring soon, refreshes using refresh_token
 * 3. Falls back to session.provider_token if no stored tokens
 * 4. Falls back to manual API keys if no OAuth tokens
 * 
 * @returns Valid access token or null if none available
 */
export async function getNotionAccessToken(userId: string): Promise<string | null> {
  const supabase = await createClient()
  const encryptionKey =
    process.env.NOTION_API_KEY_ENCRYPTION_KEY || process.env.SUPABASE_ENCRYPTION_KEY

  if (!encryptionKey) {
    console.warn("Encryption key not configured. Falling back to session token.")
    // Fallback to session token
    const {
      data: { session },
    } = await supabase.auth.getSession()
    return session?.provider_token || null
  }

  // Check if stored token exists and is expired
  const { data: isExpired, error: expiredCheckError } = await supabase.rpc("is_notion_oauth_token_expired", {
    p_user_id: userId,
    p_buffer_minutes: 5, // Refresh if expiring within 5 minutes
  })

  // If error checking expiry, log and continue to fallback
  if (expiredCheckError) {
    console.warn("Error checking token expiry, falling back to session token:", expiredCheckError.message)
  }

  // If expired or expiring soon, refresh the token
  if (isExpired && !expiredCheckError) {
    try {
      // Get refresh token
      const { data: refreshToken } = await supabase.rpc("get_user_notion_oauth_refresh_token", {
        p_user_id: userId,
        p_encryption_key: encryptionKey,
      })

      if (refreshToken) {
        // Refresh the token
        const refreshed = await refreshNotionAccessToken(refreshToken)

        // Update stored tokens
        await supabase.rpc("update_user_notion_oauth_tokens", {
          p_user_id: userId,
          p_access_token: refreshed.access_token,
          p_refresh_token: refreshed.refresh_token,
          p_expires_in: 3600, // Notion tokens typically expire in 1 hour
          p_encryption_key: encryptionKey,
        })

        return refreshed.access_token
      }
    } catch (error) {
      console.error("Error refreshing Notion token:", error)
      // If refresh fails, continue to fallback options
    }
  }

  // Try to get stored access token
  const { data: accessToken, error: tokenError } = await supabase.rpc("get_user_notion_oauth_access_token", {
    p_user_id: userId,
    p_encryption_key: encryptionKey,
  })

  if (tokenError) {
    console.warn("Error retrieving stored Notion OAuth token, falling back to session token:", tokenError.message)
  }

  if (accessToken) {
    return accessToken
  }

  // Fallback 1: Try session provider token
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (session?.provider_token) {
    return session.provider_token
  }

  // Fallback 2: Try manual API keys (backward compatibility)
  const { data: apiKeys } = await supabase
    .from("user_notion_api_keys")
    .select("id, key_name")
    .eq("user_id", userId)
    .eq("is_active", true)
    .order("last_validated_at", { ascending: false, nullsFirst: false })
    .limit(1)
    .single()

  if (apiKeys) {
    const { data: decryptedKey } = await supabase.rpc("get_user_notion_api_key", {
      p_user_id: userId,
      p_key_id: apiKeys.id,
      p_encryption_key: encryptionKey,
    })
    if (decryptedKey) {
      return decryptedKey
    }
  }

  return null
}

/**
 * Extracts OAuth token data from Supabase session
 * Used during OAuth callback to store tokens
 */
export function extractNotionOAuthTokensFromSession(session: {
  provider_token?: string
  provider_refresh_token?: string
  user: {
    app_metadata?: {
      provider?: string
      providers?: Array<{
        provider?: string
        [key: string]: unknown
      }>
    }
    user_metadata?: {
      [key: string]: unknown
    }
  }
}): NotionOAuthTokenData | null {
  // Supabase stores OAuth tokens in session, but we need to extract them
  // The provider_token is the access_token
  // The provider_refresh_token is the refresh_token
  
  if (!session.provider_token) {
    return null
  }

  // Note: Supabase may not expose provider_refresh_token directly
  // We may need to extract it from the OAuth callback response
  // For now, we'll handle this in the callback route where we have access to the full OAuth response

  return {
    access_token: session.provider_token,
    refresh_token: session.provider_refresh_token || "", // May be empty if Supabase doesn't expose it
    bot_id: "", // Will be set from OAuth response
    workspace_id: "", // Will be set from OAuth response
    expires_in: 3600, // Default to 1 hour
  }
}

/**
 * Checks if user has valid Notion OAuth tokens stored
 */
export async function hasNotionOAuthTokens(userId: string): Promise<boolean> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("user_notion_oauth_tokens")
    .select("id")
    .eq("user_id", userId)
    .single()

  return !error && !!data
}

