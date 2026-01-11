/**
 * Tool Selector Component
 * 
 * Allows users to select which tools should be available for the AI agent
 */

"use client"

import React, { useState } from "react"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Wrench, Search, Database, FileText, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Profile } from "@/types/profile"

export interface ToolDefinition {
  id: string
  name: string
  description: string
  category: "notion" | "custom" | "system"
  enabled: boolean
  requiresNotionKey?: boolean
  requiresRole?: "dominant" | "admin"
}

interface ToolSelectorProps {
  availableTools: ToolDefinition[]
  selectedTools: string[]
  onToolsChange: (toolIds: string[]) => void
  profile?: Profile | null
  hasNotionKey?: boolean
  className?: string
}

const categoryIcons = {
  notion: Database,
  custom: Wrench,
  system: Sparkles,
}

const categoryLabels = {
  notion: "Notion",
  custom: "Custom",
  system: "System",
}

export function ToolSelector({
  availableTools,
  selectedTools,
  onToolsChange,
  profile,
  hasNotionKey = false,
  className,
}: ToolSelectorProps) {
  const [open, setOpen] = useState(false)

  const handleToolToggle = (toolId: string) => {
    if (selectedTools.includes(toolId)) {
      onToolsChange(selectedTools.filter((id) => id !== toolId))
    } else {
      onToolsChange([...selectedTools, toolId])
    }
  }

  const handleSelectAll = () => {
    const enabledTools = availableTools
      .filter((tool) => {
        if (tool.requiresNotionKey && !hasNotionKey) return false
        if (tool.requiresRole) {
          const userRole = profile?.dynamic_role || profile?.system_role
          return userRole === tool.requiresRole || userRole === "admin"
        }
        return true
      })
      .map((tool) => tool.id)
    
    onToolsChange(enabledTools)
  }

  const handleDeselectAll = () => {
    onToolsChange([])
  }

  // Group tools by category
  const toolsByCategory = availableTools.reduce((acc, tool) => {
    if (!acc[tool.category]) {
      acc[tool.category] = []
    }
    acc[tool.category].push(tool)
    return acc
  }, {} as Record<string, ToolDefinition[]>)

  const isToolEnabled = (tool: ToolDefinition) => {
    if (tool.requiresNotionKey && !hasNotionKey) return false
    if (tool.requiresRole) {
      const userRole = profile?.dynamic_role || profile?.system_role
      return userRole === tool.requiresRole || userRole === "admin"
    }
    return true
  }

  const enabledToolsCount = availableTools.filter((tool) => 
    isToolEnabled(tool) && selectedTools.includes(tool.id)
  ).length

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn("h-8 gap-2", className)}
        >
          <Wrench className="h-3.5 w-3.5" />
          <span className="text-xs font-mono">
            Tools {enabledToolsCount > 0 && `(${enabledToolsCount})`}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-sm">Select Tools</h4>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={handleSelectAll}
              >
                All
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={handleDeselectAll}
              >
                None
              </Button>
            </div>
          </div>
          
          <ScrollArea className="h-[300px]">
            <div className="space-y-4">
              {Object.entries(toolsByCategory).map(([category, tools]) => {
                const CategoryIcon = categoryIcons[category as keyof typeof categoryIcons]
                const categoryLabel = categoryLabels[category as keyof typeof categoryLabels]
                
                return (
                  <div key={category}>
                    <div className="flex items-center gap-2 mb-2">
                      <CategoryIcon className="h-4 w-4 text-muted-foreground" />
                      <h5 className="text-xs font-medium text-muted-foreground uppercase">
                        {categoryLabel}
                      </h5>
                    </div>
                    <div className="space-y-2">
                      {tools.map((tool) => {
                        const enabled = isToolEnabled(tool)
                        const selected = selectedTools.includes(tool.id)
                        
                        return (
                          <div
                            key={tool.id}
                            className={cn(
                              "flex items-start gap-3 p-2 rounded-md border transition-colors",
                              enabled
                                ? selected
                                  ? "bg-primary/10 border-primary/20"
                                  : "hover:bg-muted/50 border-border"
                                : "opacity-50 cursor-not-allowed bg-muted/30"
                            )}
                          >
                            <Checkbox
                              checked={selected}
                              disabled={!enabled}
                              onCheckedChange={() => handleToolToggle(tool.id)}
                              className="mt-0.5"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium">{tool.name}</span>
                                {!enabled && (
                                  <Badge variant="secondary" className="text-xs">
                                    {tool.requiresNotionKey ? "Notion Required" : "Role Required"}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {tool.description}
                              </p>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                    <Separator className="mt-4" />
                  </div>
                )
              })}
            </div>
          </ScrollArea>
        </div>
      </PopoverContent>
    </Popover>
  )
}
