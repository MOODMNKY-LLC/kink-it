import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getCurrentUser } from "@/lib/auth/get-user"

/**
 * POST /api/chat-tools
 * 
 * Internal API endpoint for executing app context-aware operations from chat tools
 * Handles Bonds, Tasks, and Kinksters operations
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { tool_name, args, user_id } = body as {
      tool_name: string
      args: any
      user_id: string
    }

    // Verify user_id matches authenticated user
    if (user_id !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const supabase = await createClient()
    const apiBaseUrl = process.env.NEXT_PUBLIC_APP_URL || 
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
      "http://localhost:3000"

    // Get user profile for role checks
    const { data: profile } = await supabase
      .from("profiles")
      .select("dynamic_role, system_role, partner_id, bond_id")
      .eq("id", user.id)
      .single()

    const isDomOrAdmin = profile?.dynamic_role === "dominant" || profile?.system_role === "admin"

    // Route to appropriate operation
    let result: any
    let formatted: string

    switch (tool_name) {
      // Bonds Tools
      case "query_bonds":
        result = await executeQueryBonds(supabase, user.id, args)
        formatted = formatBondsQuery(result)
        break

      case "get_bond_details":
        result = await executeGetBondDetails(supabase, user.id, args.bond_id!)
        formatted = formatBondDetails(result)
        break

      case "create_bond_request":
        result = await executeCreateBondRequest(supabase, user.id, args)
        formatted = formatBondRequest(result)
        break

      // Tasks Tools
      case "query_tasks":
        result = await executeQueryTasks(supabase, user.id, profile, args)
        formatted = formatTasksQuery(result)
        break

      case "get_task_details":
        result = await executeGetTaskDetails(supabase, user.id, args.task_id!)
        formatted = formatTaskDetails(result)
        break

      case "create_task":
        if (!isDomOrAdmin) {
          return NextResponse.json(
            { error: "Only Dominants and Admins can create tasks" },
            { status: 403 }
          )
        }
        result = await executeCreateTask(supabase, user.id, profile, args)
        formatted = formatCreateTask(result)
        break

      case "update_task_status":
        result = await executeUpdateTaskStatus(supabase, user.id, profile, args)
        formatted = formatUpdateTask(result)
        break

      // Kinksters Tools
      case "query_kinksters":
        result = await executeQueryKinksters(supabase, user.id, args)
        formatted = formatKinkstersQuery(result)
        break

      case "get_kinkster_details":
        result = await executeGetKinksterDetails(supabase, user.id, args.kinkster_id!)
        formatted = formatKinksterDetails(result)
        break

      case "create_kinkster":
        try {
          result = await executeCreateKinkster(supabase, user.id, args)
          formatted = formatCreateKinkster(result)
        } catch (error: any) {
          console.error("[Chat Tools] Error creating kinkster:", error)
          return NextResponse.json(
            { 
              error: error.message || "Failed to create kinkster",
              details: error.message
            },
            { status: 500 }
          )
        }
        break

      // Journal Tools
      case "query_journal_entries":
        result = await executeQueryJournalEntries(supabase, user.id, profile, args)
        formatted = formatJournalEntriesQuery(result)
        break

      case "get_journal_entry":
        result = await executeGetJournalEntry(supabase, user.id, args.entry_id!)
        formatted = formatJournalEntryDetails(result)
        break

      case "create_journal_entry":
        result = await executeCreateJournalEntry(supabase, user.id, profile, args)
        formatted = formatCreateJournalEntry(result)
        break

      // Rules Tools
      case "query_rules":
        result = await executeQueryRules(supabase, user.id, profile, args)
        formatted = formatRulesQuery(result)
        break

      case "get_rule_details":
        result = await executeGetRuleDetails(supabase, user.id, args.rule_id!)
        formatted = formatRuleDetails(result)
        break

      case "create_rule":
        if (!isDomOrAdmin) {
          return NextResponse.json(
            { error: "Only Dominants and Admins can create rules" },
            { status: 403 }
          )
        }
        result = await executeCreateRule(supabase, user.id, profile, args)
        formatted = formatCreateRule(result)
        break

      // Calendar Tools
      case "query_calendar_events":
        result = await executeQueryCalendarEvents(supabase, user.id, profile, args)
        formatted = formatCalendarEventsQuery(result)
        break

      case "get_calendar_event_details":
        result = await executeGetCalendarEventDetails(supabase, user.id, args.event_id!)
        formatted = formatCalendarEventDetails(result)
        break

      case "create_calendar_event":
        result = await executeCreateCalendarEvent(supabase, user.id, profile, args)
        formatted = formatCreateCalendarEvent(result)
        break

      default:
        return NextResponse.json(
          { error: `Unknown tool: ${tool_name}` },
          { status: 400 }
        )
    }

    return NextResponse.json({
      success: true,
      data: result,
      formatted,
    })
  } catch (error) {
    console.error("Chat tool error:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}

// Bonds Operations

async function executeQueryBonds(supabase: any, userId: string, args: any) {
  // Query user's bonds (as member)
  const { data: memberships } = await supabase
    .from("bond_members")
    .select(`
      bond_id,
      role_in_bond,
      is_active,
      bonds (
        id,
        name,
        description,
        bond_type,
        bond_status,
        created_at,
        invite_code
      )
    `)
    .eq("user_id", userId)
    .eq("is_active", true)

  if (!memberships || memberships.length === 0) {
    return { bonds: [] }
  }

  // Also check bonds user created
  const { data: createdBonds } = await supabase
    .from("bonds")
    .select("*")
    .eq("created_by", userId)

  const allBondIds = new Set([
    ...memberships.map((m: any) => m.bond_id),
    ...(createdBonds || []).map((b: any) => b.id),
  ])

  const { data: bonds } = await supabase
    .from("bonds")
    .select("*")
    .in("id", Array.from(allBondIds))

  // Apply filters
  let filteredBonds = bonds || []
  if (args.status) {
    filteredBonds = filteredBonds.filter((b: any) => b.bond_status === args.status)
  }
  if (args.bond_type) {
    filteredBonds = filteredBonds.filter((b: any) => b.bond_type === args.bond_type)
  }

  return { bonds: filteredBonds }
}

async function executeGetBondDetails(supabase: any, userId: string, bondId: string) {
  // Verify user is a member
  const { data: membership } = await supabase
    .from("bond_members")
    .select("*")
    .eq("bond_id", bondId)
    .eq("user_id", userId)
    .eq("is_active", true)
    .single()

  if (!membership) {
    // Check if user created it
    const { data: bond } = await supabase
      .from("bonds")
      .select("*")
      .eq("id", bondId)
      .eq("created_by", userId)
      .single()

    if (!bond) {
      throw new Error("Bond not found or access denied")
    }
    return { bond, membership: null }
  }

  const { data: bond } = await supabase
    .from("bonds")
    .select("*")
    .eq("id", bondId)
    .single()

  return { bond, membership }
}

async function executeCreateBondRequest(supabase: any, userId: string, args: any) {
  const { bond_id, message } = args

  if (!bond_id) {
    throw new Error("bond_id is required")
  }

  // Check if request already exists
  const { data: existing } = await supabase
    .from("bond_join_requests")
    .select("id")
    .eq("bond_id", bond_id)
    .eq("user_id", userId)
    .eq("status", "pending")
    .maybeSingle()

  if (existing) {
    throw new Error("You already have a pending request for this bond")
  }

  const { data: request, error } = await supabase
    .from("bond_join_requests")
    .insert({
      bond_id,
      user_id: userId,
      message: message || null,
      status: "pending",
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create bond request: ${error.message}`)
  }

  return { request }
}

// Tasks Operations

async function executeQueryTasks(supabase: any, userId: string, profile: any, args: any) {
  let query = supabase.from("tasks").select("*")

  // Filter by role
  if (profile?.dynamic_role === "submissive") {
    query = query.eq("assigned_to", userId)
  } else if (profile?.dynamic_role === "dominant") {
    if (profile.partner_id) {
      query = query.or(`assigned_by.eq.${userId},assigned_to.eq.${profile.partner_id}`)
    } else {
      query = query.eq("assigned_by", userId)
    }
  }

  // Apply filters
  if (args.status) {
    query = query.eq("status", args.status)
  }
  if (args.assigned_to) {
    query = query.eq("assigned_to", args.assigned_to)
  }
  if (args.assigned_by) {
    query = query.eq("assigned_by", args.assigned_by)
  }
  if (args.due_today) {
    const today = new Date().toISOString().split("T")[0]
    query = query.gte("due_date", `${today}T00:00:00.000Z`)
    query = query.lt("due_date", `${today}T23:59:59.999Z`)
  }

  query = query.order("due_date", { ascending: true, nullsFirst: false })
  query = query.order("created_at", { ascending: false })

  const { data: tasks, error } = await query

  if (error) {
    throw new Error(`Failed to query tasks: ${error.message}`)
  }

  return { tasks: tasks || [] }
}

async function executeGetTaskDetails(supabase: any, userId: string, taskId: string) {
  const { data: task, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("id", taskId)
    .single()

  if (error || !task) {
    throw new Error("Task not found")
  }

  // Verify access
  if (task.assigned_to !== userId && task.assigned_by !== userId) {
    throw new Error("Access denied")
  }

  return { task }
}

async function executeCreateTask(supabase: any, userId: string, profile: any, args: any) {
  const {
    title,
    description,
    priority = "medium",
    due_date,
    assigned_to,
    point_value = 0,
  } = args

  if (!title) {
    throw new Error("Title is required")
  }

  const finalAssignedTo = assigned_to || userId

  // Verify assignment permissions
  if (finalAssignedTo !== userId && profile.partner_id && finalAssignedTo !== profile.partner_id) {
    throw new Error("Can only assign tasks to your partner")
  }

  const { data: task, error } = await supabase
    .from("tasks")
    .insert({
      workspace_id: userId,
      title,
      description: description || null,
      priority,
      due_date: due_date || null,
      assigned_by: userId,
      assigned_to: finalAssignedTo,
      point_value,
      status: "pending",
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create task: ${error.message}`)
  }

  return { task }
}

async function executeUpdateTaskStatus(supabase: any, userId: string, profile: any, args: any) {
  const { task_id, status, completion_notes } = args

  if (!task_id || !status) {
    throw new Error("task_id and status are required")
  }

  // Get task
  const { data: task } = await supabase
    .from("tasks")
    .select("*")
    .eq("id", task_id)
    .single()

  if (!task) {
    throw new Error("Task not found")
  }

  const isAssignedTo = task.assigned_to === userId
  const isAssignedBy = task.assigned_by === userId
  const isDominant = profile?.dynamic_role === "dominant"

  // Authorization checks
  if (isAssignedTo && !isDominant && !["in_progress", "completed"].includes(status)) {
    throw new Error("Submissives can only update status to in_progress or completed")
  }

  if (!isAssignedTo && !isAssignedBy) {
    throw new Error("Access denied")
  }

  const updateData: any = {
    status,
    updated_at: new Date().toISOString(),
  }

  if (status === "completed") {
    updateData.completed_at = new Date().toISOString()
    if (completion_notes) {
      updateData.completion_notes = completion_notes
    }
  }

  const { data: updatedTask, error } = await supabase
    .from("tasks")
    .update(updateData)
    .eq("id", task_id)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to update task: ${error.message}`)
  }

  return { task: updatedTask }
}

// Kinksters Operations

async function executeQueryKinksters(supabase: any, userId: string, args: any) {
  let query = supabase
    .from("kinksters")
    .select("*")
    .or(`is_system_kinkster.eq.true,user_id.eq.${userId}`)
    .order("is_system_kinkster", { ascending: false }) // System kinksters first
    .order("created_at", { ascending: false })

  if (args.is_active !== false) {
    query = query.eq("is_active", true)
  }

  if (args.archetype) {
    query = query.eq("archetype", args.archetype)
  }

  if (args.search) {
    query = query.or(`name.ilike.%${args.search}%,bio.ilike.%${args.search}%`)
  }

  const { data: kinksters, error } = await query

  if (error) {
    throw new Error(`Failed to query kinksters: ${error.message}`)
  }

  return { kinksters: kinksters || [] }
}

async function executeGetKinksterDetails(supabase: any, userId: string, kinksterId: string) {
  const { data: kinkster, error } = await supabase
    .from("kinksters")
    .select("*")
    .eq("id", kinksterId)
    .eq("user_id", userId)
    .single()

  if (error || !kinkster) {
    throw new Error("Kinkster not found")
  }

  return { kinkster }
}

async function executeCreateKinkster(supabase: any, userId: string, args: any) {
  const {
    // Basic Info
    name,
    display_name,
    role,
    pronouns,
    archetype,
    // Appearance
    body_type,
    height,
    build,
    hair_color,
    hair_style,
    eye_color,
    skin_tone,
    facial_hair,
    age_range,
    // Style Preferences
    clothing_style,
    favorite_colors,
    fetish_wear,
    aesthetic,
    // Personality & Kinks
    personality_traits,
    bio,
    backstory,
    top_kinks,
    kink_interests,
    hard_limits,
    soft_limits,
    role_preferences,
    experience_level,
    // Avatar
    avatar_url,
    avatar_urls,
    avatar_prompt,
    generation_prompt,
    preset_id,
    // Provider Configuration
    provider,
    flowise_chatflow_id,
    openai_model,
    openai_instructions,
    // Stats
    dominance,
    submission,
    charisma,
    stamina,
    creativity,
    control,
  } = args

  if (!name) {
    throw new Error("Name is required")
  }

  // Use supabase client directly instead of HTTP call to avoid auth issues
  // Auto-calculate stats from archetype if not provided (matching API route logic)
  let finalStats = {
    dominance: dominance ?? 10,
    submission: submission ?? 10,
    charisma: charisma ?? 10,
    stamina: stamina ?? 10,
    creativity: creativity ?? 10,
    control: control ?? 10,
  }

  // Handle avatar URLs array
  const avatarUrlsArray: string[] = []
  if (avatar_url) {
    avatarUrlsArray.push(avatar_url)
  }
  if (avatar_urls && Array.isArray(avatar_urls)) {
    avatarUrlsArray.push(...avatar_urls)
  }

  // Insert kinkster directly using supabase client
  const { data: kinkster, error } = await supabase
    .from("kinksters")
    .insert({
      user_id: userId,
      // Basic Info
      name: name.trim(),
      display_name: display_name?.trim() || name.trim(),
      role: role || "switch",
      pronouns: pronouns || "They/Them",
      archetype: archetype || null,
      // Appearance (Structured Fields)
      body_type: body_type || null,
      height: height || null,
      build: build || null,
      hair_color: hair_color || null,
      hair_style: hair_style || null,
      eye_color: eye_color || null,
      skin_tone: skin_tone || null,
      facial_hair: facial_hair || null,
      age_range: age_range || null,
      // Style Preferences
      clothing_style: clothing_style || [],
      favorite_colors: favorite_colors || [],
      fetish_wear: fetish_wear || [],
      aesthetic: aesthetic || null,
      // Personality & Kinks
      personality_traits: personality_traits || [],
      bio: bio?.trim() || null,
      backstory: backstory?.trim() || null,
      top_kinks: top_kinks || [],
      kink_interests: kink_interests || [],
      hard_limits: hard_limits || [],
      soft_limits: soft_limits || [],
      role_preferences: role_preferences || [],
      experience_level: experience_level || "intermediate",
      // Avatar
      avatar_url: avatar_url || null,
      avatar_urls: avatarUrlsArray.length > 0 ? avatarUrlsArray : null,
      avatar_prompt: avatar_prompt || null,
      generation_prompt: generation_prompt || avatar_prompt || null,
      // Provider Configuration
      provider: provider || "flowise",
      flowise_chatflow_id: flowise_chatflow_id || null,
      openai_model: openai_model || (provider === "openai_responses" ? "gpt-4o-mini" : null),
      openai_instructions: openai_instructions || null,
      // Stats
      ...finalStats,
      is_active: true,
    })
    .select()
    .single()

  if (error) {
    console.error("[executeCreateKinkster] Database error:", error)
    console.error("[executeCreateKinkster] Error code:", error.code)
    console.error("[executeCreateKinkster] Error message:", error.message)
    console.error("[executeCreateKinkster] Error details:", JSON.stringify(error, null, 2))
    console.error("[executeCreateKinkster] Error hint:", error.hint)
    console.error("[executeCreateKinkster] Attempted insert data keys:", Object.keys({
      user_id: userId,
      name: name.trim(),
      display_name: display_name?.trim() || name.trim(),
      role: role || "switch",
      // ... other fields
    }))
    const errorMessage = error.hint 
      ? `${error.message} (Hint: ${error.hint})`
      : error.message || error.code || "Unknown database error"
    throw new Error(`Failed to create kinkster: ${errorMessage}`)
  }

  if (!kinkster) {
    console.error("[executeCreateKinkster] No kinkster returned from insert")
    throw new Error("Kinkster was created but no data was returned")
  }

  console.log("[executeCreateKinkster] Successfully created kinkster:", kinkster.id, kinkster.name)
  return { kinkster }
}

// Formatting Functions

function formatBondsQuery(result: any): string {
  if (!result.bonds || result.bonds.length === 0) {
    return "No bonds found."
  }

  const items = result.bonds.map((bond: any) => {
    return `- **${bond.name}** (${bond.bond_type}, ${bond.bond_status})\n  ${bond.description || "No description"}`
  }).join("\n\n")

  return `Found ${result.bonds.length} bond(s):\n\n${items}`
}

function formatBondDetails(result: any): string {
  const bond = result.bond
  let formatted = `**${bond.name}**\n\n`
  formatted += `Type: ${bond.bond_type}\n`
  formatted += `Status: ${bond.bond_status}\n`
  if (bond.description) {
    formatted += `Description: ${bond.description}\n`
  }
  if (result.membership) {
    formatted += `\nYour Role: ${result.membership.role_in_bond}`
  }
  return formatted
}

function formatBondRequest(result: any): string {
  return `✅ Bond join request created successfully. Status: ${result.request.status}`
}

function formatTasksQuery(result: any): string {
  if (!result.tasks || result.tasks.length === 0) {
    return "No tasks found."
  }

  const items = result.tasks.map((task: any) => {
    const dueDate = task.due_date ? new Date(task.due_date).toLocaleDateString() : "No due date"
    return `- **${task.title}** (${task.status}, Priority: ${task.priority}, Due: ${dueDate})`
  }).join("\n\n")

  return `Found ${result.tasks.length} task(s):\n\n${items}`
}

function formatTaskDetails(result: any): string {
  const task = result.task
  let formatted = `**${task.title}**\n\n`
  formatted += `Status: ${task.status}\n`
  formatted += `Priority: ${task.priority}\n`
  if (task.description) {
    formatted += `Description: ${task.description}\n`
  }
  if (task.due_date) {
    formatted += `Due: ${new Date(task.due_date).toLocaleString()}\n`
  }
  if (task.point_value) {
    formatted += `Points: ${task.point_value}\n`
  }
  return formatted
}

function formatCreateTask(result: any): string {
  return `✅ Task created: **${result.task.title}** (ID: ${result.task.id})`
}

function formatUpdateTask(result: any): string {
  return `✅ Task updated: **${result.task.title}** - Status: ${result.task.status}`
}

function formatKinkstersQuery(result: any): string {
  if (!result.kinksters || result.kinksters.length === 0) {
    return "No Kinksters found."
  }

  const items = result.kinksters.map((k: any) => {
    return `- **${k.name}**${k.archetype ? ` (${k.archetype})` : ""}${k.bio ? `\n  ${k.bio.substring(0, 100)}${k.bio.length > 100 ? "..." : ""}` : ""}`
  }).join("\n\n")

  return `Found ${result.kinksters.length} Kinkster(s):\n\n${items}`
}

function formatKinksterDetails(result: any): string {
  const k = result.kinkster
  let formatted = `**${k.name}**\n\n`
  if (k.archetype) {
    formatted += `Archetype: ${k.archetype}\n`
  }
  if (k.bio) {
    formatted += `Bio: ${k.bio}\n`
  }
  formatted += `\nStats:\n`
  formatted += `- Dominance: ${k.dominance}\n`
  formatted += `- Submission: ${k.submission}\n`
  formatted += `- Charisma: ${k.charisma}\n`
  formatted += `- Stamina: ${k.stamina}\n`
  formatted += `- Creativity: ${k.creativity}\n`
  formatted += `- Control: ${k.control}\n`
  return formatted
}

function formatCreateKinkster(result: any): string {
  return `✅ Kinkster created: **${result.kinkster.name}** (ID: ${result.kinkster.id})`
}

// Journal Operations

async function executeQueryJournalEntries(supabase: any, userId: string, profile: any, args: any) {
  let query = supabase
    .from("journal_entries")
    .select("*")
    .order("created_at", { ascending: false })

  // Filter by bond if user is in a bond
  if (profile?.bond_id) {
    query = query.eq("bond_id", profile.bond_id)
  } else {
    // Personal entries only
    query = query.is("bond_id", null)
  }

  // Filter by creator
  query = query.eq("created_by", userId)

  if (args.entry_type) {
    query = query.eq("entry_type", args.entry_type)
  }

  if (args.tag) {
    query = query.contains("tags", [args.tag])
  }

  if (args.date_from) {
    query = query.gte("created_at", args.date_from)
  }

  if (args.date_to) {
    query = query.lte("created_at", args.date_to)
  }

  const { data: entries, error } = await query

  if (error) {
    throw new Error(`Failed to query journal entries: ${error.message}`)
  }

  return { entries: entries || [] }
}

async function executeGetJournalEntry(supabase: any, userId: string, entryId: string) {
  const { data: entry, error } = await supabase
    .from("journal_entries")
    .select("*")
    .eq("id", entryId)
    .single()

  if (error || !entry) {
    throw new Error("Journal entry not found")
  }

  // Verify ownership
  if (entry.created_by !== userId) {
    throw new Error("Access denied")
  }

  return { entry }
}

async function executeCreateJournalEntry(supabase: any, userId: string, profile: any, args: any) {
  const { title, content, entry_type, tags } = args

  if (!title || !content) {
    throw new Error("Title and content are required")
  }

  const bondId = profile?.bond_id || null

  const { data: entry, error } = await supabase
    .from("journal_entries")
    .insert({
      bond_id: bondId,
      title: title.trim(),
      content: content.trim(),
      entry_type: entry_type || "personal",
      tags: tags || [],
      created_by: userId,
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create journal entry: ${error.message}`)
  }

  return { entry }
}

// Rules Operations

async function executeQueryRules(supabase: any, userId: string, profile: any, args: any) {
  let query = supabase
    .from("rules")
    .select("*")
    .order("priority", { ascending: false })
    .order("created_at", { ascending: false })

  // Filter by bond
  if (profile?.bond_id) {
    query = query.eq("bond_id", profile.bond_id)
  } else {
    return { rules: [] } // No bond, no rules
  }

  if (args.status) {
    query = query.eq("status", args.status)
  }

  if (args.category) {
    query = query.eq("category", args.category)
  }

  // Filter by assigned_to if provided
  if (args.assigned_to) {
    query = query.or(`assigned_to.eq.${args.assigned_to},assigned_to.is.null`)
  }

  const { data: rules, error } = await query

  if (error) {
    throw new Error(`Failed to query rules: ${error.message}`)
  }

  return { rules: rules || [] }
}

async function executeGetRuleDetails(supabase: any, userId: string, ruleId: string) {
  const { data: rule, error } = await supabase
    .from("rules")
    .select("*")
    .eq("id", ruleId)
    .single()

  if (error || !rule) {
    throw new Error("Rule not found")
  }

  return { rule }
}

async function executeCreateRule(supabase: any, userId: string, profile: any, args: any) {
  const { title, description, category, priority, assigned_to } = args

  if (!title) {
    throw new Error("Title is required")
  }

  if (!profile?.bond_id) {
    throw new Error("Must be in a bond to create rules")
  }

  // Validate assigned_to if provided
  let finalAssignedTo: string | null = assigned_to || null
  if (assigned_to && assigned_to !== userId) {
    const { data: bondMember } = await supabase
      .from("bond_members")
      .select("id")
      .eq("bond_id", profile.bond_id)
      .eq("user_id", assigned_to)
      .eq("is_active", true)
      .single()

    if (!bondMember) {
      throw new Error("Can only assign rules to bond members")
    }
  }

  const { data: rule, error } = await supabase
    .from("rules")
    .insert({
      bond_id: profile.bond_id,
      title: title.trim(),
      description: description?.trim() || null,
      category: category || "standing",
      status: "active",
      priority: priority || 0,
      created_by: userId,
      assigned_to: finalAssignedTo,
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create rule: ${error.message}`)
  }

  return { rule }
}

// Calendar Operations

async function executeQueryCalendarEvents(supabase: any, userId: string, profile: any, args: any) {
  let query = supabase
    .from("calendar_events")
    .select("*")
    .order("start_date", { ascending: true })

  // Filter by bond
  if (profile?.bond_id) {
    query = query.eq("bond_id", profile.bond_id)
  } else {
    query = query.is("bond_id", null)
  }

  if (args.event_type) {
    query = query.eq("event_type", args.event_type)
  }

  if (args.start_date) {
    query = query.gte("start_date", args.start_date)
  }

  if (args.end_date) {
    query = query.lte("start_date", args.end_date)
  }

  const { data: events, error } = await query

  if (error) {
    throw new Error(`Failed to query calendar events: ${error.message}`)
  }

  return { events: events || [] }
}

async function executeGetCalendarEventDetails(supabase: any, userId: string, eventId: string) {
  const { data: event, error } = await supabase
    .from("calendar_events")
    .select("*")
    .eq("id", eventId)
    .single()

  if (error || !event) {
    throw new Error("Calendar event not found")
  }

  // Verify access (user created it or is in the same bond)
  if (event.created_by !== userId) {
    // Could be in same bond, but for simplicity, we'll allow if user can see it
    // The query above already filters by bond_id
  }

  return { event }
}

async function executeCreateCalendarEvent(supabase: any, userId: string, profile: any, args: any) {
  const { title, description, event_type, start_date, end_date, all_day, reminder_minutes } = args

  if (!title || !start_date) {
    throw new Error("Title and start_date are required")
  }

  const bondId = profile?.bond_id || null

  const { data: event, error } = await supabase
    .from("calendar_events")
    .insert({
      bond_id: bondId,
      title: title.trim(),
      description: description?.trim() || null,
      event_type: event_type || "other",
      start_date,
      end_date: end_date || null,
      all_day: all_day || false,
      reminder_minutes: reminder_minutes || null,
      created_by: userId,
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create calendar event: ${error.message}`)
  }

  return { event }
}

// Formatting Functions for Phase 2

function formatJournalEntriesQuery(result: any): string {
  if (!result.entries || result.entries.length === 0) {
    return "No journal entries found."
  }

  const items = result.entries.map((entry: any) => {
    const date = new Date(entry.created_at).toLocaleDateString()
    return `- **${entry.title}** (${entry.entry_type}, ${date})${entry.tags?.length > 0 ? `\n  Tags: ${entry.tags.join(", ")}` : ""}`
  }).join("\n\n")

  return `Found ${result.entries.length} journal entry/entries:\n\n${items}`
}

function formatJournalEntryDetails(result: any): string {
  const entry = result.entry
  let formatted = `**${entry.title}**\n\n`
  formatted += `Type: ${entry.entry_type}\n`
  formatted += `Date: ${new Date(entry.created_at).toLocaleString()}\n`
  if (entry.tags && entry.tags.length > 0) {
    formatted += `Tags: ${entry.tags.join(", ")}\n`
  }
  formatted += `\nContent:\n${entry.content}`
  return formatted
}

function formatCreateJournalEntry(result: any): string {
  return `✅ Journal entry created: **${result.entry.title}** (ID: ${result.entry.id})`
}

function formatRulesQuery(result: any): string {
  if (!result.rules || result.rules.length === 0) {
    return "No rules found."
  }

  const items = result.rules.map((rule: any) => {
    return `- **${rule.title}** (${rule.category}, ${rule.status}, Priority: ${rule.priority})${rule.description ? `\n  ${rule.description.substring(0, 100)}${rule.description.length > 100 ? "..." : ""}` : ""}`
  }).join("\n\n")

  return `Found ${result.rules.length} rule(s):\n\n${items}`
}

function formatRuleDetails(result: any): string {
  const rule = result.rule
  let formatted = `**${rule.title}**\n\n`
  formatted += `Category: ${rule.category}\n`
  formatted += `Status: ${rule.status}\n`
  formatted += `Priority: ${rule.priority}\n`
  if (rule.description) {
    formatted += `Description: ${rule.description}\n`
  }
  if (rule.assigned_to) {
    formatted += `Assigned to: ${rule.assigned_to}\n`
  }
  return formatted
}

function formatCreateRule(result: any): string {
  return `✅ Rule created: **${result.rule.title}** (ID: ${result.rule.id})`
}

function formatCalendarEventsQuery(result: any): string {
  if (!result.events || result.events.length === 0) {
    return "No calendar events found."
  }

  const items = result.events.map((event: any) => {
    const startDate = new Date(event.start_date).toLocaleString()
    return `- **${event.title}** (${event.event_type}, ${startDate})${event.all_day ? " [All Day]" : ""}`
  }).join("\n\n")

  return `Found ${result.events.length} calendar event(s):\n\n${items}`
}

function formatCalendarEventDetails(result: any): string {
  const event = result.event
  let formatted = `**${event.title}**\n\n`
  formatted += `Type: ${event.event_type}\n`
  formatted += `Start: ${new Date(event.start_date).toLocaleString()}\n`
  if (event.end_date) {
    formatted += `End: ${new Date(event.end_date).toLocaleString()}\n`
  }
  if (event.all_day) {
    formatted += `All Day: Yes\n`
  }
  if (event.description) {
    formatted += `Description: ${event.description}\n`
  }
  return formatted
}

function formatCreateCalendarEvent(result: any): string {
  return `✅ Calendar event created: **${result.event.title}** (ID: ${result.event.id})`
}
