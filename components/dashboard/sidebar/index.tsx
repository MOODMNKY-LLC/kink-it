"use client"

import type * as React from "react"
import { usePathname, useRouter } from "next/navigation"

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
import DotsVerticalIcon from "@/components/icons/dots-vertical"
import { Bullet } from "@/components/ui/bullet"
import LockIcon from "@/components/icons/lock"
import { useIsV0 } from "@/lib/v0-context"
import LayoutIcon from "@/components/icons/layout"
import LightbulbIcon from "@/components/icons/lightbulb"
import {
  Shield,
  FileText,
  Heart,
  Scale,
  MessageSquare,
  BookOpen,
  Calendar,
  BarChart3,
  Library,
  Users,
  Settings,
  User,
  LogOut,
  Link as LinkIcon,
  Crown,
} from "lucide-react"
import type { Profile } from "@/types/profile"
import { createClient } from "@/lib/supabase/client"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useState, useEffect } from "react"
import { getNavigationConfig } from "./navigation-config"
import { ContextSwitcher } from "./context-switcher"
import { ChevronDown, ChevronRight } from "lucide-react"
import { NotionSyncStatusBadge } from "@/components/playground/shared/notion-sync-status-badge"
import { SidebarNotifications } from "./sidebar-notifications"

interface DashboardSidebarProps extends React.ComponentProps<typeof Sidebar> {
  profile?: Profile | null
}

