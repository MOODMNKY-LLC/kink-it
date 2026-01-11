import { type NextRequest, NextResponse } from "next/server"
import { getUserProfile } from "@/lib/auth/get-user"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

/**
 * Check Notion Database Sync Status
 * 
 * Verifies if the user has synced their Image Generations database from the template.
 * Returns sync status and database information if available.
 */
export async function GET(request: NextRequest) {
  try {
    const profile = await getUserProfile()
    if (!profile) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }

    const supabase = await createClient()

    // Check if Image Generations database is synced
    const { data: imageGenDb, error } = await supabase
      .from("notion_databases")
      .select("database_id, database_name, parent_page_id")
      .eq("user_id", profile.id)
      .eq("database_type", "image_generations")
      .single()

    if (error || !imageGenDb) {
      // Database not synced
      return NextResponse.json({
        success: true,
        synced: false,
        message: "Image Generations database not synced. Please sync your Notion template.",
        database: null,
      })
    }

    // Database is synced
    return NextResponse.json({
      success: true,
      synced: true,
      message: "Image Generations database is synced and ready.",
      database: {
        id: imageGenDb.database_id,
        name: imageGenDb.database_name,
        parentPageId: imageGenDb.parent_page_id,
      },
    })
  } catch (error) {
    console.error("[Notion] Error checking sync status:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    )
  }
}
