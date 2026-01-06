import { requireAuth, getUserProfile } from "@/lib/auth/get-user"
import { createClient } from "@/lib/supabase/server"
import DashboardPageLayout from "@/components/dashboard/layout"
import { RewardsPageClient } from "@/components/rewards/rewards-page-client"
import { Gift } from "lucide-react"

export default async function RewardsPage() {
  await requireAuth()
  const profile = await getUserProfile()

  if (!profile) {
    return null
  }

  const supabase = await createClient()

  // Fetch available rewards
  const { data: rewards, error: rewardsError } = await supabase
    .from("rewards")
    .select("*")
    .eq("assigned_to", profile.id)
    .eq("status", "available")
    .order("created_at", { ascending: false })

  if (rewardsError) {
    console.error("[Rewards Page] Error fetching rewards:", rewardsError)
  }

  // Get points balance and streak
  const [balanceResult, streakResult] = await Promise.all([
    supabase.rpc("get_points_balance", { p_user_id: profile.id }),
    supabase.rpc("get_current_streak", { p_user_id: profile.id }),
  ])

  const currentPoints = balanceResult.data || 0
  const currentStreak = streakResult.data || 0

  return (
    <DashboardPageLayout
      header={{
        title: "Rewards",
        description: "Redeem your earned rewards",
        icon: Gift,
      }}
    >
      <RewardsPageClient
        rewards={rewards || []}
        currentPoints={currentPoints}
        currentStreak={currentStreak}
        userId={profile.id}
      />
    </DashboardPageLayout>
  )
}
