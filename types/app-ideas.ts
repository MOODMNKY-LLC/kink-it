export interface AppIdea {
  id: string
  title: string
  description: string | null
  category: "feature" | "improvement" | "bug" | "design" | "content"
  priority: "low" | "medium" | "high" | "urgent"
  status: "new" | "in_progress" | "completed" | "archived"
  created_by: string
  assigned_to: string | null
  notion_page_id: string | null
  tags: string[]
  created_at: string
  updated_at: string
}

export interface CreateAppIdeaInput {
  title: string
  description?: string
  category: AppIdea["category"]
  priority?: AppIdea["priority"]
  created_by: string
  assigned_to?: string
  tags?: string[]
}
