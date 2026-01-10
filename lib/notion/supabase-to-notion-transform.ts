/**
 * Supabase to Notion Transformation
 * 
 * Transforms Supabase records to Notion page properties format
 * This is the reverse of data-transformation.ts
 * Used when syncing Supabase data back to Notion
 */

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
 * Transforms a Supabase record to Notion properties format
 */
export function transformSupabaseToNotionProperties(
  record: Record<string, any>,
  databaseType: DatabaseType
): Record<string, any> {
  const properties: Record<string, any> = {}

  switch (databaseType) {
    case "tasks":
      return transformTaskToNotion(record, properties)
    case "rules":
      return transformRuleToNotion(record, properties)
    case "contracts":
      return transformContractToNotion(record, properties)
    case "journal":
      return transformJournalToNotion(record, properties)
    case "calendar":
      return transformCalendarToNotion(record, properties)
    case "kinksters":
      return transformKinksterToNotion(record, properties)
    case "app_ideas":
      return transformIdeaToNotion(record, properties)
    case "image_generations":
      return transformImageGenerationToNotion(record, properties)
    default:
      return properties
  }
}

function transformTaskToNotion(
  record: Record<string, any>,
  properties: Record<string, any>
): Record<string, any> {
  // Title
  if (record.title) {
    properties.Title = {
      title: [{ text: { content: record.title } }],
    }
  }

  // Description
  if (record.description) {
    properties.Description = {
      rich_text: [{ text: { content: record.description } }],
    }
  }

  // Priority
  if (record.priority) {
    const priorityMap: Record<string, string> = {
      low: "Low",
      medium: "Medium",
      high: "High",
      urgent: "Urgent",
    }
    properties.Priority = {
      select: { name: priorityMap[record.priority] || "Medium" },
    }
  }

  // Status
  if (record.status) {
    const statusMap: Record<string, string> = {
      pending: "Pending",
      in_progress: "In Progress",
      completed: "Completed",
      approved: "Approved",
      cancelled: "Cancelled",
    }
    properties.Status = {
      select: { name: statusMap[record.status] || "Pending" },
    }
  }

  // Due Date
  if (record.due_date) {
    properties["Due Date"] = {
      date: { start: new Date(record.due_date).toISOString() },
    }
  }

  // Point Value
  if (record.point_value !== null && record.point_value !== undefined) {
    properties["Point Value"] = {
      number: record.point_value,
    }
  }

  // Proof Required
  if (record.proof_required !== null && record.proof_required !== undefined) {
    properties["Proof Required"] = {
      checkbox: record.proof_required,
    }
  }

  // Proof Type
  if (record.proof_type) {
    const proofTypeMap: Record<string, string> = {
      photo: "Photo",
      video: "Video",
      text: "Text",
    }
    properties["Proof Type"] = {
      select: { name: proofTypeMap[record.proof_type] || record.proof_type },
    }
  }

  // Completed At
  if (record.completed_at) {
    properties["Completed At"] = {
      date: { start: new Date(record.completed_at).toISOString() },
    }
  }

  // Approved At
  if (record.approved_at) {
    properties["Approved At"] = {
      date: { start: new Date(record.approved_at).toISOString() },
    }
  }

  // Completion Notes
  if (record.completion_notes) {
    properties["Completion Notes"] = {
      rich_text: [{ text: { content: record.completion_notes } }],
    }
  }

  return properties
}

function transformRuleToNotion(
  record: Record<string, any>,
  properties: Record<string, any>
): Record<string, any> {
  // Title
  if (record.title) {
    properties.Title = {
      title: [{ text: { content: record.title } }],
    }
  }

  // Description
  if (record.description) {
    properties.Description = {
      rich_text: [{ text: { content: record.description } }],
    }
  }

  // Rule Type
  if (record.category) {
    const categoryMap: Record<string, string> = {
      standing: "Standing",
      situational: "Situational",
      temporary: "Temporary",
      protocol: "Optional",
    }
    properties["Rule Type"] = {
      select: { name: categoryMap[record.category] || "Standing" },
    }
  }

  // Active (checkbox)
  if (record.status !== null && record.status !== undefined) {
    properties.Active = {
      checkbox: record.status === "active",
    }
  }

  // Effective From
  if (record.effective_from) {
    properties["Effective From"] = {
      date: { start: new Date(record.effective_from).toISOString() },
    }
  }

  // Effective Until
  if (record.effective_until) {
    properties["Effective Until"] = {
      date: { start: new Date(record.effective_until).toISOString() },
    }
  }

  return properties
}

