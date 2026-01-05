"use client"
import { Card } from "@/components/ui/card"
import { useAppIdeas } from "@/hooks/use-app-ideas"
import { Lightbulb } from "lucide-react"
import { AppIdeaCard } from "./app-idea-card"

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

export function AppIdeasList() {
  const { ideas, isLoading } = useAppIdeas()

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="p-6 animate-pulse">
            <div className="h-4 bg-muted rounded w-1/3 mb-2" />
            <div className="h-3 bg-muted rounded w-2/3" />
          </Card>
        ))}
      </div>
    )
  }

  if (ideas.length === 0) {
    return (
      <Card className="p-12 text-center">
        <Lightbulb className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground">No ideas yet. Add your first idea!</p>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {ideas.map((idea) => (
        <AppIdeaCard key={idea.id} idea={idea} />
      ))}
    </div>
  )
}
