/**
 * Data Transformation Utilities
 * 
 * Transforms data between Notion page format and Supabase record format
 */

import type { NotionPage } from "./retrieve-service"
import { extractTitleFromNotionPage } from "./retrieve-service"

export type DatabaseType =
  | "tasks"
  | "rules"
  | "contracts"
  | "journal"
  | "calendar"
  | "kinksters"
  | "image_generations"
  | "app_ideas"

/**
 * Transforms a Notion page to Supabase record format
 */
export function transformNotionPageToSupabaseFormat(
  page: NotionPage,
  databaseType: DatabaseType
): Record<string, any> {
  const properties = page.properties || {}
  const baseRecord: Record<string, any> = {
    notion_page_id: page.id,
    last_edited_time: page.last_edited_time,
    created_time: page.created_time,
  }

  switch (databaseType) {
    case "tasks":
      return transformTaskPage(properties, baseRecord)
    case "rules":
      return transformRulePage(properties, baseRecord)
    case "contracts":
      return transformContractPage(properties, baseRecord)
    case "journal":
      return transformJournalPage(properties, baseRecord)
    case "calendar":
      return transformCalendarPage(properties, baseRecord)
    case "kinksters":
      return transformKinksterPage(properties, baseRecord)
    case "app_ideas":
      return transformIdeaPage(properties, baseRecord)
    case "image_generations":
      return transformImageGenerationPage(properties, baseRecord)
    default:
      return baseRecord
  }
}

function transformTaskPage(properties: Record<string, any>, base: Record<string, any>): Record<string, any> {
  return {
    ...base,
    title: extractTextProperty(properties.Title) || extractTextProperty(properties["Task Name"]),
    description: extractTextProperty(properties.Description),
    priority: mapSelectToEnum(properties.Priority, {
      Low: "low",
      Medium: "medium",
      High: "high",
      Urgent: "urgent",
    }),
    status: mapSelectToEnum(properties.Status, {
      Pending: "pending",
      "In Progress": "in_progress",
      Completed: "completed",
      Approved: "approved",
      Cancelled: "cancelled",
    }),
    due_date: extractDateProperty(properties["Due Date"]),
    point_value: extractNumberProperty(properties["Point Value"]),
    proof_required: extractCheckboxProperty(properties["Proof Required"]),
    proof_type: mapSelectToEnum(properties["Proof Type"], {
      Photo: "photo",
      Video: "video",
      Text: "text",
    }),
    completed_at: extractDateProperty(properties["Completed At"]),
    approved_at: extractDateProperty(properties["Approved At"]),
    completion_notes: extractTextProperty(properties["Completion Notes"]),
  }
}

function transformRulePage(properties: Record<string, any>, base: Record<string, any>): Record<string, any> {
  return {
    ...base,
    title: extractTextProperty(properties.Title),
    description: extractTextProperty(properties.Description),
    category: mapSelectToEnum(properties["Rule Type"], {
      Standing: "standing",
      Situational: "situational",
      Temporary: "temporary",
      Optional: "protocol",
    }),
    status: extractCheckboxProperty(properties.Active) ? "active" : "inactive",
    effective_from: extractDateProperty(properties["Effective From"]),
    effective_until: extractDateProperty(properties["Effective Until"]),
  }
}

function transformContractPage(properties: Record<string, any>, base: Record<string, any>): Record<string, any> {
  return {
    ...base,
    title: extractTextProperty(properties.Title),
    content: extractTextProperty(properties.Content),
    version: extractNumberProperty(properties.Version) || 1,
    status: mapSelectToEnum(properties.Status, {
      Draft: "draft",
      "Pending Signature": "pending_signature",
      Active: "active",
      Archived: "archived",
      Superseded: "superseded",
    }),
    effective_from: extractDateProperty(properties["Effective From"]),
    effective_until: extractDateProperty(properties["Effective Until"]),
  }
}

function transformJournalPage(properties: Record<string, any>, base: Record<string, any>): Record<string, any> {
  return {
    ...base,
    title: extractTextProperty(properties.Title),
    content: extractTextProperty(properties.Content),
    entry_type: mapSelectToEnum(properties["Entry Type"], {
      Personal: "personal",
      Shared: "shared",
      Gratitude: "gratitude",
      "Scene Log": "scene_log",
    }),
    tags: extractMultiSelectProperty(properties.Tags),
  }
}

