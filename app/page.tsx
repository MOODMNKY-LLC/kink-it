import { requireAuth, getUserProfile } from "@/lib/auth/get-user"
import { createClient } from "@/lib/supabase/server"
import DashboardPageLayout from "@/components/dashboard/layout"
import DashboardStat from "@/components/dashboard/stat"
import EnhancedStatCard from "@/components/dashboard/enhanced-stat-card"
import DashboardChart from "@/components/dashboard/chart"
import RebelsRanking from "@/components/dashboard/rebels-ranking"
import SecurityStatus from "@/components/dashboard/security-status"
import { SubmissionStateSection } from "@/components/submission/submission-state-section"
import RoleBasedWelcome from "@/components/dashboard/role-based-welcome"
import QuickActions from "@/components/dashboard/quick-actions"
import { RoleDashboardDominant } from "@/components/dashboard/role-dashboard-dominant"
import { RoleDashboardSubmissive } from "@/components/dashboard/role-dashboard-submissive"
import { RoleDashboardSwitch } from "@/components/dashboard/role-dashboard-switch"
import BracketsIcon from "@/components/icons/brackets"
import GearIcon from "@/components/icons/gear"
import ProcessorIcon from "@/components/icons/proccesor"
import BoomIcon from "@/components/icons/boom"
import { getDashboardStats } from "@/lib/analytics/get-dashboard-stats"
import { getTaskCompletionTrends } from "@/lib/analytics/get-task-completion-trends"
import { getPartnerRanking } from "@/lib/analytics/get-partner-ranking"
import type { DashboardStat } from "@/types/dashboard"

// Icon mapping
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  gear: GearIcon,
  proccesor: ProcessorIcon,
  boom: BoomIcon,
}

export default async function DashboardOverview() {
  await requireAuth()
  const profile = await getUserProfile()
  const supabase = await createClient()

  // Redirect admins to admin dashboard
  if (profile && profile.system_role === "admin") {
    const { redirect } = await import("next/navigation")
    redirect("/admin/dashboard")
  }

  // Get partner's submission state if user is dominant
  let partnerState = null
  let partnerUpdatedAt = null
  let partnerName = null

  if (profile && profile.dynamic_role === "dominant" && profile.partner_id) {
    const { data: partnerProfile } = await supabase
      .from("profiles")
      .select("submission_state, updated_at, display_name, full_name")
      .eq("id", profile.partner_id)
      .single()

    if (partnerProfile) {
      partnerState = partnerProfile.submission_state
      partnerUpdatedAt = partnerProfile.updated_at
      partnerName = partnerProfile.display_name || partnerProfile.full_name || null
    }
  }

  return (
    <DashboardPageLayout
      header={{
        title: "Overview",
        description: "Last updated 12:05",
        icon: BracketsIcon,
      }}
    >
      {profile && (
        <>
          {/* Role-based Dashboard Content */}
          {profile.dynamic_role === "dominant" && (
            <div className="mb-6">
              <RoleDashboardDominant
                userName={profile.display_name || profile.full_name || profile.email.split("@")[0]}
                partnerName={partnerName}
              />
            </div>
          )}
          {profile.dynamic_role === "submissive" && (
            <div className="mb-6">
              <RoleDashboardSubmissive
                userName={profile.display_name || profile.full_name || profile.email.split("@")[0]}
              />
            </div>
          )}
          {profile.dynamic_role === "switch" && (
            <div className="mb-6">
              <RoleDashboardSwitch
                userName={profile.display_name || profile.full_name || profile.email.split("@")[0]}
                partnerName={partnerName}
              />
            </div>
          )}

          {/* Role-based Welcome Message */}
          <div className="mb-6">
            <RoleBasedWelcome
              userName={profile.display_name || profile.full_name || profile.email.split("@")[0]}
              userRole={profile.dynamic_role}
              partnerName={partnerName}
            />
          </div>

          {/* Submission State Section */}
          <div className="mb-6">
            <SubmissionStateSection
              userId={profile.id}
              userRole={profile.dynamic_role}
              partnerId={profile.partner_id}
              partnerState={partnerState}
              partnerUpdatedAt={partnerUpdatedAt}
              partnerName={partnerName}
            />
          </div>

          {/* Quick Actions */}
          <div className="mb-6">
            <QuickActions
              userRole={profile.dynamic_role}
              partnerName={partnerName}
            />
          </div>
        </>
      )}

      {/* Dashboard Stats - Enhanced with MagicCard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        {(
          await getDashboardStats({
            userId: profile.id,
            userRole: profile.dynamic_role,
            partnerId: profile.partner_id,
          })
        ).map((stat, index) => {
          // Use enhanced stat card for visual appeal
          // Pass icon as string identifier instead of component
          return (
            <EnhancedStatCard
              key={index}
              label={stat.label}
              value={stat.value}
              description={stat.description}
              icon={stat.icon} // Pass string identifier
              tag={stat.tag}
              intent={stat.intent}
              direction={stat.direction}
              gradientFrom={index === 0 ? "#9E7AFF" : index === 1 ? "#FE8BBB" : "#4FACFE"}
              gradientTo={index === 0 ? "#FE8BBB" : index === 1 ? "#4FACFE" : "#9E7AFF"}
            />
          )
        })}
      </div>

      {/* Dashboard Chart - Now using real task completion data */}
      <div className="mb-6">
        <DashboardChart
          chartData={await getTaskCompletionTrends({
            userId: profile.id,
            userRole: profile.dynamic_role,
            partnerId: profile.partner_id,
          })}
        />
      </div>

      {/* Main 2-column grid section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Rebels Ranking - Now using real partner data */}
        <RebelsRanking
          rebels={
            await getPartnerRanking(profile.id, profile.partner_id)
          }
        />
        {/* Security Status - Coming Soon (Modules 5, 6, 7) */}
        <SecurityStatus
          statuses={[
            {
              title: "ACTIVE CONTRACT",
              value: "Coming Soon",
              status: "[MODULE 6]",
              variant: "warning",
            },
            {
              title: "BOUNDARIES SET",
              value: "Coming Soon",
              status: "[MODULE 5]",
              variant: "warning",
            },
            {
              title: "CHECK-INS",
              value: "Coming Soon",
              status: "[MODULE 7]",
              variant: "warning",
            },
          ]}
        />
      </div>
    </DashboardPageLayout>
  )
}
