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
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}




