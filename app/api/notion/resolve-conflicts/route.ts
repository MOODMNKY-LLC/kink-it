import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import { getUserProfile } from "@/lib/auth/get-user"
import { resolveConflicts } from "@/lib/notion/conflict-resolution-service"
import type { DatabaseType } from "@/lib/notion/data-transformation"
import type { ResolutionChoice } from "@/lib/notion/conflict-resolution-service"
import type { Conflict } from "@/lib/notion/conflict-detection-service"

interface ResolveConflictsRequest {
  databaseType: DatabaseType
  resolutions: ResolutionChoice[]
  conflicts: Conflict[] // Conflicts from previous retrieve call
}

export async function POST(request: NextRequest) {
  try {
    const profile = await getUserProfile()
    if (!profile) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = (await request.json()) as ResolveConflictsRequest
    const { databaseType, resolutions, conflicts } = body

    if (!databaseType || !resolutions || resolutions.length === 0) {
      return NextResponse.json(
        { success: false, error: "databaseType and resolutions are required" },
        { status: 400 }
      )
    }

    if (!conflicts || conflicts.length === 0) {
      return NextResponse.json(
        { success: false, error: "No conflicts to resolve" },
        { status: 400 }
      )
    }

    const result = await resolveConflicts(
      conflicts,
      resolutions,
      profile.id,
      databaseType
    )

    return NextResponse.json({
      success: result.success,
      recordsUpdated: result.recordsUpdated,
      recordsSkipped: result.recordsSkipped,
      errors: result.errors,
    })
  } catch (error) {
    console.error("[Resolve Conflicts] Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    )
  }
}
