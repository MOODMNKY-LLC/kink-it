import { NextRequest, NextResponse } from "next/server"
import { getUserProfile } from "@/lib/auth/get-user"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const profile = await getUserProfile()

    if (!profile) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = await createClient()

    // Delete all notifications for this user
    const { error } = await supabase
      .from("notifications")
      .delete()
      .eq("user_id", profile.id)

    if (error) {
      console.error("[Notifications API] Error deleting all:", error)
      return NextResponse.json({ error: "Failed to delete all notifications" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[Notifications API] Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