function transformContractToNotion(
  record: Record<string, any>,
  properties: Record<string, any>
): Record<string, any> {
  // Title
  if (record.title) {
    properties.Title = {
      title: [{ text: { content: record.title } }],
    }
  }

  // Content
  if (record.content) {
    properties.Content = {
      rich_text: [{ text: { content: record.content } }],
    }
  }

  // Status
  if (record.status) {
    const statusMap: Record<string, string> = {
      draft: "Draft",
      pending_signature: "Pending Signature",
      active: "Active",
      archived: "Archived",
      superseded: "Superseded",
    }
    properties.Status = {
      select: { name: statusMap[record.status] || "Draft" },
    }
  }

  // Version
  if (record.version !== null && record.version !== undefined) {
    properties.Version = {
      number: record.version || 1,
    }
  }

  // Effective From
  if (record.effective_from) {
    properties["Effective From"] = {
      date: { start: new Date(record.effective_from).toISOString() },
    }
  }

  // Effective Until
  if (record.effective_until) {
    properties["Effective Until"] = {
      date: { start: new Date(record.effective_until).toISOString() },
    }
  }

  return properties
}

function transformJournalToNotion(
  record: Record<string, any>,
  properties: Record<string, any>
): Record<string, any> {
  // Title
  if (record.title) {
    properties.Title = {
      title: [{ text: { content: record.title } }],
    }
  }

  // Content
  if (record.content) {
    properties.Content = {
      rich_text: [{ text: { content: record.content } }],
    }
  }

  // Entry Type
  if (record.entry_type) {
    const entryTypeMap: Record<string, string> = {
      personal: "Personal",
      shared: "Shared",
      gratitude: "Gratitude",
      scene_log: "Scene Log",
    }
    properties["Entry Type"] = {
      select: { name: entryTypeMap[record.entry_type] || "Personal" },
    }
  }

  // Tags
  if (record.tags && Array.isArray(record.tags) && record.tags.length > 0) {
    const sanitizedTags = record.tags
      .map((tag: string) => tag.replace(/,/g, "").trim())
      .filter((tag: string) => tag.length > 0)

    if (sanitizedTags.length > 0) {
      properties.Tags = {
        multi_select: sanitizedTags.map((tag: string) => ({ name: tag })),
      }
    }
  }

  return properties
}

function transformCalendarToNotion(
  record: Record<string, any>,
  properties: Record<string, any>
): Record<string, any> {
  // Title
  if (record.title) {
    properties.Title = {
      title: [{ text: { content: record.title } }],
    }
  }

  // Description
  if (record.description) {
    properties.Description = {
      rich_text: [{ text: { content: record.description } }],
    }
  }

  // Start Time
  if (record.start_time) {
    properties["Start Time"] = {
      date: { start: new Date(record.start_time).toISOString() },
    }
  }

  // End Time
  if (record.end_time) {
    properties["End Time"] = {
      date: { start: new Date(record.end_time).toISOString() },
    }
  }

  // All Day
  if (record.all_day !== null && record.all_day !== undefined) {
    properties["All Day"] = {
      checkbox: record.all_day,
    }
  }

  // Location
  if (record.location) {
    properties.Location = {
      rich_text: [{ text: { content: record.location } }],
    }
  }

  return properties
}

