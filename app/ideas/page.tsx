import { requireAuth, getUserProfile } from "@/lib/auth/get-user"
import { AppIdeaForm } from "@/components/app-ideas/app-idea-form"
import { AppIdeasList } from "@/components/app-ideas/app-ideas-list"
import { NotionSetupBanner } from "@/components/app-ideas/notion-setup-banner"
import DashboardPageLayout from "@/components/dashboard/layout"
import { Lightbulb } from "lucide-react"

export default async function IdeasPage() {
  await requireAuth()
  const profile = await getUserProfile()

  return (
    <DashboardPageLayout
      header={{
        title: "App Ideas",
        description: "Capture and track ideas",
        icon: Lightbulb,
      }}
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground">Capture and track ideas for improving KINK IT</p>
          <AppIdeaForm userId={profile?.id || ""} />
        </div>

        <NotionSetupBanner />

        <AppIdeasList />
      </div>
    </DashboardPageLayout>
  )
}
