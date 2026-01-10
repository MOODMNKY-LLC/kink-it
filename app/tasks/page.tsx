import { requireAuth, getUserProfile } from "@/lib/auth/get-user"
import { createClient } from "@/lib/supabase/server"
import DashboardPageLayout from "@/components/dashboard/layout"
import ProcessorIcon from "@/components/icons/proccesor"
import { TasksPageClient } from "@/components/tasks/tasks-page-client"

export default async function TasksPage() {
  await requireAuth()
  const profile = await getUserProfile()

  if (!profile) {
    return (
      <DashboardPageLayout
        header={{
          title: "Tasks",
          description: "Your assigned tasks and protocols",
          icon: ProcessorIcon,
        }}
      >
        <div className="text-center py-12">
          <p className="text-muted-foreground">Profile not found</p>
        </div>
      </DashboardPageLayout>
    )
  }

  // Get current bond_id from profile
  const supabase = await createClient()
  const { data: profileWithBond } = await supabase
    .from("profiles")
    .select("bond_id")
    .eq("id", profile.id)
    .single()

  return (
    <DashboardPageLayout
      header={{
        title: "Tasks",
        description: "Your assigned tasks and protocols",
        icon: ProcessorIcon,
      }}
    >
      <TasksPageClient
        userId={profile.id}
        userRole={profile.dynamic_role}
        partnerId={profile.partner_id}
        bondId={profileWithBond?.bond_id || null}
      />
    </DashboardPageLayout>
  )
}
