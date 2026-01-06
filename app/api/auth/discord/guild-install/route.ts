import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function GET(request: NextRequest) {
  const clientId = process.env.DISCORD_CLIENT_ID
  const redirectUri = `${request.nextUrl.origin}/api/auth/discord/callback`
  
  if (!clientId) {
    return NextResponse.json(
      { error: "Discord client ID not configured" },
      { status: 500 }
    )
  }

  // Generate state for CSRF protection
  const state = crypto.randomUUID()

  // Build Discord OAuth2 URL with guild install
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "bot",
    permissions: "274877906944", // Send Messages, Read Messages, Embed Links
    state: state,
  })

  const discordUrl = `https://discord.com/api/oauth2/authorize?${params.toString()}`

  // Store state in cookie for verification
  const response = NextResponse.redirect(discordUrl)
  response.cookies.set("discord_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600, // 10 minutes
  })

  return response
}




