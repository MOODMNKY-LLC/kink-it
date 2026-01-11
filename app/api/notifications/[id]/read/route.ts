import { NextRequest, NextResponse } from "next/server"
import { getUserProfile } from "@/lib/auth/get-user"
import { createClient } from "@/lib/supabase/server"

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const profile = await getUserProfile()

    if (!profile) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = await createClient()
    const notificationId = params.id

    // Mark notification as read
    const { error } = await supabase
      .from("notifications")
      .update({ read: true, read_at: new Date().toISOString() })
      .eq("id", notificationId)
      .eq("user_id", profile.id)

    if (error) {
      console.error("[Notifications API] Error marking as read:", error)
      return NextResponse.json({ error: "Failed to mark as read" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[Notifications API] Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
