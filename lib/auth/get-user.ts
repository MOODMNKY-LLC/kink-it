import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import type { Profile } from "@/types/profile"

export async function getCurrentUser() {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    return null
  }

  return user
}

/**
 * Require authentication - redirects to login if not authenticated.
 * Use this in Server Components and Server Actions.
 * DO NOT use in API Route Handlers (use getCurrentUser instead and return 401).
 */
export async function requireAuth() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/auth/login")
  }

  return user
}

/**
 * Get the user's profile.
 * For API routes, returns null if not authenticated (caller should return 401).
 * For Server Components, this is fine as the page will handle auth separately.
 */
export async function getUserProfile(): Promise<Profile | null> {
  const user = await getCurrentUser() // Don't use requireAuth - it redirects which breaks API routes
  
  if (!user) {
    return null // Let the caller handle the null case (API routes should return 401)
  }
  
  const supabase = await createClient()

  const { data: profile, error } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  if (error) {
    // Log detailed error information
    console.error("[v0] Error fetching profile:", {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
      userId: user.id,
    })
    
    // If profile doesn't exist (PGRST116), try to create it
    if (error.code === "PGRST116") {
      console.log("[v0] Profile not found, attempting to create profile for user:", user.id)
      
      // Check if any admin already exists (prevents seeded users from blocking admin assignment)
      const { count: adminCount, error: adminCountError } = await supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("system_role", "admin")

      if (adminCountError) {
        console.error("[v0] Error counting existing admins:", adminCountError)
        return null
      }

      // Check if user is authenticating via OAuth (has provider metadata)
      // This distinguishes real authenticated users from seeded/test users
      const hasOAuthMetadata = !!(
        user.app_metadata?.provider ||
        user.user_metadata?.provider ||
        user.user_metadata?.avatar_url ||
        user.user_metadata?.full_name ||
        user.user_metadata?.name
      )

      // Only assign admin if no admin exists AND user is authenticating via OAuth
      // This ensures seeded users don't get admin, but first real authenticated user does
      const isFirstAuthenticatedUser = (adminCount === 0 && hasOAuthMetadata)

      // Try to create profile with default values
      const { data: newProfile, error: createError } = await supabase
        .from("profiles")
        .insert({
          id: user.id,
          email: user.email || "",
          display_name: user.email?.split("@")[0] || "User",
          dynamic_role: isFirstAuthenticatedUser ? "dominant" : "submissive",
          system_role: isFirstAuthenticatedUser ? "admin" : "user",
        })
        .select()
        .single()
      
      if (createError) {
        console.error("[v0] Error creating profile:", createError)
        return null
      }
      
      return newProfile as Profile
    }
    
    return null
  }

  if (!profile) {
    console.warn("[v0] Profile query returned null for user:", user.id)
    return null
  }

  return profile as Profile
}

export async function isAdmin(): Promise<boolean> {
  const profile = await getUserProfile()
  return profile?.system_role === "admin"
}

export async function requireAdmin() {
  const profile = await getUserProfile()

  if (!profile || profile.system_role !== "admin") {
    redirect("/")
  }

  return profile
}
