"use client"

import React, { useState, useMemo } from "react"
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
  CommandSeparator,
} from "@/components/ui/command"
import {
  Image,
  FileText,
  Sparkles,
  Settings,
  Camera,
  Upload,
  Wand2,
  X,
  RefreshCw,
  Layers,
  MessageSquare,
} from "lucide-react"
import { NotionIcon } from "@/components/icons/notion"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { Profile } from "@/types/profile"

interface CommandWindowProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelectCommand?: (command: string, action?: string) => void
  profile?: Profile | null
  hasNotionKey?: boolean
  onClearChat?: () => void
  attachedTools?: string[]
  agentMode?: boolean
}

interface Command {
  id: string
  label: string
  icon: React.ElementType
  shortcut?: string
  category: "chat" | "files" | "images" | "research" | "notion" | "mcp" | "tools" | "settings"
  action?: string
  requiresNotionKey?: boolean
  requiresRole?: "dominant" | "admin"
  description?: string
}

export function CommandWindow({
  open,
  onOpenChange,
  onSelectCommand,
  profile,
  hasNotionKey = false,
  onClearChat,
  attachedTools = [],
  agentMode = false,
}: CommandWindowProps) {
  const [search, setSearch] = useState("")

  const isDomOrAdmin = profile?.dynamic_role === "dominant" || profile?.system_role === "admin"

  const allCommands: Command[] = useMemo(() => {
    const commands: Command[] = [
      // Chat Actions
      {
        id: "clear-chat",
        label: "Clear Chat",
        icon: X,
        category: "chat",
        action: "clear-chat",
        description: "Clear all messages from the current chat",
      },
      {
        id: "refresh-chat",
        label: "Refresh Chat",
        icon: RefreshCw,
        category: "chat",
        action: "refresh-chat",
        description: "Refresh and reload the chat",
      },
      
      // Files
      {
        id: "add-photos",
        label: "Add Photos",
        icon: Camera,
        category: "files",
        action: "add-photos",
        description: "Upload photos to attach to your message",
      },
      {
        id: "add-files",
        label: "Add Files",
        icon: Upload,
        category: "files",
        action: "add-files",
        description: "Upload files to attach to your message",
      },
      {
        id: "upload-document",
        label: "Upload Document",
        icon: FileText,
        category: "files",
        action: "upload-document",
        description: "Upload a document for analysis",
      },
      
      // Images
      {
        id: "create-image",
        label: "Create Image",
        icon: Image,
        category: "images",
        action: "create-image",
        description: "Generate an image using AI",
      },
      {
        id: "edit-image",
        label: "Edit Image",
        icon: Wand2,
        category: "images",
        action: "edit-image",
        description: "Edit an existing image",
      },
      
      // Research Tools - ACTUALLY IMPLEMENTED IN EDGE FUNCTION
      {
        id: "youtube-transcript",
        label: "YouTube Transcript",
        icon: MessageSquare,
        category: "research",
        action: "youtube-transcript",
        description: "Fetch transcript from a YouTube video URL for analysis (with timestamps)",
      },
      
      // Notion Tools (if user has Notion key) - ACTUALLY IMPLEMENTED IN EDGE FUNCTION
      {
        id: "notion-search",
        label: "Search Notion",
        icon: NotionIcon as any,
        category: "notion",
        action: "notion-search",
        requiresNotionKey: true,
        description: "Search your Notion workspace for pages, databases, or content",
      },
      {
        id: "notion-fetch-page",
        label: "Fetch Notion Page",
        icon: NotionIcon as any,
        category: "notion",
        action: "notion-fetch-page",
        requiresNotionKey: true,
        description: "Get full details of a specific Notion page by ID",
      },
      {
        id: "notion-query-database",
        label: "Query Notion Database",
        icon: Layers,
        category: "notion",
        action: "notion-query-database",
        requiresNotionKey: true,
        description: "Query Notion databases (tasks, ideas, kinksters, etc.) with filters",
      },
      {
        id: "notion-create-task",
        label: "Create Notion Task",
        icon: Layers,
        category: "notion",
        action: "notion-create-task",
        requiresNotionKey: true,
        requiresRole: "dominant",
        description: "Create a new task in your Notion Tasks database",
      },
      {
        id: "notion-create-idea",
        label: "Create Notion Idea",
        icon: Sparkles,
        category: "notion",
        action: "notion-create-idea",
        requiresNotionKey: true,
        requiresRole: "dominant",
        description: "Create a new idea in your Notion Ideas database",
      },
      
      // App Context Tools - ACTUALLY IMPLEMENTED IN EDGE FUNCTION
      // Bonds Tools
      {
        id: "query-bonds",
        label: "Query Bonds",
        icon: Layers,
        category: "tools",
        action: "query-bonds",
        description: "Query your bonds (relationships/partnerships) by status or type",
      },
      {
        id: "get-bond-details",
        label: "Get Bond Details",
        icon: Layers,
        category: "tools",
        action: "get-bond-details",
        description: "Get full details of a specific bond",
      },
      {
        id: "create-bond-request",
        label: "Create Bond Request",
        icon: Layers,
        category: "tools",
        action: "create-bond-request",
        description: "Request to join an existing bond",
      },
      
      // Tasks Tools
      {
        id: "query-tasks",
        label: "Query Tasks",
        icon: FileText,
        category: "tools",
        action: "query-tasks",
        description: "Query tasks by status, assignment, or due date",
      },
      {
        id: "get-task-details",
        label: "Get Task Details",
        icon: FileText,
        category: "tools",
        action: "get-task-details",
        description: "Get full details of a specific task",
      },
      {
        id: "create-task",
        label: "Create Task",
        icon: FileText,
        category: "tools",
        action: "create-task",
        requiresRole: "dominant",
        description: "Create a new task (Dominant/Admin only)",
      },
      {
        id: "update-task-status",
        label: "Update Task Status",
        icon: RefreshCw,
        category: "tools",
        action: "update-task-status",
        description: "Update task status (in_progress, completed, etc.)",
      },
      
      // Kinksters Tools
      {
        id: "query-kinksters",
        label: "Query Kinksters",
        icon: Sparkles,
        category: "tools",
        action: "query-kinksters",
        description: "Query your Kinkster characters by name, archetype, or search",
      },
      {
        id: "get-kinkster-details",
        label: "Get Kinkster Details",
        icon: Sparkles,
        category: "tools",
        action: "get-kinkster-details",
        description: "Get full details of a specific Kinkster character",
      },
      {
        id: "create-kinkster",
        label: "Create Kinkster",
        icon: Sparkles,
        category: "tools",
        action: "create-kinkster",
        description: "Create a new Kinkster character profile",
      },
      
      // Phase 2: Journal Tools
      {
        id: "query-journal-entries",
        label: "Query Journal Entries",
        icon: FileText,
        category: "tools",
        action: "query-journal-entries",
        description: "Query journal entries by type, tags, or date range",
      },
      {
        id: "get-journal-entry",
        label: "Get Journal Entry",
        icon: FileText,
        category: "tools",
        action: "get-journal-entry",
        description: "Get full details of a specific journal entry",
      },
      {
        id: "create-journal-entry",
        label: "Create Journal Entry",
        icon: FileText,
        category: "tools",
        action: "create-journal-entry",
        description: "Create a new journal entry",
      },
      
      // Phase 2: Rules Tools
      {
        id: "query-rules",
        label: "Query Rules",
        icon: Layers,
        category: "tools",
        action: "query-rules",
        description: "Query bond rules by status, category, or assignment",
      },
      {
        id: "get-rule-details",
        label: "Get Rule Details",
        icon: Layers,
        category: "tools",
        action: "get-rule-details",
        description: "Get full details of a specific rule",
      },
      {
        id: "create-rule",
        label: "Create Rule",
        icon: Layers,
        category: "tools",
        action: "create-rule",
        requiresRole: "dominant",
        description: "Create a new bond rule (Dominant/Admin only)",
      },
      
      // Phase 2: Calendar Tools
      {
        id: "query-calendar-events",
        label: "Query Calendar Events",
        icon: MessageSquare,
        category: "tools",
        action: "query-calendar-events",
        description: "Query calendar events by type or date range",
      },
      {
        id: "get-calendar-event-details",
        label: "Get Calendar Event Details",
        icon: MessageSquare,
        category: "tools",
        action: "get-calendar-event-details",
        description: "Get full details of a specific calendar event",
      },
      {
        id: "create-calendar-event",
        label: "Create Calendar Event",
        icon: MessageSquare,
        category: "tools",
        action: "create-calendar-event",
        description: "Create a new calendar event",
      },
      
      // Settings
      {
        id: "settings",
        label: "Settings",
        icon: Settings,
        category: "settings",
        action: "settings",
        shortcut: "⌘,",
        description: "Open chat settings",
      },
    ]

    // Filter commands based on permissions and availability
    return commands.filter((cmd) => {
      if (cmd.requiresNotionKey && !hasNotionKey) return false
      if (cmd.requiresRole && !isDomOrAdmin) return false
      return true
    })
  }, [hasNotionKey, isDomOrAdmin])

  const filteredCommands = useMemo(() => {
    if (!search.trim()) return allCommands
    
    const searchLower = search.toLowerCase()
    return allCommands.filter((cmd) =>
      cmd.label.toLowerCase().includes(searchLower) ||
      cmd.description?.toLowerCase().includes(searchLower) ||
      cmd.category.toLowerCase().includes(searchLower)
    )
  }, [allCommands, search])

  const groupedCommands = useMemo(() => {
    return filteredCommands.reduce(
      (acc, cmd) => {
        if (!acc[cmd.category]) {
          acc[cmd.category] = []
        }
        acc[cmd.category].push(cmd)
        return acc
      },
      {} as Record<string, Command[]>
    )
  }, [filteredCommands])

  const categoryLabels: Record<string, string> = {
    chat: "Chat Actions",
    files: "File Uploads",
    images: "Image Generation",
    research: "Research Tools",
    notion: "Notion Integration",
    tools: "App Tools",
    settings: "Settings",
  }

  const categoryOrder: string[] = ["chat", "files", "images", "research", "notion", "tools", "settings"]

  const handleSelect = (command: Command) => {
    // Handle clear/refresh chat directly
    if (command.action === "clear-chat" || command.action === "refresh-chat") {
      if (onClearChat) {
        onClearChat()
      }
    }
    
    onSelectCommand?.(command.id, command.action)
    onOpenChange(false)
    setSearch("")
  }

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Command Palette"
      description="Search for commands, tools, and actions..."
      className="max-w-2xl"
    >
      <CommandInput
        placeholder="Search commands and tools..."
        value={search}
        onValueChange={setSearch}
      />
      <CommandList>
        <CommandEmpty>No commands found.</CommandEmpty>
        {categoryOrder.map((category) => {
          const cmds = groupedCommands[category]
          if (!cmds || cmds.length === 0) return null

          return (
            <React.Fragment key={category}>
              <CommandGroup heading={categoryLabels[category]}>
                {cmds.map((cmd) => {
                  const Icon = cmd.icon
                  // Handle NotionIcon specially since it's a function component
                  const isNotionIcon = Icon === NotionIcon
                  const isAttached = attachedTools.includes(cmd.id)
                  return (
                    <CommandItem
                      key={cmd.id}
                      onSelect={() => handleSelect(cmd)}
                      className={cn(
                        "cursor-pointer",
                        isAttached && "bg-primary/10 border border-primary/20"
                      )}
                      value={`${cmd.label} ${cmd.description || ""}`}
                    >
                      {isNotionIcon ? (
                        <Icon className="h-4 w-4 mr-2 shrink-0" variant="brand" />
                      ) : (
                        <Icon className="h-4 w-4 mr-2 shrink-0" />
                      )}
                      <div className="flex flex-col flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{cmd.label}</span>
                          {isAttached && (
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                              {agentMode ? "Agent" : "One-shot"}
                            </Badge>
                          )}
                        </div>
                        {cmd.description && (
                          <span className="text-xs text-muted-foreground truncate">
                            {cmd.description}
                          </span>
                        )}
                      </div>
                      {cmd.shortcut && (
                        <CommandShortcut>{cmd.shortcut}</CommandShortcut>
                      )}
                    </CommandItem>
                  )
                })}
              </CommandGroup>
              <CommandSeparator />
            </React.Fragment>
          )
        })}
      </CommandList>
    </CommandDialog>
  )
}
