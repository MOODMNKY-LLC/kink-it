import { createClient } from "@/lib/supabase/server"
import type { Notification } from "@/types/dashboard"

/**
 * Get notifications for a user
 * Phase 1: Generate from task events (notifications table doesn't exist yet)
 * Future: Query notifications table when it exists
 */
export async function getNotifications(userId: string): Promise<Notification[]> {
  const supabase = await createClient()

  // For now, generate notifications from recent task events
  // TODO: Replace with notifications table query when it exists

  const { data: recentTasks, error } = await supabase
    .from("tasks")
    .select("id, title, status, assigned_by, assigned_to, created_at, completed_at, approved_at")
    .or(`assigned_to.eq.${userId},assigned_by.eq.${userId}`)
    .order("created_at", { ascending: false })
    .limit(10)

  if (error) {
    console.error("[Notifications] Error fetching tasks:", error)
    return []
  }

  if (!recentTasks || recentTasks.length === 0) {
    return []
  }

  // Get partner profile for names
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, display_name, full_name, partner_id")
    .eq("id", userId)
    .single()

  const partnerId = profile?.partner_id

  // Generate notifications from task events
  const notifications: Notification[] = []

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
      notifications.push({
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
      notifications.push({
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
      notifications.push({
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

  // Sort by timestamp (newest first) and limit to 10
  return notifications
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 10)
}

