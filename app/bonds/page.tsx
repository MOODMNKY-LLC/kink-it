import { requireAuth, getUserProfile } from "@/lib/auth/get-user"
import { redirect } from "next/navigation"
import DashboardPageLayout from "@/components/dashboard/layout"
import { BondsList } from "@/components/bonds/bonds-list"
import { BondDiscovery } from "@/components/bonds/bond-discovery"
import BracketsIcon from "@/components/icons/brackets"
import { createClient } from "@/lib/supabase/server"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default async function BondsPage() {
  await requireAuth()
  const profile = await getUserProfile()
  const supabase = await createClient()

  // Get user's bonds
  const { data: memberships } = await supabase
    .from("bond_members")
    .select("bond_id")
    .eq("user_id", profile?.id)
    .eq("is_active", true)

  const bondIds = memberships?.map((m) => m.bond_id) || []

  // If user has a bond, redirect to it
  if (profile?.bond_id && bondIds.includes(profile.bond_id)) {
    redirect(`/bonds/${profile.bond_id}`)
  }

  // If user has any bonds, redirect to the first one
  if (bondIds.length > 0) {
    redirect(`/bonds/${bondIds[0]}`)
  }

  // User has no bonds - show discovery page
  return (
    <DashboardPageLayout
      header={{
        title: "Bonds",
        description: "Discover and join bonds, or create your own",
        icon: BracketsIcon,
      }}
    >
      <Tabs defaultValue="discover" className="w-full">
        <TabsList>
          <TabsTrigger value="discover">Discover Bonds</TabsTrigger>
          <TabsTrigger value="my-bonds">My Bonds</TabsTrigger>
        </TabsList>
        <TabsContent value="discover">
          <BondDiscovery profile={profile} />
        </TabsContent>
        <TabsContent value="my-bonds">
          <BondsList profile={profile} />
        </TabsContent>
      </Tabs>
    </DashboardPageLayout>
  )
}
