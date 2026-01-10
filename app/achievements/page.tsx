import { requireAuth, getUserProfile } from "@/lib/auth/get-user"
import { AchievementsPageClient } from "@/components/achievements/achievements-page-client"
import { getAchievementsProgress } from "@/lib/achievements/get-achievements-progress"
import DashboardPageLayout from "@/components/dashboard/layout"
import { Trophy } from "lucide-react"

export default async function AchievementsPage() {
  await requireAuth()
  const profile = await getUserProfile()

  if (!profile) {
    return (
      <DashboardPageLayout
        header={{
          title: "Achievements",
          description: "Track your progress and celebrate your dedication",
          icon: Trophy,
        }}
      >
        <div className="text-center py-12">
          <p className="text-muted-foreground">Profile not found</p>
        </div>
      </DashboardPageLayout>
    )
  }

  // Fetch achievements progress directly in Server Component
  const progress = await getAchievementsProgress(profile.id, null)

  return (
    <DashboardPageLayout
      header={{
        title: "Achievements",
        description:
          profile.dynamic_role === "submissive"
            ? "Track your progress and celebrate your dedication"
            : "View achievements and celebrate progress",
        icon: Trophy,
      }}
    >
      <AchievementsPageClient profile={profile} initialProgress={progress} />
    </DashboardPageLayout>
  )
}
