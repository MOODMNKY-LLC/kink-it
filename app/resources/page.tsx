import { requireAuth, getUserProfile } from "@/lib/auth/get-user"
import DashboardPageLayout from "@/components/dashboard/layout"
import { Library } from "lucide-react"
import { ResourcesPageClient } from "@/components/resources/resources-page-client"
import { CharacterBackground } from "@/components/backgrounds/character-background"
import { GradientMesh } from "@/components/backgrounds/gradient-mesh"
import { BokehEffect } from "@/components/backgrounds/bokeh-effect"

export default async function ResourcesPage() {
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
            title: "Resource Library",
            description: "Educational content, bookmarked resources, and curated guides",
            icon: Library,
          }}
        >
          <ResourcesPageClient
            userId={profile.id}
            userRole={profile.dynamic_role}
            bondId={profile.bond_id}
          />
        </DashboardPageLayout>
      </div>
    </div>
  )
}
