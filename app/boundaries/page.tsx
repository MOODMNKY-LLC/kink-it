import { requireAuth, getUserProfile } from "@/lib/auth/get-user"
import DashboardPageLayout from "@/components/dashboard/layout"
import { Heart } from "lucide-react"
import { BoundariesPageClient } from "@/components/boundaries/boundaries-page-client"
import { CharacterBackground } from "@/components/backgrounds/character-background"
import { GradientMesh } from "@/components/backgrounds/gradient-mesh"
import { BokehEffect } from "@/components/backgrounds/bokeh-effect"

export default async function BoundariesPage() {
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
            title: "Kink Exploration & Boundaries",
            description: "Explore activities, set boundaries, and discover compatibility",
            icon: Heart,
          }}
        >
          <BoundariesPageClient
            userId={profile.id}
            bondId={profile.bond_id}
          />
        </DashboardPageLayout>
      </div>
    </div>
  )
}
