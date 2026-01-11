import { requireAuth, getUserProfile } from "@/lib/auth/get-user"
import DashboardPageLayout from "@/components/dashboard/layout"
import { MessageSquare } from "lucide-react"
import { CommunicationPageClient } from "@/components/communication/communication-page-client"

export default async function CommunicationPage() {
  await requireAuth()
  const profile = await getUserProfile()

  if (!profile) {
    return null
  }

  return (
    <DashboardPageLayout
      header={{
        title: "Communication Hub",
        description: "Private messaging, daily check-ins, and scene debriefs",
        icon: MessageSquare,
      }}
    >
      <CommunicationPageClient
        userId={profile.id}
        partnerId={profile.partner_id}
        userRole={profile.dynamic_role}
      />
    </DashboardPageLayout>
  )
}
