/**
 * Context-aware prompt templates for KINK IT chat
 * These prompts are tailored to user's dynamic role, bond status, and app context
 */

import type { Profile } from "@/types/profile"

export interface PromptTemplate {
  id: string
  title: string
  prompt: string
  category: "tasks" | "protocols" | "guidance" | "relationship" | "education" | "general"
  role?: "dominant" | "submissive" | "switch" | "all"
  requiresBond?: boolean
}

export function getContextualPrompts(profile?: Profile | null): PromptTemplate[] {
  const dynamicRole = profile?.dynamic_role
  const hasBond = !!profile?.bond_id

  const allPrompts: PromptTemplate[] = [
    // Task-related prompts
    {
      id: "create-task",
      title: "Create a Task",
      prompt: "Help me create a task for my partner",
      category: "tasks",
      role: "dominant",
      requiresBond: true,
    },
    {
      id: "task-ideas",
      title: "Get Task Ideas",
      prompt: "Suggest some task ideas appropriate for my dynamic",
      category: "tasks",
      role: "all",
      requiresBond: true,
    },
    {
      id: "task-submission",
      title: "Submit Task Completion",
      prompt: "Help me prepare my task submission",
      category: "tasks",
      role: "submissive",
      requiresBond: true,
    },

    // Protocol prompts
    {
      id: "protocol-ideas",
      title: "Protocol Ideas",
      prompt: "Suggest some protocols for maintaining our dynamic",
      category: "protocols",
      role: "dominant",
      requiresBond: true,
    },
    {
      id: "protocol-guidance",
      title: "Protocol Guidance",
      prompt: "Help me understand how to follow protocols effectively",
      category: "protocols",
      role: "submissive",
      requiresBond: true,
    },

    // Relationship guidance
    {
      id: "scene-planning",
      title: "Plan a Scene",
      prompt: "Help me plan a scene for tonight",
      category: "relationship",
      role: "dominant",
      requiresBond: true,
    },
    {
      id: "communication",
      title: "Improve Communication",
      prompt: "Help me communicate better with my partner about our dynamic",
      category: "relationship",
      role: "all",
      requiresBond: true,
    },
    {
      id: "submissive-mindset",
      title: "Submissive Mindset",
      prompt: "Guide me through maintaining a submissive mindset",
      category: "guidance",
      role: "submissive",
      requiresBond: true,
    },
    {
      id: "dominant-leadership",
      title: "Dominant Leadership",
      prompt: "Help me develop my leadership skills in our dynamic",
      category: "guidance",
      role: "dominant",
      requiresBond: true,
    },

    // Education prompts
    {
      id: "safe-words",
      title: "Safe Words & Boundaries",
      prompt: "Explain safe words and boundaries in BDSM",
      category: "education",
      role: "all",
    },
    {
      id: "consent",
      title: "Consent & RACK",
      prompt: "Explain consent and RACK (Risk-Aware Consensual Kink) principles",
      category: "education",
      role: "all",
    },
    {
      id: "roles",
      title: "BDSM Roles",
      prompt: "Explain different BDSM roles and dynamics",
      category: "education",
      role: "all",
    },

    // General prompts
    {
      id: "app-help",
      title: "App Help",
      prompt: "How do I use the KINK IT app features?",
      category: "general",
      role: "all",
    },
    {
      id: "kinkster-help",
      title: "KINKSTER Help",
      prompt: "How do I create and use KINKSTER avatars?",
      category: "general",
      role: "all",
    },
  ]

  // Filter prompts based on user context
  return allPrompts.filter((prompt) => {
    // Filter by role
    if (prompt.role && prompt.role !== "all" && prompt.role !== dynamicRole) {
      return false
    }

    // Filter by bond requirement
    if (prompt.requiresBond && !hasBond) {
      return false
    }

    return true
  })
}

export function generateContextualPrompt(
  templateId: string,
  profile?: Profile | null
): string | null {
  const templates = getContextualPrompts(profile)
  const template = templates.find((t) => t.id === templateId)
  return template?.prompt || null
}


