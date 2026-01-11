import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  const state = requestUrl.searchParams.get("state")
  const guildId = requestUrl.searchParams.get("guild_id")
  const error = requestUrl.searchParams.get("error")

  // Handle OAuth errors
  if (error) {
    const redirectUrl = new URL("/onboarding", requestUrl.origin)
    redirectUrl.searchParams.set("step", "4")
    redirectUrl.searchParams.set("error", "discord_install_failed")
    return NextResponse.redirect(redirectUrl)
  }

  // Verify state
  const storedState = request.cookies.get("discord_oauth_state")?.value
  if (!state || state !== storedState) {
    const redirectUrl = new URL("/onboarding", requestUrl.origin)
    redirectUrl.searchParams.set("step", "4")
    redirectUrl.searchParams.set("error", "invalid_state")
    return NextResponse.redirect(redirectUrl)
  }

  if (!code) {
    const redirectUrl = new URL("/onboarding", requestUrl.origin)
    redirectUrl.searchParams.set("step", "4")
    redirectUrl.searchParams.set("error", "no_code")
    return NextResponse.redirect(redirectUrl)
  }

  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      const redirectUrl = new URL("/auth/login", requestUrl.origin)
      redirectUrl.searchParams.set("error", "not_authenticated")
      return NextResponse.redirect(redirectUrl)
    }

    // Exchange code for access token (if needed for verification)
    const clientId = process.env.DISCORD_CLIENT_ID
    const clientSecret = process.env.DISCORD_CLIENT_SECRET
    const redirectUri = `${requestUrl.origin}/api/auth/discord/callback`

    if (clientId && clientSecret) {
      const tokenResponse = await fetch("https://discord.com/api/oauth2/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          grant_type: "authorization_code",
          code: code,
          redirect_uri: redirectUri,
        }),
      })

      if (tokenResponse.ok) {
        const tokenData = await tokenResponse.json()
        
        // Store Discord integration data in onboarding_data
        const { data: profile } = await supabase
          .from("profiles")
          .select("onboarding_data")
          .eq("id", user.id)
          .single()

        const onboardingData = profile?.onboarding_data || {}
        onboardingData.discord_installed = true
        onboardingData.discord_guild_id = guildId
        onboardingData.discord_access_token = tokenData.access_token // Store securely if needed

        await supabase
          .from("profiles")
          .update({
            onboarding_data: onboardingData,
            onboarding_step: 4, // Update step to 4 (Discord step)
            updated_at: new Date().toISOString(),
          })
          .eq("id", user.id)
      }
    }

    // Redirect back to onboarding step 4 with success
    const redirectUrl = new URL("/onboarding", requestUrl.origin)
    redirectUrl.searchParams.set("step", "4")
    redirectUrl.searchParams.set("discord_installed", "true")
    
    const response = NextResponse.redirect(redirectUrl)
    // Clear state cookie
    response.cookies.delete("discord_oauth_state")
    
    return response
  } catch (error) {
    console.error("Error in Discord callback:", error)
    const redirectUrl = new URL("/onboarding", requestUrl.origin)
    redirectUrl.searchParams.set("step", "4")
    redirectUrl.searchParams.set("error", "discord_callback_error")
    return NextResponse.redirect(redirectUrl)
  }
}
