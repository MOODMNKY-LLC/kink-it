/**
 * Context-aware helpers for chat and UI components
 * Makes components aware of user's dynamic role, bond status, and app theme
 */

import type { Profile } from "@/types/profile"

export interface AppContext {
  dynamicRole: "dominant" | "submissive" | "switch" | null
  hasBond: boolean
  bondId: string | null
  partnerId: string | null
  isAdmin: boolean
}

export function getAppContext(profile?: Profile | null): AppContext {
  if (!profile) {
    return {
      dynamicRole: null,
      hasBond: false,
      bondId: null,
      partnerId: null,
      isAdmin: false,
    }
  }

  return {
    dynamicRole: profile.dynamic_role as "dominant" | "submissive" | "switch" | null,
    hasBond: !!profile.bond_id,
    bondId: profile.bond_id || null,
    partnerId: profile.partner_id || null,
    isAdmin: profile.system_role === "admin",
  }
}

export function getRoleAwareGreeting(profile?: Profile | null): string {
  const context = getAppContext(profile)
  const name = profile?.display_name || profile?.full_name || "there"

  if (context.dynamicRole === "dominant") {
    return `Welcome back, ${name}. Ready to manage your dynamic?`
  }
  if (context.dynamicRole === "submissive") {
    return `Welcome back, ${name}. How can I support your submission today?`
  }
  if (context.dynamicRole === "switch") {
    return `Welcome back, ${name}. Ready to explore your dynamic?`
  }

  return `Welcome back, ${name}. How can I help you today?`
}

export function getRoleAwareInstructions(profile?: Profile | null): string {
  const context = getAppContext(profile)
  let instructions = ""

  if (context.dynamicRole === "dominant" && context.hasBond) {
    instructions = "You're chatting as a Dominant in an active bond. You can create tasks, establish protocols, and get guidance on managing your dynamic."
  } else if (context.dynamicRole === "submissive" && context.hasBond) {
    instructions = "You're chatting as a Submissive in an active bond. You can get help with tasks, protocols, and guidance on your submission."
  } else if (context.hasBond) {
    instructions = "You're in an active bond. Chat to get help with your dynamic relationship."
  } else {
    instructions = "Chat with Kinky Kincade to explore the KINK IT app and learn about BDSM/kink dynamics."
  }

  // Add Notion integration instructions if user has API key
  instructions += "\n\nYou have access to Notion integration tools. Users can ask you to:\n"
  instructions += "- Search their Notion workspace (e.g., 'What's on my task list today?', 'Show my latest image generation')\n"
  instructions += "- Query databases (tasks, ideas, image generations, KINKSTER profiles, etc.)\n"
  instructions += "- Fetch detailed page information\n"
  if (context.dynamicRole === "dominant" || context.isAdmin) {
    instructions += "- Create tasks and ideas in Notion (e.g., 'Add a new task: Clean the kitchen')\n"
  }
  instructions += "\nWhen users ask about their Notion content, use the appropriate Notion tools to retrieve and display the information in a clear, formatted way."

  return instructions
}

export function getContextualColorScheme(profile?: Profile | null): {
  primary: string
  accent: string
} {
  const context = getAppContext(profile)

  if (context.dynamicRole === "dominant") {
    return {
      primary: "text-red-500",
      accent: "bg-red-500/10 border-red-500/20",
    }
  }
  if (context.dynamicRole === "submissive") {
    return {
      primary: "text-blue-500",
      accent: "bg-blue-500/10 border-blue-500/20",
    }
  }
  if (context.dynamicRole === "switch") {
    return {
      primary: "text-purple-500",
      accent: "bg-purple-500/10 border-purple-500/20",
    }
  }

  return {
    primary: "text-primary",
    accent: "bg-primary/10 border-primary/20",
  }
}

export function shouldShowBondFeatures(profile?: Profile | null): boolean {
  const context = getAppContext(profile)
  return context.hasBond
}

export function getRoleAwareTerminology(profile?: Profile | null): {
  partner: string
  relationship: string
  tasks: string
} {
  const context = getAppContext(profile)

  if (context.dynamicRole === "dominant") {
    return {
      partner: "your submissive",
      relationship: "your dynamic",
      tasks: "tasks you assign",
    }
  }
  if (context.dynamicRole === "submissive") {
    return {
      partner: "your Dominant",
      relationship: "your submission",
      tasks: "tasks assigned to you",
    }
  }

  return {
    partner: "your partner",
    relationship: "your relationship",
    tasks: "tasks",
  }
}
