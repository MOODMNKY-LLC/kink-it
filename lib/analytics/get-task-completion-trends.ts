import { createClient } from "@/lib/supabase/server"
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, subWeeks, subMonths, subYears, format } from "date-fns"

interface ChartDataPoint {
  date: string
  completions: number
  points: number
}

interface TaskCompletionTrends {
  week: ChartDataPoint[]
  month: ChartDataPoint[]
  year: ChartDataPoint[]
}

interface GetTaskCompletionTrendsOptions {
  userId: string
  userRole: "dominant" | "submissive" | "switch"
  partnerId?: string | null
}

/**
 * Calculate task completion trends for charts
 * Returns data grouped by week, month, and year
 */
export async function getTaskCompletionTrends({
  userId,
  userRole,
  partnerId,
}: GetTaskCompletionTrendsOptions): Promise<TaskCompletionTrends> {
  const supabase = await createClient()

  // Determine which user's tasks to analyze
  const targetUserId = userRole === "submissive" ? userId : partnerId || userId

  // Get tasks completed/approved
  let tasksQuery = supabase
    .from("tasks")
    .select("completed_at, point_value, status")
    .in("status", ["completed", "approved"])
    .not("completed_at", "is", null)

  if (userRole === "submissive") {
    tasksQuery = tasksQuery.eq("assigned_to", userId)
  } else if (userRole === "dominant" && partnerId) {
    tasksQuery = tasksQuery.eq("assigned_to", partnerId)
  } else {
    tasksQuery = tasksQuery.eq("assigned_by", userId)
  }

  const { data: tasks, error } = await tasksQuery

  if (error || !tasks || tasks.length === 0) {
    // Return empty data structure
    return {
      week: [],
      month: [],
      year: [],
    }
  }

  const now = new Date()

  // Week data: Last 7 days
  const weekData = calculateWeekData(tasks, now)

  // Month data: Last 4 weeks
  const monthData = calculateMonthData(tasks, now)

  // Year data: Last 12 months
  const yearData = calculateYearData(tasks, now)

  return {
    week: weekData,
    month: monthData,
    year: yearData,
  }
}

/**
 * Calculate week data (last 7 days)
 */
function calculateWeekData(
  tasks: Array<{ completed_at: string; point_value: number | null }>,
  now: Date
): ChartDataPoint[] {
  const weekStart = startOfWeek(now, { weekStartsOn: 1 })
  const dataPoints: ChartDataPoint[] = []

  // Group by day for last 7 days
  for (let i = 6; i >= 0; i--) {
    const date = new Date(weekStart)
    date.setDate(date.getDate() - i)
    const dayStart = new Date(date)
    dayStart.setHours(0, 0, 0, 0)
    const dayEnd = new Date(date)
    dayEnd.setHours(23, 59, 59, 999)

    const dayTasks = tasks.filter((t) => {
      const completedAt = new Date(t.completed_at)
      return completedAt >= dayStart && completedAt <= dayEnd
    })

    dataPoints.push({
      date: format(date, "MM/dd"),
      completions: dayTasks.length,
      points: dayTasks.reduce((sum, t) => sum + (t.point_value || 0), 0),
    })
  }

  return dataPoints
}

/**
 * Calculate month data (last 4 weeks)
 */
function calculateMonthData(
  tasks: Array<{ completed_at: string; point_value: number | null }>,
  now: Date
): ChartDataPoint[] {
  const dataPoints: ChartDataPoint[] = []

  // Group by week for last 4 weeks
  for (let i = 3; i >= 0; i--) {
    const weekStart = startOfWeek(subWeeks(now, i), { weekStartsOn: 1 })
    const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 })

    const weekTasks = tasks.filter((t) => {
      const completedAt = new Date(t.completed_at)
      return completedAt >= weekStart && completedAt <= weekEnd
    })

    dataPoints.push({
      date: `Week ${4 - i}`,
      completions: weekTasks.length,
      points: weekTasks.reduce((sum, t) => sum + (t.point_value || 0), 0),
    })
  }

  return dataPoints
}

/**
 * Calculate year data (last 12 months)
 */
function calculateYearData(
  tasks: Array<{ completed_at: string; point_value: number | null }>,
  now: Date
): ChartDataPoint[] {
  const dataPoints: ChartDataPoint[] = []

  // Group by month for last 12 months
  for (let i = 11; i >= 0; i--) {
    const monthStart = startOfMonth(subMonths(now, i))
    const monthEnd = endOfMonth(monthStart)

    const monthTasks = tasks.filter((t) => {
      const completedAt = new Date(t.completed_at)
      return completedAt >= monthStart && completedAt <= monthEnd
    })

    dataPoints.push({
      date: format(monthStart, "MMM"),
      completions: monthTasks.length,
      points: monthTasks.reduce((sum, t) => sum + (t.point_value || 0), 0),
    })
  }

  return dataPoints
}




