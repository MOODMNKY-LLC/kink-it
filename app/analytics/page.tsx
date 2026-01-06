import { requireAuth, getUserProfile } from "@/lib/auth/get-user"
import DashboardPageLayout from "@/components/dashboard/layout"
import { BarChart3 } from "lucide-react"
import { AnalyticsPageClient } from "@/components/analytics/analytics-page-client"
import { CharacterBackground } from "@/components/backgrounds/character-background"
import { GradientMesh } from "@/components/backgrounds/gradient-mesh"
import { BokehEffect } from "@/components/backgrounds/bokeh-effect"

export default async function AnalyticsPage() {
  await requireAuth()
  const profile = await getUserProfile()

  if (!profile) {
    return null
  }

  return (
    <div className="relative min-h-full">
      {/* Character-based backgrounds */}
      <CharacterBackground variant="corner" opacity={0.08} />
      <GradientMesh intensity="subtle" />
      <BokehEffect count={15} />
      
      <div className="relative z-10">
        <DashboardPageLayout
          header={{
            title: "Progress & Analytics",
            description: "Completion rates, point trends, mood trends, and relationship metrics",
            icon: BarChart3,
          }}
        >
          <AnalyticsPageClient
            userId={profile.id}
            bondId={profile.bond_id}
          />
        </DashboardPageLayout>
      </div>
    </div>
  )
}
