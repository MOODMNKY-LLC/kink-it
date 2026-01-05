export interface DashboardStat {
  label: string
  value: string
  description: string
  intent: "positive" | "negative" | "neutral"
  icon: string
  tag?: string
  direction?: "up" | "down"
}

export interface ChartDataPoint {
  date: string
  spendings: number
  sales: number
  coffee: number
}

export interface ChartData {
  week: ChartDataPoint[]
  month: ChartDataPoint[]
  year: ChartDataPoint[]
}

export interface RebelRanking {
  id: number
  name: string
  handle: string
  streak: string
  points: number
  avatar: string
  featured?: boolean
  subtitle?: string
}

export interface SecurityStatus {
  title: string
  value: string
  status: string
  variant: "success" | "warning" | "destructive"
}

export interface Notification {
  id: string
  title: string
  message: string
  timestamp: string
  type: "info" | "warning" | "success" | "error"
  read: boolean
  priority: "low" | "medium" | "high"
}

export interface WidgetData {
  location: string
  timezone: string
  temperature: string
  weather: string
  date: string
  dynamicGreeting?: string
  moodStatus?: "Green" | "Yellow" | "Red"
}

export interface PartnerProfile {
  id: string
  name: string
  role: "Dominant" | "Submissive"
  handle: string
  avatar: string
  pronouns: string
  joinDate: string
  currentStreak?: number
  totalPoints?: number
  preferences: {
    primaryLoveLanguage: string
    secondaryLoveLanguage: string
  }
}

export interface Reward {
  id: string
  name: string
  type: "Meaningful Reward" | "Point Transaction" | "Achievement Badge" | "Learning Opportunity"
  category: string | null
  recognitionTier?: "Daily" | "Weekly" | "Monthly" | "Milestone"
  dateEarned?: string
  points: number
  pointCost?: number
  loveLanguage?: string
  description: string
  status?: "Available" | "Redeemed" | "Completed" | "In Progress"
  earnedBy?: string
}

export interface Task {
  id: string
  title: string
  description: string
  priority: "Low" | "Medium" | "High" | "Critical"
  dueDate: string
  points: number
  category: string
  status: "Not Started" | "In Progress" | "Completed" | "Overdue"
  recurring: "Daily" | "Weekly" | "Monthly" | "One-time"
  proofRequired?: boolean
}

export interface MockData {
  dashboardStats: DashboardStat[]
  chartData: ChartData
  partnerProfiles?: {
    dominant: PartnerProfile
    submissive: PartnerProfile
  }
  recentRewards?: Reward[]
  availableRewards?: Reward[]
  currentTasks?: Task[]
  rebelsRanking?: RebelRanking[]
  securityStatus: SecurityStatus[]
  notifications: Notification[]
  widgetData: WidgetData
}

export type TimePeriod = "week" | "month" | "year"
