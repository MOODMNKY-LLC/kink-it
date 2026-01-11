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
  Search,
  Sparkles,
  Bot,
  Settings,
  Camera,
  Upload,
  Wand2,
  Zap,
  Brain,
  Code,
  Database,
  RotateCcw,
  X,
  Trash2,
  RefreshCw,
  FileImage,
  Globe,
  BookOpen,
  Layers,
  MessageSquare,
  SquareStack,
  Github,
  FileCode,
  Terminal,
  WandSparkles,
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
      
      // Research
      {
        id: "deep-research",
        label: "Deep Research",
        icon: BookOpen,
        category: "research",
        action: "deep-research",
        description: "Perform comprehensive research on a topic",
      },
      {
        id: "web-search",
        label: "Web Search",
        icon: Globe,
        category: "research",
        action: "web-search",
        description: "Search the web for information",
      },
      {
        id: "youtube-transcript",
        label: "YouTube Transcript",
        icon: MessageSquare,
        category: "research",
        action: "youtube-transcript",
        description: "Get transcript from a YouTube video for analysis",
      },
      
      // Notion Tools (if user has Notion key)
      {
        id: "notion-search",
        label: "Search Notion",
        icon: NotionIcon as any, // Use official Notion icon
        category: "notion",
        action: "notion-search",
        requiresNotionKey: true,
        description: "Search your Notion workspace",
      },
      {
        id: "notion-query-tasks",
        label: "Query Tasks",
        icon: Layers,
        category: "notion",
        action: "notion-query-tasks",
        requiresNotionKey: true,
        description: "Query your Notion tasks database",
      },
      {
        id: "notion-create-task",
        label: "Create Task",
        icon: Layers,
        category: "notion",
        action: "notion-create-task",
        requiresNotionKey: true,
        requiresRole: "dominant",
        description: "Create a new task in Notion",
      },
      {
        id: "notion-query-ideas",
        label: "Query Ideas",
        icon: Sparkles,
        category: "notion",
        action: "notion-query-ideas",
        requiresNotionKey: true,
        description: "Query your Notion ideas database",
      },
      {
        id: "notion-create-idea",
        label: "Create Idea",
        icon: Sparkles,
        category: "notion",
        action: "notion-create-idea",
        requiresNotionKey: true,
        requiresRole: "dominant",
        description: "Create a new idea in Notion",
      },
      
      // MCP Tools
      {
        id: "mcp-agent-mode",
        label: "Agent Mode (MCP)",
        icon: Bot,
        category: "mcp",
        action: "agent-mode",
        shortcut: "⌘A",
        description: "Enable MCP agent mode for advanced tool usage",
      },
      {
        id: "mcp-notion",
        label: "Notion MCP",
        icon: NotionIcon as any, // Use official Notion icon
        category: "mcp",
        action: "mcp-notion",
        requiresNotionKey: true,
        description: "Access Notion via MCP server",
      },
      {
        id: "mcp-github",
        label: "GitHub MCP",
        icon: Github,
        category: "mcp",
        action: "mcp-github",
        description: "Access GitHub via MCP server",
      },
      {
        id: "mcp-supabase",
        label: "Supabase MCP",
        icon: Database,
        category: "mcp",
        action: "mcp-supabase",
        description: "Query Supabase database via MCP",
      },
      {
        id: "mcp-filesystem",
        label: "Filesystem MCP",
        icon: FileCode,
        category: "mcp",
        action: "mcp-filesystem",
        description: "Access filesystem via MCP server",
      },
      {
        id: "mcp-brave-search",
        label: "Brave Search MCP",
        icon: Search,
        category: "mcp",
        action: "mcp-brave-search",
        description: "Search the web using Brave Search MCP",
      },
      {
        id: "mcp-tavily",
        label: "Tavily Research MCP",
        icon: BookOpen,
        category: "mcp",
        action: "mcp-tavily",
        description: "Deep research using Tavily MCP",
      },
      {
        id: "mcp-firecrawl",
        label: "Firecrawl MCP",
        icon: Globe,
        category: "mcp",
        action: "mcp-firecrawl",
        description: "Scrape and crawl websites via Firecrawl MCP",
      },
      
      // Tools
      {
        id: "code-assistant",
        label: "Code Assistant",
        icon: Code,
        category: "tools",
        action: "code-assistant",
        description: "Get help with code and programming",
      },
      {
        id: "database-query",
        label: "Database Query",
        icon: Database,
        category: "tools",
        action: "database-query",
        description: "Query the database directly",
      },
      {
        id: "terminal",
        label: "Terminal",
        icon: Terminal,
        category: "tools",
        action: "terminal",
        description: "Open terminal interface",
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
    chat: "Chat",
    files: "Files",
    images: "Images",
    research: "Research",
    notion: "Notion",
    mcp: "MCP Tools",
    tools: "Tools",
    settings: "Settings",
  }

  const categoryOrder: string[] = ["chat", "files", "images", "research", "notion", "mcp", "tools", "settings"]

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
        placeholder="Search commands, tools, MCP functions..."
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
