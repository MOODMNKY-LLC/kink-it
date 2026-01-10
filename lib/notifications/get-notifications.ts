import { createClient } from "@/lib/supabase/server"
import type { Notification } from "@/types/dashboard"

/**
 * Get notifications for a user
 * Queries the notifications table and also generates notifications from task events
 * (for backward compatibility during migration)
 */
export async function getNotifications(userId: string): Promise<Notification[]> {
  const supabase = await createClient()

  // Query notifications table
  // Handle case where table might not exist yet (graceful degradation)
  let dbNotifications: any[] | null = null
  let dbError: any = null
  
  try {
    const result = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50)
    
    dbNotifications = result.data
    dbError = result.error
  } catch (error) {
    // Table might not exist - log but continue with task-based notifications
    console.warn("[Notifications] Table query failed (may not exist yet):", error)
    dbError = error
  }

  if (dbError) {
    // Check if it's a schema error (table doesn't exist)
    const isSchemaError = 
      dbError.message?.includes("relation") && dbError.message?.includes("does not exist") ||
      dbError.message?.includes("Could not find the table") ||
      dbError.code === "PGRST204" ||
      dbError.code === "PGRST205"
    
    if (isSchemaError) {
      console.warn("[Notifications] Notifications table not found - using task-based notifications only")
    } else {
      console.error("[Notifications] Error fetching from table:", dbError)
    }
  }

  // Convert database notifications to Notification type
  const notifications: Notification[] = (dbNotifications || []).map((n) => ({
    id: n.id,
    title: n.title,
    message: n.message,
    timestamp: n.created_at,
    type: n.type as Notification["type"],
    read: n.read,
    priority: n.priority as Notification["priority"],
  }))

  // Also generate notifications from task events (for backward compatibility)
  // This can be removed once all notifications are migrated to the table
  const { data: recentTasks, error } = await supabase
    .from("tasks")
    .select("id, title, status, assigned_by, assigned_to, created_at, completed_at, approved_at")
    .or(`assigned_to.eq.${userId},assigned_by.eq.${userId}`)
    .order("created_at", { ascending: false })
    .limit(10)

  if (error) {
    console.error("[Notifications] Error fetching tasks:", error)
  }

  const taskNotifications: Notification[] = []

  if (recentTasks && recentTasks.length > 0) {
    // Get partner profile for names
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, display_name, full_name, partner_id")
      .eq("id", userId)
      .single()

    const partnerId = profile?.partner_id

    for (const task of recentTasks) {
      const isAssignedToMe = task.assigned_to === userId
      const isAssignedByMe = task.assigned_by === userId

      // Get assigner/assignee name
      let partnerName = "Your partner"
      if (partnerId) {
        const partnerIdToFetch = isAssignedToMe ? task.assigned_by : task.assigned_to
        if (partnerIdToFetch) {
          const { data: partnerProfile } = await supabase
            .from("profiles")
            .select("display_name, full_name")
            .eq("id", partnerIdToFetch)
            .single()

          if (partnerProfile) {
            partnerName = partnerProfile.display_name || partnerProfile.full_name || partnerName
          }
        }
      }

      // Task assigned notification (for submissive)
      // Language: Attribute to Dominant by name, clear and deferential
      if (isAssignedToMe && task.status === "pending") {
        taskNotifications.push({
          id: `task-${task.id}-assigned`,
          title: "NEW TASK ASSIGNED",
          message: `${partnerName} has assigned you: '${task.title}'`,
          timestamp: task.created_at,
          type: "info",
          read: false,
          priority: "high",
        })
      }

      // Task completed notification (for dominant)
      // Language: Acknowledge completion, maintain hierarchy
      if (isAssignedByMe && task.status === "completed" && task.completed_at) {
        taskNotifications.push({
          id: `task-${task.id}-completed`,
          title: "TASK COMPLETED",
          message: `${partnerName} has completed: '${task.title}'`,
          timestamp: task.completed_at,
          type: "success",
          read: false,
          priority: "medium",
        })
      }

      // Task approved notification (for submissive)
      // Language: Acknowledge approval, reinforce hierarchy
      if (isAssignedToMe && task.status === "approved" && task.approved_at) {
        taskNotifications.push({
          id: `task-${task.id}-approved`,
          title: "TASK APPROVED",
          message: `${partnerName} has approved your completion: '${task.title}'`,
          timestamp: task.approved_at,
          type: "success",
          read: false,
          priority: "medium",
        })
      }
    }
  }

  // Combine database notifications with generated task notifications
  const allNotifications = [...notifications, ...taskNotifications]

  // Sort by timestamp (newest first) and limit to 50
  return allNotifications
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 50)
}
