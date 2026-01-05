import { createClient } from "@/lib/supabase/server"
import type { RebelRanking } from "@/types/dashboard"
import type { Profile } from "@/types/profile"

/**
 * Get partner ranking data for Rebels Ranking component
 * Shows partner profiles with points and streaks
 */
export async function getPartnerRanking(
  userId: string,
  partnerId: string | null
): Promise<RebelRanking[]> {
  const supabase = await createClient()

  if (!partnerId) {
    // No partner linked, return empty array
    return []
  }

  // Fetch both user and partner profiles
  const [userProfileResult, partnerProfileResult] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", userId).single(),
    supabase.from("profiles").select("*").eq("id", partnerId).single(),
  ])

  if (userProfileResult.error || partnerProfileResult.error) {
    console.error("[Partner Ranking] Error fetching profiles:", {
      userError: userProfileResult.error,
      partnerError: partnerProfileResult.error,
    })
    return []
  }

  const userProfile = userProfileResult.data as Profile
  const partnerProfile = partnerProfileResult.data as Profile

  // Calculate points and streaks for both users using database functions
  const [userBalanceResult, userStreakResult, partnerBalanceResult, partnerStreakResult] =
    await Promise.all([
      supabase.rpc("get_points_balance", { p_user_id: userId }),
      supabase.rpc("get_current_streak", { p_user_id: userId }),
      supabase.rpc("get_points_balance", { p_user_id: partnerId }),
      supabase.rpc("get_current_streak", { p_user_id: partnerId }),
    ])

  const userPoints = userBalanceResult.data || 0
  const userStreak = userStreakResult.data || 0
  const partnerPoints = partnerBalanceResult.data || 0
  const partnerStreak = partnerStreakResult.data || 0

  // Determine which user is submissive (they get featured)
  const rankings: RebelRanking[] = []

  if (userProfile.dynamic_role === "submissive") {
    rankings.push({
      id: 1,
      name: userProfile.full_name || userProfile.display_name || userProfile.email.split("@")[0].toUpperCase(),
      handle: `@${userProfile.display_name || userProfile.email.split("@")[0]}`,
      streak: userStreak > 0 ? `${userStreak} DAY STREAK 🔥` : "",
      points: userPoints,
      avatar: userProfile.avatar_url || "/placeholder-user.jpg",
      featured: true,
      subtitle: "Submissive • Exceptional Service",
    })
  }

  if (partnerProfile.dynamic_role === "submissive") {
    rankings.push({
      id: partnerProfile.dynamic_role === "submissive" ? 1 : 2,
      name: partnerProfile.full_name || partnerProfile.display_name || partnerProfile.email.split("@")[0].toUpperCase(),
      handle: `@${partnerProfile.display_name || partnerProfile.email.split("@")[0]}`,
      streak: partnerStreak > 0 ? `${partnerStreak} DAY STREAK 🔥` : "",
      points: partnerPoints,
      avatar: partnerProfile.avatar_url || "/placeholder-user.jpg",
      featured: true,
      subtitle: "Submissive • Exceptional Service",
    })
  }

  // Add dominant partner (not featured)
  if (userProfile.dynamic_role === "dominant") {
    rankings.push({
      id: rankings.length + 1,
      name: userProfile.full_name || userProfile.display_name || userProfile.email.split("@")[0].toUpperCase(),
      handle: `@${userProfile.display_name || userProfile.email.split("@")[0]}`,
      streak: "",
      points: userPoints,
      avatar: userProfile.avatar_url || "/placeholder-user.jpg",
      featured: false,
      subtitle: "Dominant • Guiding Partner",
    })
  }

  if (partnerProfile.dynamic_role === "dominant") {
    rankings.push({
      id: rankings.length + 1,
      name: partnerProfile.full_name || partnerProfile.display_name || partnerProfile.email.split("@")[0].toUpperCase(),
      handle: `@${partnerProfile.display_name || partnerProfile.email.split("@")[0]}`,
      streak: "",
      points: partnerPoints,
      avatar: partnerProfile.avatar_url || "/placeholder-user.jpg",
      featured: false,
      subtitle: "Dominant • Guiding Partner",
    })
  }

  return rankings
}