export function DashboardSidebar({ profile, className, ...props }: DashboardSidebarProps) {
  const isV0 = useIsV0()
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [bondInfo, setBondInfo] = useState<{ name: string; status: string } | null>(null)
  const [collapsedAdminGroups, setCollapsedAdminGroups] = useState<Set<string>>(new Set())
  
  // Get navigation config based on user role
  const isAdmin = profile?.system_role === "admin"
  const navigationConfig = getNavigationConfig(isAdmin)

  // Fetch bond info if user is in a bond
  useEffect(() => {
    if (profile?.bond_id) {
      supabase
        .from("bonds")
        .select("name, bond_status")
        .eq("id", profile.bond_id)
        .single()
        .then(({ data }) => {
          if (data) {
            setBondInfo({ name: data.name, status: data.bond_status })
          }
        })
    }
  }, [profile?.bond_id, supabase])

  const dynamicRoleDisplay = profile
    ? {
        dominant: "Dominant",
        submissive: "Submissive",
        switch: "Switch",
      }[profile.dynamic_role]
    : "User"

  const getDynamicRoleIcon = () => {
    if (!profile) return null
    switch (profile.dynamic_role) {
      case "dominant":
        return Crown
      case "submissive":
        return Heart
      case "switch":
        return Scale
      default:
        return null
    }
  }

  const getInitials = (name: string | null | undefined, email: string) => {
    if (name) {
      const parts = name.trim().split(" ")
      if (parts.length >= 2) {
        return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
      }
      return name.substring(0, 2).toUpperCase()
    }
    return email.substring(0, 2).toUpperCase()
  }

  const DynamicRoleIcon = getDynamicRoleIcon()

  // Determine active state based on current pathname
  const isActive = (url: string) => {
    if (url === "/") {
      return pathname === "/"
    }
    return pathname?.startsWith(url) ?? false
  }

  const handleAccountClick = () => {
    router.push("/account/profile")
  }

  const handleSettingsClick = () => {
    router.push("/account/settings")
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/auth/login")
    router.refresh()
  }

  return (
    <Sidebar {...props} className={cn("py-sides", className)}>
      <SidebarHeader className="rounded-t-lg flex flex-col gap-2 rounded-b-none">
        <div className="flex gap-3 flex-row">
          <div className="flex overflow-clip size-12 shrink-0 items-center justify-center rounded bg-sidebar-primary-foreground/10 transition-colors group-hover:bg-sidebar-primary text-sidebar-primary-foreground">
            <img 
              src="/images/kinky/kinky-avatar.svg" 
              alt="KINK IT" 
              className="size-10 object-contain group-hover:scale-[1.1] origin-center transition-transform"
            />
          </div>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="text-2xl font-display">KINK IT</span>
            <span className="text-xs uppercase">D/s Relationship Manager</span>
          </div>
        </div>
        {/* Context Switcher */}
        {profile && <ContextSwitcher profile={profile} />}
      </SidebarHeader>

      <SidebarContent className="overflow-y-auto scrollbar-hide">
        {navigationConfig.map((group, i) => {
          const isAdminGroup = group.title === "Administration"
          const isCollapsed = collapsedAdminGroups.has(group.title)
          
          return (
            <SidebarGroup 
              className={cn(
                i === 0 && "rounded-t-none",
                isAdminGroup && "border-t border-sidebar-border mt-2 pt-2"
              )} 
              key={group.title}
            >
              <SidebarGroupLabel>
                <Bullet className="mr-2" />
                {group.title}
                {isAdminGroup && (
                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      setCollapsedAdminGroups((prev) => {
                        const next = new Set(prev)
                        if (next.has(group.title)) {
                          next.delete(group.title)
                        } else {
                          next.add(group.title)
                        }
                        return next
                      })
                    }}
                    className="ml-auto flex items-center"
                  >
                    {isCollapsed ? (
                      <ChevronRight className="size-4" />
                    ) : (
                      <ChevronDown className="size-4" />
                    )}
                  </button>
                )}
              </SidebarGroupLabel>
              {!isCollapsed && (
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
                          isActive={isActive(item.url)}
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
              )}
            </SidebarGroup>
          )
        })}
      </SidebarContent>

      <SidebarFooter className="p-0 flex flex-col gap-2">
        {/* Notion Sync Status */}
        {profile && (
          <SidebarGroup>
            <SidebarGroupContent>
              <div className="px-3 py-2">
                <NotionSyncStatusBadge showButton={true} showBadge={true} />
              </div>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Notifications */}
        {profile && (
          <SidebarGroup className="flex-1 min-h-0">
            <SidebarGroupContent className="flex-1 min-h-0">
              <div className="px-3 pb-2 flex-1 min-h-0">
                <SidebarNotifications />
              </div>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* User Profile */}
        <SidebarGroup>
          <SidebarGroupLabel>
            <Bullet className="mr-2" />
            User
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <Popover>
                  <PopoverTrigger className="flex gap-2 w-full group cursor-pointer">
                    <Avatar className="size-12 shrink-0 border-2 border-sidebar-border group-hover:border-sidebar-primary transition-colors">
                      <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.display_name || profile?.full_name || "User"} />
                      <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground text-sm font-semibold">
                        {profile ? getInitials(profile.display_name || profile.full_name, profile.email) : "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="group/item pl-2 pr-1.5 py-2 flex-1 flex bg-sidebar-accent hover:bg-sidebar-accent-active/75 items-center rounded group-data-[state=open]:bg-sidebar-accent-active group-data-[state=open]:hover:bg-sidebar-accent-active group-data-[state=open]:text-sidebar-accent-foreground min-w-0">
                      <div className="flex-1 min-w-0 text-left">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="truncate text-base font-semibold text-sidebar-foreground">
                            {profile?.display_name || profile?.full_name || "User"}
                          </span>
                          {profile?.system_role === "admin" && (
                            <Badge
                              variant="secondary"
                              className="bg-purple-600/20 text-purple-400 border-purple-600/30 text-[10px] h-4 px-1 shrink-0"
                            >
                              <Shield className="h-2.5 w-2.5" />
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5">
                          {DynamicRoleIcon && (
                            <DynamicRoleIcon className="h-3 w-3 text-sidebar-foreground/60 shrink-0" />
                          )}
                          <span className="truncate text-xs text-sidebar-foreground/70 capitalize">
                            {dynamicRoleDisplay}
                          </span>
                          {bondInfo && (
                            <>
                              <span className="text-sidebar-foreground/40">•</span>
                              <LinkIcon className="h-3 w-3 text-sidebar-foreground/60 shrink-0" />
                              <span className="truncate text-xs text-sidebar-foreground/60">
                                {bondInfo.name}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      <DotsVerticalIcon className="ml-auto size-4 shrink-0 text-sidebar-foreground/50 group-hover:text-sidebar-foreground transition-colors" />
                    </div>
                  </PopoverTrigger>
                  <PopoverContent className="w-72 p-0" side="bottom" align="end" sideOffset={4}>
                    <div className="flex flex-col">
                      {/* User Info Header */}
                      {profile && (
                        <>
                          <div className="px-4 py-4 border-b border-sidebar-border bg-sidebar-accent/50">
                            <div className="flex items-start gap-3">
                              <Avatar className="size-14 shrink-0 border-2 border-sidebar-border">
                                <AvatarImage src={profile.avatar_url || undefined} alt={profile.display_name || profile.full_name || "User"} />
                                <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground text-base font-semibold">
                                  {getInitials(profile.display_name || profile.full_name, profile.email)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <h3 className="text-base font-semibold text-sidebar-foreground truncate mb-0.5">
                                  {profile.display_name || profile.full_name || "User"}
                                </h3>
                                <p className="text-xs text-sidebar-foreground/60 truncate mb-2">
                                  {profile.email}
                                </p>
                                <div className="flex flex-wrap items-center gap-1.5">
                                  {DynamicRoleIcon && (
                                    <Badge
                                      variant="outline"
                                      className="border-primary/30 text-primary text-xs h-5 px-2 gap-1"
                                    >
                                      <DynamicRoleIcon className="h-3 w-3" />
                                      {dynamicRoleDisplay}
                                    </Badge>
                                  )}
                                  {profile.system_role === "admin" && (
                                    <Badge
                                      variant="secondary"
                                      className="bg-purple-600/20 text-purple-400 border-purple-600/30 text-xs h-5 px-2 gap-1"
                                    >
                                      <Shield className="h-3 w-3" />
                                      Admin
                                    </Badge>
                                  )}
                                  {bondInfo && (
                                    <Badge
                                      variant="outline"
                                      className="border-sidebar-border text-sidebar-foreground/70 text-xs h-5 px-2 gap-1"
                                    >
                                      <LinkIcon className="h-3 w-3" />
                                      <span className="truncate max-w-[100px]">{bondInfo.name}</span>
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </>
                      )}

                      {/* Menu Items */}
                      <div className="py-1">
                        <button
                          onClick={handleAccountClick}
                          className="w-full flex items-center px-4 py-2.5 text-sm text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors cursor-pointer"
                        >
                          <User className="mr-3 h-4 w-4" />
                          <span>Account</span>
                        </button>
                        <button
                          onClick={handleSettingsClick}
                          className="w-full flex items-center px-4 py-2.5 text-sm text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors cursor-pointer"
                        >
                          <Settings className="mr-3 h-4 w-4" />
                          <span>Settings</span>
                        </button>
                      </div>

                      {/* Separator */}
                      <div className="border-t border-sidebar-border my-1" />

                      {/* Sign Out */}
                      <div className="py-1">
                        <button
                          onClick={handleSignOut}
                          className="w-full flex items-center px-4 py-2.5 text-sm text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                        >
                          <LogOut className="mr-3 h-4 w-4" />
                          <span>Sign Out</span>
                        </button>
                      </div>
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
