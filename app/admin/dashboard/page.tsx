import { requireAuth, getUserProfile } from "@/lib/auth/get-user"
import { redirect } from "next/navigation"
import DashboardPageLayout from "@/components/dashboard/layout"
import { getAdminStats } from "@/lib/analytics/get-admin-stats"
import { AdminDashboardStats } from "@/components/admin/admin-dashboard-stats"
import { AdminUserManagement } from "@/components/admin/admin-user-management"
import { AdminSystemHealth } from "@/components/admin/admin-system-health"
import { AdminRecentActivity } from "@/components/admin/admin-recent-activity"
import BracketsIcon from "@/components/icons/brackets"
import { BentoGrid, BentoCard } from "@/components/ui/bento-grid"
import { Users, Activity, Shield, TrendingUp } from "lucide-react"

export default async function AdminDashboardPage() {
  await requireAuth()
  const profile = await getUserProfile()

  // Redirect non-admin users
  if (!profile || profile.system_role !== "admin") {
    redirect("/")
  }

  const stats = await getAdminStats()

  return (
    <DashboardPageLayout
      header={{
        title: "Admin Dashboard",
        description: "System Overview",
        icon: BracketsIcon,
      }}
    >
      {/* Admin Stats Grid */}
      <div className="mb-6">
        <AdminDashboardStats stats={stats} />
      </div>

      {/* Bento Grid Layout */}
      <BentoGrid className="mb-6">
        <BentoCard
          name="User Management"
          description="Manage users, roles, and permissions"
          href="/admin/users"
          cta="Manage Users"
          Icon={Users}
          className="col-span-3 lg:col-span-2"
          background={
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-pink-500/20" />
          }
        />
        <BentoCard
          name="System Health"
          description="Monitor system performance and status"
          href="/admin/health"
          cta="View Health"
          Icon={Shield}
          className="col-span-3 lg:col-span-1"
          background={
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-cyan-500/20" />
          }
        />
        <BentoCard
          name="Analytics"
          description="View system-wide analytics and trends"
          href="/admin/analytics"
          cta="View Analytics"
          Icon={TrendingUp}
          className="col-span-3 lg:col-span-1"
          background={
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/20 to-emerald-500/20" />
          }
        />
        <BentoCard
          name="Recent Activity"
          description="Monitor recent system activity"
          href="/admin/activity"
          cta="View Activity"
          Icon={Activity}
          className="col-span-3 lg:col-span-2"
          background={
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/20 to-red-500/20" />
          }
        />
      </BentoGrid>

      {/* User Management Table */}
      <div className="mb-6">
        <AdminUserManagement />
      </div>

      {/* System Health & Recent Activity Side by Side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AdminSystemHealth stats={stats} />
        <AdminRecentActivity activities={stats.recentActivity} />
      </div>
    </DashboardPageLayout>
  )
}
