import type { AppIdea } from "@/types/app-ideas"

export interface NotionSyncResult {
  success: boolean
  notionPageId?: string
  error?: string
}

export async function syncIdeaToNotion(idea: AppIdea): Promise<NotionSyncResult> {
  try {
    // Format priority and category for display
    const priorityEmoji = {
      low: "🟢",
      medium: "🟡",
      high: "🟠",
      urgent: "🔴",
    }

    const categoryEmoji = {
      feature: "✨",
      improvement: "⬆️",
      bug: "🐛",
      design: "🎨",
      content: "📝",
    }

    // Create page content
    const content = `${categoryEmoji[idea.category]} **${idea.title}**

**Priority:** ${priorityEmoji[idea.priority]} ${idea.priority.toUpperCase()}
**Category:** ${idea.category}
**Status:** ${idea.status.replace("_", " ")}
**Created by:** ${idea.created_by}
**Created:** ${new Date(idea.created_at).toLocaleDateString()}

---

${idea.description || "No description provided."}

---

**Tags:** ${idea.tags.length > 0 ? idea.tags.join(", ") : "None"}
**App Idea ID:** ${idea.id}
`

    const response = await fetch("/api/notion/sync-idea", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        idea,
        content,
      }),
    })

    if (!response.ok) {
      throw new Error(`Failed to sync to Notion: ${response.statusText}`)
    }

    const result = await response.json()
    return {
      success: true,
      notionPageId: result.pageId,
    }
  } catch (error) {
    console.error("[v0] Error syncing to Notion:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}
