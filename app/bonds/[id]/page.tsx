import { requireAuth, getUserProfile } from "@/lib/auth/get-user"
import { redirect, notFound } from "next/navigation"
import DashboardPageLayout from "@/components/dashboard/layout"
import { BondManagementPage } from "@/components/bonds/bond-management-page"
import BracketsIcon from "@/components/icons/brackets"
import { createClient } from "@/lib/supabase/server"

interface BondPageProps {
  params: Promise<{ id: string }>
}

export default async function BondPage({ params }: BondPageProps) {
  await requireAuth()
  const profile = await getUserProfile()
  const { id } = await params
  const supabase = await createClient()

  // Verify user is a member of this bond
  const { data: bond, error: bondError } = await supabase
    .from("bonds")
    .select("*")
    .eq("id", id)
    .single()

  if (bondError || !bond) {
    notFound()
  }

  // Check if user is a member (or admin)
  if (profile?.system_role !== "admin") {
    const { data: membership } = await supabase
      .from("bond_members")
      .select("id")
      .eq("bond_id", id)
      .eq("user_id", profile?.id)
      .eq("is_active", true)
      .single()

    if (!membership) {
      redirect("/")
    }
  }

  return (
    <DashboardPageLayout
      header={{
        title: bond.name,
        description: bond.description || "Bond Management",
        icon: BracketsIcon,
      }}
    >
      <BondManagementPage bondId={id} profile={profile} />
    </DashboardPageLayout>
  )
}



