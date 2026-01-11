import { NextResponse } from "next/server"
import { getUserProfile } from "@/lib/auth/get-user"
import { getNotifications } from "@/lib/notifications/get-notifications"

export async function GET() {
  try {
    // getUserProfile returns null if not authenticated (doesn't redirect)
    const profile = await getUserProfile()

    if (!profile) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const notifications = await getNotifications(profile.id)

    return NextResponse.json({ notifications })
  } catch (error) {
    console.error("[Notifications API] Error:", error)
    
    // Provide more detailed error information
    const errorMessage = error instanceof Error 
      ? error.message 
      : typeof error === "object" && error !== null && "message" in error
        ? String((error as { message: unknown }).message)
        : "Internal server error"
    
    // Check if it's a schema error (table doesn't exist)
    const isSchemaError = 
      errorMessage.includes("relation") && errorMessage.includes("does not exist") ||
      errorMessage.includes("Could not find the table") ||
      errorMessage.includes("PGRST204") ||
      errorMessage.includes("PGRST205")
    
    // Return empty array for schema errors (graceful degradation)
    if (isSchemaError) {
      console.warn("[Notifications API] Notifications table not found - returning empty array")
      return NextResponse.json({ notifications: [] })
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}
