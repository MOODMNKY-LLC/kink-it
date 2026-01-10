import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import { getUserProfile } from "@/lib/auth/get-user"
import { getNotionAccessToken } from "@/lib/notion-auth"
import { setSyncPending, setSyncSynced, setSyncFailed } from "@/lib/notion/sync-status"

/**
 * Sync Task to Notion Tasks Database
 * 
 * Creates or updates a Notion page in the user's Tasks database
 * with the task data from KINK IT.
 */

interface SyncTaskRequest {
  taskId: string
  // Or provide task data directly
  task?: {
    id: string
    title: string
    description?: string | null
    priority: "low" | "medium" | "high" | "urgent"
    status: "pending" | "in_progress" | "completed" | "approved" | "cancelled"
    due_date?: string | null
    point_value?: number | null
    proof_required?: boolean | null
    proof_type?: "photo" | "video" | "text" | null
    assigned_by?: string | null
    assigned_to?: string | null
    completed_at?: string | null
    approved_at?: string | null
    completion_notes?: string | null
  }
}

export async function POST(request: NextRequest) {
  // Declare taskData outside try block so it's accessible in catch
  let taskData: any = null
  
  try {
    const profile = await getUserProfile()
    if (!profile) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = (await request.json()) as SyncTaskRequest
    const supabase = await createClient()

    // Get user's Notion API key using utility (handles refresh automatically)
    const notionApiKey = await getNotionAccessToken(profile.id)

    if (!notionApiKey) {
      return NextResponse.json(
        {
          success: false,
          error: "Notion API key not found. Please add your Notion API key in Account Settings.",
        },
        { status: 400 }
      )
    }

    // Get Tasks database ID from notion_databases table
    const { data: tasksDb } = await supabase
      .from("notion_databases")
      .select("database_id")
      .eq("user_id", profile.id)
      .eq("database_type", "tasks")
      .single()

    if (!tasksDb?.database_id) {
      return NextResponse.json(
        {
          success: false,
          error: "Tasks database not found. Please sync your Notion template.",
        },
        { status: 404 }
      )
    }

    const databaseId = tasksDb.database_id

    // Fetch task data if taskId provided
    taskData = body.task
    if (body.taskId && !taskData) {
      const { data: task, error: taskError } = await supabase
        .from("tasks")
        .select("*")
        .eq("id", body.taskId)
        .single()

      if (taskError || !task) {
        return NextResponse.json(
          { success: false, error: "Task not found" },
          { status: 404 }
        )
      }

      taskData = task as any
    }

    if (!taskData) {
      return NextResponse.json(
        { success: false, error: "Task data is required" },
        { status: 400 }
      )
    }

    // Set sync status to pending
    try {
      await setSyncPending("tasks", taskData.id)
    } catch (error) {
      console.warn("[Sync Task] Could not set pending status:", error)
      // Continue with sync even if status update fails
    }

    // Map priority to Notion select option
    const priorityMap: Record<string, string> = {
      low: "Low",
      medium: "Medium",
      high: "High",
      urgent: "Urgent",
    }

    // Map status to Notion select option
    const statusMap: Record<string, string> = {
      pending: "Pending",
      in_progress: "In Progress",
      completed: "Completed",
      approved: "Approved",
      cancelled: "Cancelled",
    }

    const notionPriority = priorityMap[taskData.priority] || "Medium"
    const notionStatus = statusMap[taskData.status] || "Pending"

    // Build Notion page properties
    const properties: any = {
      Title: {
        title: [
          {
            text: {
              content: taskData.title,
            },
          },
        ],
      },
      Priority: {
        select: {
          name: notionPriority,
        },
      },
      Status: {
        select: {
          name: notionStatus,
        },
      },
    }

    // Add description if available
    if (taskData.description) {
      properties.Description = {
        rich_text: [
          {
            text: {
              content: taskData.description,
            },
          },
        ],
      }
    }

    // Add due date if available
    if (taskData.due_date) {
      properties["Due Date"] = {
        date: {
          start: new Date(taskData.due_date).toISOString(),
        },
      }
    }

    // Add point value if available (use "Point Value" to match Notion template)
    if (taskData.point_value !== null && taskData.point_value !== undefined) {
      properties["Point Value"] = {
        number: taskData.point_value,
      }
    }

    // Add proof required checkbox
    if (taskData.proof_required !== null && taskData.proof_required !== undefined) {
      properties["Proof Required"] = {
        checkbox: taskData.proof_required,
      }
    }

    // Add proof type if available
    if (taskData.proof_type) {
      const proofTypeMap: Record<string, string> = {
        photo: "Photo",
        video: "Video",
        text: "Text",
      }
      properties["Proof Type"] = {
        select: {
          name: proofTypeMap[taskData.proof_type] || taskData.proof_type,
        },
      }
    }

    // Add completion date if available
    if (taskData.completed_at) {
      properties["Completed At"] = {
        date: {
          start: new Date(taskData.completed_at).toISOString(),
        },
      }
    }

    // Add approval date if available
    if (taskData.approved_at) {
      properties["Approved At"] = {
        date: {
          start: new Date(taskData.approved_at).toISOString(),
        },
      }
    }

    // Add completion notes if available
    if (taskData.completion_notes) {
      properties["Completion Notes"] = {
        rich_text: [
          {
            text: {
              content: taskData.completion_notes,
            },
          },
        ],
      }
    }

    // Check if page already exists (by searching for task with same title)
    let existingPageId: string | null = null
    try {
      const searchResponse = await fetch(
        `https://api.notion.com/v1/databases/${databaseId}/query`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${notionApiKey}`,
            "Content-Type": "application/json",
            "Notion-Version": "2022-06-28",
          },
          body: JSON.stringify({
            filter: {
              property: "Title",
              title: {
                equals: taskData.title,
              },
            },
            page_size: 1,
          }),
        }
      )

      if (searchResponse.ok) {
        const searchData = await searchResponse.json()
        if (searchData.results && searchData.results.length > 0) {
          existingPageId = searchData.results[0].id
        }
      }
    } catch (error) {
      console.warn("[Notion] Error searching for existing page:", error)
      // Continue to create new page
    }

    // Create or update page in Notion
    const url = existingPageId
      ? `https://api.notion.com/v1/pages/${existingPageId}`
      : "https://api.notion.com/v1/pages"

    const method = existingPageId ? "PATCH" : "POST"

    const pageData: any = {
      properties,
    }

    if (!existingPageId) {
      pageData.parent = { database_id: databaseId }
    }

    const response = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${notionApiKey}`,
        "Content-Type": "application/json",
        "Notion-Version": "2022-06-28",
      },
      body: JSON.stringify(pageData),
    })

    if (!response.ok) {
      let errorMessage = response.statusText || "Notion API error"
      try {
        const errorText = await response.text()
        if (errorText) {
          const errorData = JSON.parse(errorText)
          errorMessage = errorData.message || errorData.error || errorMessage
          console.error("[Notion] API error:", errorData)
        }
      } catch (parseError) {
        console.error("[Notion] Failed to parse error response:", parseError)
      }
      throw new Error(`Notion API error: ${errorMessage}`)
    }

    const notionPage = await response.json()

    // Update sync status to synced
    try {
      await setSyncSynced("tasks", taskData.id, notionPage.id)
    } catch (error) {
      console.warn("[Sync Task] Could not update sync status:", error)
      // Continue even if status update fails
    }

    return NextResponse.json({
      success: true,
      pageId: notionPage.id,
      pageUrl: notionPage.url,
      message: existingPageId
        ? "Task updated in Notion successfully"
        : "Task synced to Notion successfully",
    })
  } catch (error) {
    console.error("[Notion] Error syncing task:", error)
    
    // Update sync status to failed
    if (taskData?.id) {
      try {
        await setSyncFailed(
          "tasks",
          taskData.id,
          error instanceof Error ? error.message : "Unknown error"
        )
      } catch (statusError) {
        console.warn("[Sync Task] Could not update failed status:", statusError)
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    )
  }
}

