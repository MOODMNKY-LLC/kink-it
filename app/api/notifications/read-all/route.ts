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

    // Mark all notifications as read for this user
    const { error } = await supabase
      .from("notifications")
      .update({ read: true, read_at: new Date().toISOString() })
      .eq("user_id", profile.id)
      .eq("read", false)

    if (error) {
      console.error("[Notifications API] Error marking all as read:", error)
      return NextResponse.json({ error: "Failed to mark all as read" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[Notifications API] Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
