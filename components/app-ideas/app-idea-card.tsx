"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { AppIdea } from "@/types/app-ideas"
import { formatDistanceToNow } from "date-fns"
import { Clock, User, MoreVertical, Archive, Trash2, Edit, CheckCircle2, PlayCircle } from "lucide-react"
import { NotionIcon } from "@/components/icons/notion"
import { useAppIdeas } from "@/hooks/use-app-ideas"
import { syncIdeaToNotion } from "@/lib/notion-sync"
import { useState } from "react"

const categoryColors = {
  feature: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  improvement: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  bug: "bg-red-500/10 text-red-500 border-red-500/20",
  design: "bg-pink-500/10 text-pink-500 border-pink-500/20",
  content: "bg-green-500/10 text-green-500 border-green-500/20",
}

const priorityColors = {
  low: "bg-gray-500/10 text-gray-500 border-gray-500/20",
  medium: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  high: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  urgent: "bg-red-500/10 text-red-500 border-red-500/20",
}

const statusColors = {
  new: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  in_progress: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  completed: "bg-green-500/10 text-green-500 border-green-500/20",
  archived: "bg-gray-500/10 text-gray-500 border-gray-500/20",
}

interface AppIdeaCardProps {
  idea: AppIdea
}

export function AppIdeaCard({ idea }: AppIdeaCardProps) {
  const { updateIdea, deleteIdea } = useAppIdeas()
  const [isSyncing, setIsSyncing] = useState(false)

  const handleStatusChange = async (status: AppIdea["status"]) => {
    await updateIdea(idea.id, { status })
  }

  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this idea?")) {
      await deleteIdea(idea.id)
    }
  }

  const handleSyncToNotion = async () => {
    setIsSyncing(true)
    const result = await syncIdeaToNotion(idea)
    setIsSyncing(false)

    if (result.success && result.notionPageId) {
      await updateIdea(idea.id, { notion_page_id: result.notionPageId })
    }
  }

  return (
    <Card className="p-6 hover:bg-accent/50 transition-colors">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-lg">{idea.title}</h3>
            <Badge variant="outline" className={categoryColors[idea.category]}>
              {idea.category}
            </Badge>
            <Badge variant="outline" className={priorityColors[idea.priority]}>
              {idea.priority}
            </Badge>
            <Badge variant="outline" className={statusColors[idea.status]}>
              {idea.status.replace("_", " ")}
            </Badge>
            {idea.notion_page_id && (
              <Badge variant="outline" className="bg-gray-500/10 text-gray-500 border-gray-500/20">
                synced
              </Badge>
            )}
          </div>

          {idea.description && <p className="text-muted-foreground text-sm">{idea.description}</p>}

          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <User className="h-3 w-3" />
              {idea.created_by}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatDistanceToNow(new Date(idea.created_at), { addSuffix: true })}
            </span>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleStatusChange("in_progress")}>
              <PlayCircle className="h-4 w-4 mr-2" />
              Start Progress
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleStatusChange("completed")}>
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Mark Complete
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleStatusChange("archived")}>
              <Archive className="h-4 w-4 mr-2" />
              Archive
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSyncToNotion} disabled={isSyncing || !!idea.notion_page_id}>
              <NotionIcon className="h-4 w-4 mr-2" variant="brand" />
              {isSyncing ? "Syncing..." : idea.notion_page_id ? "Already Synced" : "Sync to Notion"}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleDelete} className="text-destructive">
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </Card>
  )
}
