"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import type { Reward } from "@/types/rewards"

interface RewardsPageClientProps {
  rewards: Reward[]
  currentPoints: number
  currentStreak: number
  userId: string
}

export function RewardsPageClient({
  rewards,
  currentPoints,
  currentStreak,
  userId,
}: RewardsPageClientProps) {
  const [redeemingId, setRedeemingId] = useState<string | null>(null)
  const [localRewards, setLocalRewards] = useState(rewards)
  const [localPoints, setLocalPoints] = useState(currentPoints)

  const handleRedeem = async (rewardId: string, pointCost: number) => {
    if (localPoints < pointCost) {
      toast.error("Insufficient points", {
        description: `You need ${pointCost} points but only have ${localPoints}`,
      })
      return
    }

    setRedeemingId(rewardId)

    try {
      const response = await fetch(`/api/rewards/${rewardId}/redeem`, {
        method: "PATCH",
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to redeem reward")
      }

      const { reward } = await response.json()

      // Update local state
      setLocalRewards(localRewards.filter((r) => r.id !== rewardId))
      setLocalPoints(localPoints - pointCost)

      toast.success("Reward redeemed!", {
        description: `You've successfully redeemed: ${reward.title}`,
      })
    } catch (error) {
      console.error("[Rewards] Redeem error:", error)
      toast.error("Failed to redeem reward", {
        description: error instanceof Error ? error.message : "Please try again",
      })
    } finally {
      setRedeemingId(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Points Balance Card */}
      <Card>
        <CardHeader>
          <CardTitle>Your Points Balance</CardTitle>
          <CardDescription>Earn points by completing tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline gap-4">
            <div className="text-4xl font-display">{localPoints}</div>
            <div className="text-sm text-muted-foreground">POINTS</div>
          </div>
          {currentStreak > 0 && (
            <div className="mt-4">
              <Badge variant="default" className="text-sm">
                {currentStreak} DAY STREAK 🔥
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Available Rewards */}
      <div>
        <h2 className="text-2xl font-display mb-4">Available Rewards</h2>
        {localRewards.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No rewards available yet. Complete tasks to earn rewards!
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {localRewards.map((reward) => (
              <Card key={reward.id} className="flex flex-col">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg">{reward.title}</CardTitle>
                    <Badge variant="secondary">{reward.reward_type}</Badge>
                  </div>
                  {reward.love_language && (
                    <Badge variant="outline" className="mt-2 w-fit">
                      {reward.love_language}
                    </Badge>
                  )}
                </CardHeader>
                <CardContent className="flex-1 flex flex-col">
                  {reward.description && (
                    <CardDescription className="mb-4 flex-1">
                      {reward.description}
                    </CardDescription>
                  )}
                  <div className="mt-auto space-y-2">
                    {reward.point_cost > 0 && (
                      <div className="text-sm text-muted-foreground">
                        Cost: <span className="font-semibold">{reward.point_cost} points</span>
                      </div>
                    )}
                    {reward.point_value > 0 && (
                      <div className="text-sm text-success">
                        Earns: <span className="font-semibold">{reward.point_value} points</span>
                      </div>
                    )}
                    <Button
                      onClick={() => handleRedeem(reward.id, reward.point_cost)}
                      disabled={
                        redeemingId === reward.id ||
                        (reward.point_cost > 0 && localPoints < reward.point_cost)
                      }
                      className="w-full"
                      variant={reward.point_cost > 0 && localPoints < reward.point_cost ? "secondary" : "default"}
                    >
                      {redeemingId === reward.id
                        ? "Redeeming..."
                        : reward.point_cost > 0
                        ? `Redeem (${reward.point_cost} pts)`
                        : "Claim Reward"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
