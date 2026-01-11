/**
 * Navigation Configuration for KINK IT Sidebar
 * 
 * This file contains the navigation structure for both admin and regular users.
 * The sidebar component will conditionally render based on user role.
 */

import type * as React from "react"
import AtomIcon from "@/components/icons/atom"
import BracketsIcon from "@/components/icons/brackets"
import ProcessorIcon from "@/components/icons/proccesor"
import CuteRobotIcon from "@/components/icons/cute-robot"
import EmailIcon from "@/components/icons/email"
import GearIcon from "@/components/icons/gear"
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
  Link as LinkIcon,
  Sparkles,
  Wand2,
  Image as ImageIcon,
  User,
  Trophy,
} from "lucide-react"

export interface NavigationItem {
  title: string
  url: string
  icon: React.ElementType
  locked?: boolean
}

export interface NavigationGroup {
  title: string
  items: NavigationItem[]
}

/**
 * Regular User Navigation Configuration
 * Core features accessible to all authenticated users
 */
export const userNavigation: NavigationGroup[] = [
  {
    title: "Dashboard",
    items: [
      {
        title: "Overview",
        url: "/",
        icon: BracketsIcon,
      },
      {
        title: "AI Chat",
        url: "/chat",
        icon: MessageSquare,
      },
      {
        title: "Tasks",
        url: "/tasks",
        icon: ProcessorIcon,
      },
      {
        title: "Rewards",
        url: "/rewards",
        icon: AtomIcon,
      },
      {
        title: "Achievements",
        url: "/achievements",
        icon: Trophy,
      },
    ],
  },
  {
    title: "Relationship",
    items: [
      {
        title: "Bonds",
        url: "/bonds",
        icon: LinkIcon,
      },
      {
        title: "Rules & Protocols",
        url: "/rules",
        icon: FileText,
      },
      {
        title: "Boundaries",
        url: "/boundaries",
        icon: CuteRobotIcon,
      },
      {
        title: "Contract & Consent",
        url: "/contract",
        icon: Scale,
      },
      {
        title: "Communication",
        url: "/communication",
        icon: EmailIcon,
      },
    ],
  },
  {
    title: "Personal",
    items: [
      {
        title: "Journal",
        url: "/journal",
        icon: BookOpen,
      },
      {
        title: "Calendar",
        url: "/calendar",
        icon: Calendar,
      },
      {
        title: "Analytics",
        url: "/analytics",
        icon: BarChart3,
      },
    ],
  },
  {
    title: "Resources",
    items: [
      {
        title: "Library",
        url: "/resources",
        icon: Library,
      },
      {
        title: "Guides",
        url: "/guides",
        icon: LayoutIcon,
      },
      {
        title: "Ideas",
        url: "/ideas",
        icon: LightbulbIcon,
      },
    ],
  },
  {
    title: "Kinky's Playground",
    items: [
      {
        title: "Creative Studio",
        url: "/playground/creative-studio",
        icon: Sparkles,
      },
      {
        title: "Discovery Hub",
        url: "/playground",
        icon: Wand2,
      },
    ],
  },
]

/**
 * Admin Navigation Configuration
 * Administrative features only visible to admin users
 */
export const adminNavigation: NavigationGroup[] = [
  {
    title: "Administration",
    items: [
      {
        title: "Admin Dashboard",
        url: "/admin/dashboard",
        icon: Shield,
      },
      {
        title: "Bond Management",
        url: "/admin/bonds",
        icon: LinkIcon,
      },
      {
        title: "User Management",
        url: "/admin/users",
        icon: Users,
        locked: true,
      },
      {
        title: "System Analytics",
        url: "/admin/analytics",
        icon: BarChart3,
        locked: true,
      },
    ],
  },
]

/**
 * Get navigation configuration based on user role
 * 
 * @param isAdmin - Whether the user is an admin
 * @returns Combined navigation configuration
 */
export function getNavigationConfig(isAdmin: boolean): NavigationGroup[] {
  if (isAdmin) {
    // Admin users see both user navigation and admin navigation
    return [...userNavigation, ...adminNavigation]
  }
  // Regular users only see user navigation
  return userNavigation
}