function transformCalendarPage(properties: Record<string, any>, base: Record<string, any>): Record<string, any> {
  return {
    ...base,
    title: extractTextProperty(properties.Title),
    description: extractTextProperty(properties.Description),
    start_time: extractDateProperty(properties["Start Time"]),
    end_time: extractDateProperty(properties["End Time"]),
    all_day: extractCheckboxProperty(properties["All Day"]),
    location: extractTextProperty(properties.Location),
  }
}

function transformKinksterPage(properties: Record<string, any>, base: Record<string, any>): Record<string, any> {
  return {
    ...base,
    name: extractTextProperty(properties.Name),
    bio: extractTextProperty(properties.Bio),
    backstory: extractTextProperty(properties.Backstory),
    avatar_url: extractUrlProperty(properties["Avatar URL"]),
    dominance: extractNumberProperty(properties.Dominance),
    submission: extractNumberProperty(properties.Submission),
    charisma: extractNumberProperty(properties.Charisma),
    stamina: extractNumberProperty(properties.Stamina),
    creativity: extractNumberProperty(properties.Creativity),
    control: extractNumberProperty(properties.Control),
    appearance_description: extractTextProperty(properties.Appearance),
    kink_interests: extractMultiSelectProperty(properties["Kink Interests"]),
    hard_limits: extractMultiSelectProperty(properties["Hard Limits"]),
    soft_limits: extractMultiSelectProperty(properties["Soft Limits"]),
    personality_traits: extractMultiSelectProperty(properties["Personality Traits"]),
    role_preferences: extractMultiSelectProperty(properties["Role Preferences"]),
    archetype: extractSelectProperty(properties.Archetype),
    is_primary: extractCheckboxProperty(properties["Is Primary"]),
  }
}

function transformIdeaPage(properties: Record<string, any>, base: Record<string, any>): Record<string, any> {
  return {
    ...base,
    title: extractTextProperty(properties.Title),
    description: extractTextProperty(properties.Description),
    category: extractSelectProperty(properties.Category) || "feature",
    priority: mapSelectToEnum(properties.Priority, {
      Low: "low",
      Medium: "medium",
      High: "high",
    }) || "medium",
    status: mapSelectToEnum(properties.Status, {
      New: "new",
      "In Progress": "in_progress",
      Completed: "completed",
      Archived: "archived",
    }) || "new",
    tags: extractMultiSelectProperty(properties.Tags),
  }
}

function transformImageGenerationPage(
  properties: Record<string, any>,
  base: Record<string, any>
): Record<string, any> {
  return {
    ...base,
    prompt: extractTextProperty(properties.Prompt),
    model: extractSelectProperty(properties.Model),
    type: extractSelectProperty(properties.Type),
    aspect_ratio: extractSelectProperty(properties["Aspect Ratio"]),
    tags: extractMultiSelectProperty(properties.Tags),
  }
}

// Helper functions for extracting Notion property values

function extractTextProperty(property: any): string | null {
  if (!property) return null

  if (property.type === "title" && property.title?.[0]) {
    return property.title[0].plain_text || null
  }

  if (property.type === "rich_text" && property.rich_text?.[0]) {
    return property.rich_text[0].plain_text || null
  }

  return null
}

function extractSelectProperty(property: any): string | null {
  if (!property || property.type !== "select") return null
  return property.select?.name || null
}

function extractMultiSelectProperty(property: any): string[] | null {
  if (!property || property.type !== "multi_select") return null
  if (!property.multi_select || property.multi_select.length === 0) return null
  return property.multi_select.map((item: any) => item.name)
}

function extractNumberProperty(property: any): number | null {
  if (!property || property.type !== "number") return null
  return property.number !== null && property.number !== undefined ? property.number : null
}

function extractCheckboxProperty(property: any): boolean | null {
  if (!property || property.type !== "checkbox") return null
  return property.checkbox !== null && property.checkbox !== undefined ? property.checkbox : null
}

function extractDateProperty(property: any): string | null {
  if (!property || property.type !== "date") return null
  if (!property.date) return null
  return property.date.start || null
}

function extractUrlProperty(property: any): string | null {
  if (!property || property.type !== "url") return null
  return property.url || null
}

function mapSelectToEnum(
  property: any,
  mapping: Record<string, string>
): string | null {
  const selectValue = extractSelectProperty(property)
  if (!selectValue) return null
  return mapping[selectValue] || selectValue.toLowerCase()
}
