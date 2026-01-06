import { createClient } from "@/lib/supabase/server"

export interface AdminStats {
  totalUsers: number
  activeUsers: number
  totalBonds: number
  activeBonds: number
  totalTasks: number
  completedTasks: number
  totalPoints: number
  recentActivity: Array<{
    type: string
    description: string
    timestamp: string
  }>
}

/**
 * Get system-wide statistics for admin dashboard
 */
export async function getAdminStats(): Promise<AdminStats> {
  const supabase = await createClient()

  // Get total users
  const { count: totalUsers } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })

  // Get active users (logged in within last 30 days)
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const { count: activeUsers } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .gte("updated_at", thirtyDaysAgo.toISOString())

  // Get total bonds
  const { count: totalBonds } = await supabase
    .from("bonds")
    .select("*", { count: "exact", head: true })

  // Get active bonds
  const { count: activeBonds } = await supabase
    .from("bonds")
    .select("*", { count: "exact", head: true })
    .eq("bond_status", "active")

  // Get total tasks
  const { count: totalTasks } = await supabase
    .from("tasks")
    .select("*", { count: "exact", head: true })

  // Get completed tasks
  const { count: completedTasks } = await supabase
    .from("tasks")
    .select("*", { count: "exact", head: true })
    .in("status", ["completed", "approved"])

  // Get total points (sum of all points_ledger entries)
  const { data: pointsData } = await supabase
    .from("points_ledger")
    .select("points")
  
  const totalPoints = pointsData?.reduce((sum, entry) => sum + (entry.points || 0), 0) || 0

  // Get recent activity (last 10 activities)
  const { data: recentTasks } = await supabase
    .from("tasks")
    .select("id, title, status, created_at, updated_at")
    .order("updated_at", { ascending: false })
    .limit(10)

  const { data: recentBonds } = await supabase
    .from("bonds")
    .select("id, name, created_at")
    .order("created_at", { ascending: false })
    .limit(5)

  const recentActivity = [
    ...(recentTasks?.map((task) => ({
      type: "task",
      description: `Task "${task.title}" ${task.status}`,
      timestamp: task.updated_at || task.created_at,
    })) || []),
    ...(recentBonds?.map((bond) => ({
      type: "bond",
      description: `Bond "${bond.name}" created`,
      timestamp: bond.created_at,
    })) || []),
  ]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 10)

  return {
    totalUsers: totalUsers || 0,
    activeUsers: activeUsers || 0,
    totalBonds: totalBonds || 0,
    activeBonds: activeBonds || 0,
    totalTasks: totalTasks || 0,
    completedTasks: completedTasks || 0,
    totalPoints,
    recentActivity,
  }
}



