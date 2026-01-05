import { createClient } from "@/lib/supabase/server"
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
    
    // Check if user has completed onboarding
    const {
      data: { user },
    } = await supabase.auth.getUser()

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




