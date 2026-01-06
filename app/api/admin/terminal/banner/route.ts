import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

/**
 * GET /api/admin/terminal/banner
 * Get terminal banner text for a user (admin can view any user's banner)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from("profiles")
      .select("system_role")
      .eq("id", user.id)
      .single()

    if (profile?.system_role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const targetUserId = userId || user.id

    const { data: targetProfile, error } = await supabase
      .from("profiles")
      .select("banner_text, widget_banner_text")
      .eq("id", targetUserId)
      .single()

    if (error) {
      return NextResponse.json({ error: "Failed to fetch banner" }, { status: 500 })
    }

    return NextResponse.json({
      banner_text: targetProfile?.banner_text || targetProfile?.widget_banner_text || "",
    })
  } catch (error) {
    console.error("Error fetching banner:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

/**
 * POST /api/admin/terminal/banner
 * Update terminal banner text for a user (admin can update any user's banner)
 * Also broadcasts update via Supabase Realtime
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from("profiles")
      .select("system_role")
      .eq("id", user.id)
      .single()

    if (profile?.system_role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const { userId, banner_text } = body

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 })
    }

    // Update profile banner_text
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        banner_text: banner_text || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)

    if (updateError) {
      console.error("Error updating banner:", updateError)
      return NextResponse.json({ error: "Failed to update banner" }, { status: 500 })
    }

    // Broadcast update via Realtime
    const bannerChannel = supabase.channel(`user:${userId}:banner`, {
      config: {
        broadcast: { self: true, ack: true },
        private: true,
      },
    })

    await bannerChannel.send({
      type: "broadcast",
      event: "BANNER_UPDATE",
      payload: { banner_text: banner_text || "" },
    })

    // Clean up channel
    await supabase.removeChannel(bannerChannel)

    return NextResponse.json({
      success: true,
      banner_text: banner_text || "",
    })
  } catch (error) {
    console.error("Error updating banner:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

