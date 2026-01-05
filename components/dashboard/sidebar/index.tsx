"use client"

import type * as React from "react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import AtomIcon from "@/components/icons/atom"
import BracketsIcon from "@/components/icons/brackets"
import ProcessorIcon from "@/components/icons/proccesor"
import CuteRobotIcon from "@/components/icons/cute-robot"
import EmailIcon from "@/components/icons/email"
import GearIcon from "@/components/icons/gear"
import MonkeyIcon from "@/components/icons/monkey"
import DotsVerticalIcon from "@/components/icons/dots-vertical"
import { Bullet } from "@/components/ui/bullet"
import LockIcon from "@/components/icons/lock"
import Image from "next/image"
import { useIsV0 } from "@/lib/v0-context"
import LayoutIcon from "@/components/icons/layout"
import LightbulbIcon from "@/components/icons/lightbulb"
import { Shield } from "lucide-react"
import type { Profile } from "@/types/profile"

const data = {
  navMain: [
    {
      title: "Dashboard",
      items: [
        {
          title: "Overview",
          url: "/",
          icon: BracketsIcon,
          isActive: true,
        },
        {
          title: "Tasks",
          url: "/tasks",
          icon: ProcessorIcon,
          isActive: false,
        },
        {
          title: "Rewards",
          url: "/rewards",
          icon: AtomIcon,
          isActive: false,
        },
        {
          title: "Communication",
          url: "/communication",
          icon: EmailIcon,
          isActive: false,
        },
      ],
    },
    {
      title: "Resources",
      items: [
        {
          title: "Guides",
          url: "/guides",
          icon: LayoutIcon,
          isActive: false,
        },
        {
          title: "Boundaries",
          url: "/boundaries",
          icon: CuteRobotIcon,
          isActive: false,
        },
        {
          title: "Ideas",
          url: "/ideas",
          icon: LightbulbIcon,
          isActive: false,
        },
        {
          title: "Settings",
          url: "/settings",
          icon: GearIcon,
          isActive: false,
          locked: true,
        },
      ],
    },
  ],
}

interface DashboardSidebarProps extends React.ComponentProps<typeof Sidebar> {
  profile?: Profile | null
}

export function DashboardSidebar({ profile, className, ...props }: DashboardSidebarProps) {
  const isV0 = useIsV0()

  const dynamicRoleDisplay = profile
    ? {
        dominant: "Dominant",
        submissive: "Submissive",
        switch: "Switch",
      }[profile.dynamic_role]
    : "User"

  return (
    <Sidebar {...props} className={cn("py-sides", className)}>
      <SidebarHeader className="rounded-t-lg flex gap-3 flex-row rounded-b-none">
        <div className="flex overflow-clip size-12 shrink-0 items-center justify-center rounded bg-sidebar-primary-foreground/10 transition-colors group-hover:bg-sidebar-primary text-sidebar-primary-foreground">
          <MonkeyIcon className="size-10 group-hover:scale-[1.7] origin-top-left transition-transform" />
        </div>
        <div className="grid flex-1 text-left text-sm leading-tight">
          <span className="text-2xl font-display">KINK IT</span>
          <span className="text-xs uppercase">D/s Relationship Manager</span>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {data.navMain.map((group, i) => (
          <SidebarGroup className={cn(i === 0 && "rounded-t-none")} key={group.title}>
            <SidebarGroupLabel>
              <Bullet className="mr-2" />
              {group.title}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem
                    key={item.title}
                    className={cn(item.locked && "pointer-events-none opacity-50", isV0 && "pointer-events-none")}
                    data-disabled={item.locked}
                  >
                    <SidebarMenuButton
                      asChild={!item.locked}
                      isActive={item.isActive}
                      disabled={item.locked}
                      className={cn("disabled:cursor-not-allowed", item.locked && "pointer-events-none")}
                    >
                      {item.locked ? (
                        <div className="flex items-center gap-3 w-full">
                          <item.icon className="size-5" />
                          <span>{item.title}</span>
                        </div>
                      ) : (
                        <a href={item.url}>
                          <item.icon className="size-5" />
                          <span>{item.title}</span>
                        </a>
                      )}
                    </SidebarMenuButton>
                    {item.locked && (
                      <SidebarMenuBadge>
                        <LockIcon className="size-5 block" />
                      </SidebarMenuBadge>
                    )}
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="p-0">
        <SidebarGroup>
          <SidebarGroupLabel>
            <Bullet className="mr-2" />
            User
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <Popover>
                  <PopoverTrigger className="flex gap-0.5 w-full group cursor-pointer">
                    <div className="shrink-0 flex size-14 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground overflow-clip">
                      <Image
                        src={profile?.avatar_url || "/avatars/simeon_bowman.jpg"}
                        alt={profile?.full_name || "User"}
                        width={120}
                        height={120}
                      />
                    </div>
                    <div className="group/item pl-3 pr-1.5 pt-2 pb-1.5 flex-1 flex bg-sidebar-accent hover:bg-sidebar-accent-active/75 items-center rounded group-data-[state=open]:bg-sidebar-accent-active group-data-[state=open]:hover:bg-sidebar-accent-active group-data-[state=open]:text-sidebar-accent-foreground">
                      <div className="grid flex-1 text-left text-sm leading-tight">
                        <div className="flex items-center gap-2">
                          <span className="truncate text-xl font-display">
                            {profile?.full_name || profile?.display_name || "User"}
                          </span>
                          {profile?.system_role === "admin" && (
                            <Badge
                              variant="secondary"
                              className="bg-purple-600/20 text-purple-400 border-purple-600/30 text-xs h-5"
                            >
                              <Shield className="h-3 w-3" />
                            </Badge>
                          )}
                        </div>
                        <span className="truncate text-xs uppercase opacity-50 group-hover/item:opacity-100">
                          {dynamicRoleDisplay}
                        </span>
                      </div>
                      <DotsVerticalIcon className="ml-auto size-4" />
                    </div>
                  </PopoverTrigger>
                  <PopoverContent className="w-56 p-0" side="bottom" align="end" sideOffset={4}>
                    <div className="flex flex-col">
                      <button className="flex items-center px-4 py-2 text-sm hover:bg-accent">
                        <MonkeyIcon className="mr-2 h-4 w-4" />
                        Account
                      </button>
                      <button className="flex items-center px-4 py-2 text-sm hover:bg-accent">
                        <GearIcon className="mr-2 h-4 w-4" />
                        Settings
                      </button>
                    </div>
                  </PopoverContent>
                </Popover>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
