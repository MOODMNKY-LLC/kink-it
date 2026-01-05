import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

/**
 * PATCH /api/rewards/[id]/redeem
 * Redeem a reward (submissive only)
 */
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const rewardId = params.id

  // Get the reward
  const { data: reward, error: rewardError } = await supabase
    .from("rewards")
    .select("*")
    .eq("id", rewardId)
    .single()

  if (rewardError || !reward) {
    return NextResponse.json({ error: "Reward not found" }, { status: 404 })
  }

  // Verify user is the assigned recipient
  if (reward.assigned_to !== user.id) {
    return NextResponse.json(
      { error: "You can only redeem rewards assigned to you" },
      { status: 403 }
    )
  }

  // Verify reward is available
  if (reward.status !== "available") {
    return NextResponse.json(
      { error: "Reward is not available for redemption" },
      { status: 400 }
    )
  }

  // If reward has a point_cost, check balance and deduct points
  if (reward.point_cost > 0) {
    const { data: balanceResult, error: balanceError } = await supabase.rpc(
      "get_points_balance",
      { p_user_id: user.id }
    )

    if (balanceError) {
      console.error("[Reward Redeem] Balance error:", balanceError)
      return NextResponse.json(
        { error: "Failed to check balance" },
        { status: 500 }
      )
    }

    const balance = balanceResult || 0

    if (balance < reward.point_cost) {
      return NextResponse.json(
        {
          error: "Insufficient points",
          balance,
          required: reward.point_cost,
        },
        { status: 400 }
      )
    }

    // Deduct points
    const { error: deductError } = await supabase.from("points_ledger").insert({
      workspace_id: reward.workspace_id,
      user_id: user.id,
      points: -reward.point_cost,
      reason: `Redeemed reward: ${reward.title}`,
      source_type: "redemption",
      source_id: reward.id,
    })

    if (deductError) {
      console.error("[Reward Redeem] Points deduction error:", deductError)
      return NextResponse.json(
        { error: "Failed to deduct points" },
        { status: 500 }
      )
    }
  }

  // Update reward status
  const { data: updatedReward, error: updateError } = await supabase
    .from("rewards")
    .update({
      status: "redeemed",
      redeemed_at: new Date().toISOString(),
    })
    .eq("id", rewardId)
    .select()
    .single()

  if (updateError) {
    console.error("[Reward Redeem] Update error:", updateError)
    return NextResponse.json(
      { error: "Failed to redeem reward" },
      { status: 500 }
    )
  }

  return NextResponse.json({ reward: updatedReward })
}


