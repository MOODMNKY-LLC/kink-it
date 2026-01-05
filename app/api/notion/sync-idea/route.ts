import { type NextRequest, NextResponse } from "next/server"
import type { AppIdea } from "@/types/app-ideas"

export async function POST(request: NextRequest) {
  try {
    const { idea } = (await request.json()) as { idea: AppIdea }

    const notionApiKey = process.env.NOTION_API_KEY
    const databaseId = "cc491ef5f0a64eac8e05a6ea10dfb735" // App Ideas database under KINK IT

    if (!notionApiKey) {
      return NextResponse.json(
        {
          success: false,
          error: "Notion API key not configured. Add NOTION_API_KEY to your environment variables.",
        },
        { status: 500 },
      )
    }

    console.log("[v0] Syncing idea to Notion:", idea.title)

    const categoryMap: Record<string, string> = {
      feature: "Feature",
      improvement: "Improvement",
      bug: "Bug Fix",
      design: "UI/UX",
      content: "Integration",
    }

    const priorityMap: Record<string, string> = {
      urgent: "Critical",
      high: "High",
      medium: "Medium",
      low: "Low",
    }

    const statusMap: Record<string, string> = {
      new: "New",
      in_progress: "In Progress",
      completed: "Completed",
      archived: "Deferred",
    }

    // Create page in Notion database using Notion API
    const response = await fetch("https://api.notion.com/v1/pages", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${notionApiKey}`,
        "Content-Type": "application/json",
        "Notion-Version": "2022-06-28",
      },
      body: JSON.stringify({
        parent: { database_id: databaseId },
        properties: {
          Title: {
            title: [
              {
                text: {
                  content: idea.title,
                },
              },
            ],
          },
          Description: {
            rich_text: [
              {
                text: {
                  content: idea.description || "No description provided.",
                },
              },
            ],
          },
          Priority: {
            select: {
              name: priorityMap[idea.priority],
            },
          },
          Category: {
            select: {
              name: categoryMap[idea.category],
            },
          },
          Status: {
            select: {
              name: statusMap[idea.status],
            },
          },
          Tags: {
            multi_select: idea.tags.map((tag) => ({ name: tag })),
          },
        },
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error("[v0] Notion API error:", errorData)
      throw new Error(`Notion API error: ${errorData.message || response.statusText}`)
    }

    const notionPage = await response.json()

    return NextResponse.json({
      success: true,
      pageId: notionPage.id,
      message: "Idea synced to Notion successfully",
    })
  } catch (error) {
    console.error("[v0] Error in Notion sync API:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to sync to Notion",
      },
      { status: 500 },
    )
  }
}
