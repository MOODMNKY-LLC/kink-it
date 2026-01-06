import { requireAuth, getUserProfile } from "@/lib/auth/get-user"
import { redirect } from "next/navigation"
import DashboardPageLayout from "@/components/dashboard/layout"
import { AdminBondManagement } from "@/components/admin/admin-bond-management"
import BracketsIcon from "@/components/icons/brackets"

export default async function AdminBondsPage() {
  await requireAuth()
  const profile = await getUserProfile()

  // Redirect non-admin users
  if (!profile || profile.system_role !== "admin") {
    redirect("/")
  }

  return (
    <DashboardPageLayout
      header={{
        title: "Bond Management",
        description: "Manage all bonds in the system",
        icon: BracketsIcon,
      }}
    >
      <AdminBondManagement />
    </DashboardPageLayout>
  )
}



