import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

/**
 * PATCH /api/messages/[id]/read
 * Mark a message as read
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params

  // Verify user is the recipient
  const { data: message } = await supabase
    .from("partner_messages")
    .select("to_user_id")
    .eq("id", id)
    .single()

  if (!message || message.to_user_id !== user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
  }

  // Mark as read
  const { data: updatedMessage, error } = await supabase
    .from("partner_messages")
    .update({ read_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ message: updatedMessage })
}
