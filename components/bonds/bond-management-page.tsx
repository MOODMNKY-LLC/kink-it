"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BondOverview } from "@/components/bonds/bond-overview"
import { BondMembers } from "@/components/bonds/bond-members"
import { BondActivityFeed } from "@/components/bonds/bond-activity-feed"
import { BondSettings } from "@/components/bonds/bond-settings"
import { BondAnalytics } from "@/components/bonds/bond-analytics"
import type { Profile } from "@/types/profile"
import { Users, Activity, Settings, BarChart3, Home } from "lucide-react"

interface BondManagementPageProps {
  bondId: string
  profile: Profile | null
}

export function BondManagementPage({ bondId, profile }: BondManagementPageProps) {
  const [activeTab, setActiveTab] = useState("overview")

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full grid-cols-5">
        <TabsTrigger value="overview" className="flex items-center gap-2">
          <Home className="h-4 w-4" />
          <span className="hidden sm:inline">Overview</span>
        </TabsTrigger>
        <TabsTrigger value="members" className="flex items-center gap-2">
          <Users className="h-4 w-4" />
          <span className="hidden sm:inline">Members</span>
        </TabsTrigger>
        <TabsTrigger value="activity" className="flex items-center gap-2">
          <Activity className="h-4 w-4" />
          <span className="hidden sm:inline">Activity</span>
        </TabsTrigger>
        <TabsTrigger value="settings" className="flex items-center gap-2">
          <Settings className="h-4 w-4" />
          <span className="hidden sm:inline">Settings</span>
        </TabsTrigger>
        <TabsTrigger value="analytics" className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4" />
          <span className="hidden sm:inline">Analytics</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="mt-6">
        <BondOverview bondId={bondId} profile={profile} />
      </TabsContent>

      <TabsContent value="members" className="mt-6">
        <BondMembers bondId={bondId} profile={profile} />
      </TabsContent>

      <TabsContent value="activity" className="mt-6">
        <BondActivityFeed bondId={bondId} />
      </TabsContent>

      <TabsContent value="settings" className="mt-6">
        <BondSettings bondId={bondId} profile={profile} />
      </TabsContent>

      <TabsContent value="analytics" className="mt-6">
        <BondAnalytics bondId={bondId} />
      </TabsContent>
    </Tabs>
  )
}



