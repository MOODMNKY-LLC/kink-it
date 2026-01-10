import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getUserProfile } from "@/lib/auth/get-user"

/**
 * POST /api/achievements/check
 * 
 * Manually trigger achievement check for current user
 * Returns any newly unlocked achievements
 */
export async function POST(request: Request) {
  try {
    console.log("[Achievements Check] Request received")
    
    // Check cookies directly for debugging
    const cookieHeader = request.headers.get("cookie")
    const allCookies = cookieHeader ? cookieHeader.split(";").map(c => c.trim()) : []
    const supabaseCookies = allCookies.filter(c => 
      c.includes("supabase") || 
      c.includes("sb-") ||
      c.includes("auth")
    )
    
    console.log("[Achievements Check] Cookie analysis:", {
      hasCookieHeader: !!cookieHeader,
      totalCookies: allCookies.length,
      supabaseCookies: supabaseCookies.length,
      supabaseCookieNames: supabaseCookies.map(c => c.split("=")[0]),
      cookiePreview: cookieHeader ? cookieHeader.substring(0, 300) : "none",
    })
    
    const profile = await getUserProfile()
    console.log("[Achievements Check] Profile check:", {
      hasProfile: !!profile,
      profileId: profile?.id,
      profileEmail: profile?.email,
    })
    
    if (!profile) {
      console.warn("[Achievements Check] No profile found - returning 401")
      console.warn("[Achievements Check] This usually means:")
      console.warn("  1. User is not authenticated")
      console.warn("  2. Session cookie is missing or expired")
      console.warn("  3. Cookie domain/path mismatch (localhost vs 127.0.0.1)")
      return NextResponse.json({ 
        error: "Unauthorized",
        details: "Please ensure you are logged in and try again",
      }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const bondId = body.bond_id || null

    const supabase = await createClient()

    // Call the check_all_achievements function
    console.log("[Achievements Check] Calling RPC with:", {
      user_id: profile.id,
      bond_id: bondId,
    })
    
    // Call RPC function
    // Function signature: check_all_achievements(p_user_id uuid, p_bond_id uuid DEFAULT NULL)
    // Note: PostgREST schema cache may need refresh if parameter order errors occur
    // Try calling with explicit parameter order matching function definition
    const rpcParams: Record<string, any> = {
      p_user_id: profile.id,
    }
    
    // Only add p_bond_id if provided (function has default NULL)
    if (bondId) {
      rpcParams.p_bond_id = bondId
    }
    
    const { data: unlocked, error } = await supabase.rpc(
      "check_all_achievements",
      rpcParams
    )

    if (error) {
      // Log full error object for debugging
      console.error("[Achievements Check] RPC error:", {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
        fullError: JSON.stringify(error, Object.getOwnPropertyNames(error)),
      })
      
      // Check if error is due to schema cache issue (PGRST202)
      const isSchemaCacheError = 
        error.code === "PGRST202" ||
        error.message?.includes("schema cache") ||
        error.message?.includes("Could not find the function")
      
      if (isSchemaCacheError) {
        console.error("[Achievements Check] PostgREST schema cache issue detected")
        console.error("[Achievements Check] Solution: Restart Supabase local instance:")
        console.error("  1. Stop: supabase stop")
        console.error("  2. Start: supabase start")
        console.error("  3. This will refresh the schema cache")
        
        return NextResponse.json(
          { 
            error: "Schema cache issue - Supabase needs restart",
            details: "PostgREST schema cache is out of sync. Please restart Supabase local instance.",
            code: error.code,
            hint: "Run: supabase stop && supabase start",
          },
          { status: 500 }
        )
      }
      
      // Check if error is due to missing table (e.g., check_ins)
      const isMissingTableError = 
        error.message?.includes("relation") ||
        error.message?.includes("does not exist") ||
        error.code === "42P01"
      
      if (isMissingTableError) {
        console.warn("[Achievements Check] Missing table detected - some achievement types may not be available")
        // Return empty result instead of error - achievements system is partially functional
        return NextResponse.json({
          unlocked: [],
          count: 0,
          warning: "Some achievement checks are unavailable due to missing tables",
        })
      }
      
      return NextResponse.json(
        { 
          error: "Failed to check achievements",
          details: error.message || "Unknown error",
          code: error.code || "UNKNOWN",
          hint: error.hint || null,
        },
        { status: 500 }
      )
    }

    console.log("[Achievements Check] RPC success, unlocked:", unlocked?.length || 0)

    // Handle case where RPC returns null (no unlocks)
    const unlockedArray = Array.isArray(unlocked) ? unlocked : []

    // Mark notifications as sent for newly unlocked achievements
    if (unlockedArray.length > 0) {
      const achievementIds = unlockedArray
        .map((u: any) => u.unlocked_achievement_id)
        .filter((id: any) => id) // Filter out any null/undefined IDs
      
      if (achievementIds.length > 0) {
        const { error: updateError } = await supabase
          .from("user_achievements")
          .update({ notification_sent: true })
          .in("achievement_id", achievementIds)
          .eq("user_id", profile.id)
        
        if (updateError) {
          console.warn("[Achievements Check] Failed to update notifications:", updateError)
          // Don't fail the request if notification update fails
        }
      }
    }

    return NextResponse.json({
      unlocked: unlockedArray,
      count: unlockedArray.length,
    })
  } catch (error) {
    console.error("[Achievements Check] Exception caught:", {
      error,
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined,
      fullError: JSON.stringify(error, Object.getOwnPropertyNames(error)),
    })
    
    return NextResponse.json(
      { 
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
        type: error instanceof Error ? error.name : typeof error,
      },
      { status: 500 }
    )
  }
}