function transformKinksterToNotion(
  record: Record<string, any>,
  properties: Record<string, any>
): Record<string, any> {
  // Name
  if (record.name) {
    properties.Name = {
      title: [{ text: { content: record.name } }],
    }
  }

  // Bio
  if (record.bio) {
    properties.Bio = {
      rich_text: [{ text: { content: record.bio } }],
    }
  }

  // Backstory
  if (record.backstory) {
    properties.Backstory = {
      rich_text: [{ text: { content: record.backstory } }],
    }
  }

  // Avatar URL
  if (record.avatar_url) {
    properties["Avatar URL"] = {
      url: record.avatar_url,
    }
  }

  // Stats
  const stats = [
    "dominance",
    "submission",
    "charisma",
    "stamina",
    "creativity",
    "control",
  ]
  for (const stat of stats) {
    if (record[stat] !== null && record[stat] !== undefined) {
      const statName = stat.charAt(0).toUpperCase() + stat.slice(1)
      properties[statName] = {
        number: record[stat],
      }
    }
  }

  // Appearance
  if (record.appearance_description) {
    properties.Appearance = {
      rich_text: [{ text: { content: record.appearance_description } }],
    }
  }

  // Multi-select fields
  const multiSelectFields = [
    "kink_interests",
    "hard_limits",
    "soft_limits",
    "personality_traits",
    "role_preferences",
  ]
  const fieldNameMap: Record<string, string> = {
    kink_interests: "Kink Interests",
    hard_limits: "Hard Limits",
    soft_limits: "Soft Limits",
    personality_traits: "Personality Traits",
    role_preferences: "Role Preferences",
  }

  for (const field of multiSelectFields) {
    if (record[field] && Array.isArray(record[field]) && record[field].length > 0) {
      const sanitized = record[field]
        .map((item: string) => item.replace(/,/g, "").trim())
        .filter((item: string) => item.length > 0)

      if (sanitized.length > 0) {
        properties[fieldNameMap[field]] = {
          multi_select: sanitized.map((item: string) => ({ name: item })),
        }
      }
    }
  }

  // Archetype
  if (record.archetype) {
    properties.Archetype = {
      select: { name: record.archetype },
    }
  }

  // Is Primary
  if (record.is_primary !== null && record.is_primary !== undefined) {
    properties["Is Primary"] = {
      checkbox: record.is_primary,
    }
  }

  return properties
}

function transformIdeaToNotion(
  record: Record<string, any>,
  properties: Record<string, any>
): Record<string, any> {
  // Title
  if (record.title) {
    properties.Title = {
      title: [{ text: { content: record.title } }],
    }
  }

  // Description
  if (record.description) {
    properties.Description = {
      rich_text: [{ text: { content: record.description } }],
    }
  }

  // Category
  if (record.category) {
    properties.Category = {
      select: { name: record.category },
    }
  }

  // Priority
  if (record.priority) {
    const priorityMap: Record<string, string> = {
      low: "Low",
      medium: "Medium",
      high: "High",
    }
    properties.Priority = {
      select: { name: priorityMap[record.priority] || "Medium" },
    }
  }

  // Status
  if (record.status) {
    const statusMap: Record<string, string> = {
      new: "New",
      in_progress: "In Progress",
      completed: "Completed",
      archived: "Archived",
    }
    properties.Status = {
      select: { name: statusMap[record.status] || "New" },
    }
  }

  // Tags
  if (record.tags && Array.isArray(record.tags) && record.tags.length > 0) {
    const sanitizedTags = record.tags
      .map((tag: string) => tag.replace(/,/g, "").trim())
      .filter((tag: string) => tag.length > 0)

    if (sanitizedTags.length > 0) {
      properties.Tags = {
        multi_select: sanitizedTags.map((tag: string) => ({ name: tag })),
      }
    }
  }

  return properties
}

function transformImageGenerationToNotion(
  record: Record<string, any>,
  properties: Record<string, any>
): Record<string, any> {
  // Prompt
  if (record.prompt) {
    properties.Prompt = {
      rich_text: [{ text: { content: record.prompt } }],
    }
  }

  // Model
  if (record.model) {
    properties.Model = {
      select: { name: record.model },
    }
  }

  // Type
  if (record.type) {
    properties.Type = {
      select: { name: record.type },
    }
  }

  // Aspect Ratio
  if (record.aspect_ratio) {
    properties["Aspect Ratio"] = {
      select: { name: record.aspect_ratio },
    }
  }

  // Tags
  if (record.tags && Array.isArray(record.tags) && record.tags.length > 0) {
    const sanitizedTags = record.tags
      .map((tag: string) => tag.replace(/,/g, "").trim())
      .filter((tag: string) => tag.length > 0)

    if (sanitizedTags.length > 0) {
      properties.Tags = {
        multi_select: sanitizedTags.map((tag: string) => ({ name: tag })),
      }
    }
  }

  return properties
}
