"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, BookOpen, Tag, Loader2, ExternalLink } from "lucide-react"
import { toast } from "sonner"
import { AddToNotionButtonGeneric } from "@/components/playground/shared/add-to-notion-button-generic"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface JournalEntry {
  id: string
  title: string
  content: string
  entry_type: "personal" | "shared" | "gratitude" | "scene_log"
  tags: string[]
  created_at: string
}

interface JournalPageClientProps {
  userId: string
  bondId: string | null
}

const ENTRY_TYPES = [
  { value: "personal", label: "Personal", color: "bg-primary/20 text-primary border-primary/40" },
  { value: "shared", label: "Shared", color: "bg-accent/20 text-accent border-accent/40" },
  { value: "gratitude", label: "Gratitude", color: "bg-success/20 text-success border-success/40" },
  { value: "scene_log", label: "Scene Log", color: "bg-secondary/20 text-secondary-foreground border-secondary/40" },
]

export function JournalPageClient({ userId, bondId }: JournalPageClientProps) {
  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [selectedType, setSelectedType] = useState<string>("all")

  useEffect(() => {
    loadEntries()
  }, [bondId, selectedType])

  const loadEntries = async () => {
    try {
      setIsLoading(true)
      const params = new URLSearchParams()
      if (bondId) params.append("bond_id", bondId)
      if (selectedType !== "all") params.append("entry_type", selectedType)

      const response = await fetch(`/api/journal?${params.toString()}`)
      const data = await response.json()

      if (response.ok) {
        setEntries(data.entries || [])
      } else {
        toast.error(data.error || "Failed to load entries")
      }
    } catch (error) {
      toast.error("Failed to load entries")
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateEntry = async (formData: FormData) => {
    try {
      const tagsString = formData.get("tags") as string
      const tags = tagsString
        ? tagsString.split(",").map((tag) => tag.trim()).filter(Boolean)
        : []

      const response = await fetch("/api/journal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.get("title"),
          content: formData.get("content"),
          entry_type: formData.get("entry_type"),
          tags,
          bond_id: bondId,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success("Entry created successfully")
        setShowCreateDialog(false)
        loadEntries()
      } else {
        toast.error(data.error || "Failed to create entry")
      }
    } catch (error) {
      toast.error("Failed to create entry")
      console.error(error)
    }
  }

  const getTypeColor = (type: string) => {
    const typeInfo = ENTRY_TYPES.find((t) => t.value === type)
    return typeInfo?.color || "bg-muted text-muted-foreground"
  }


  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Loading entries...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Select value={selectedType} onValueChange={setSelectedType}>
          <SelectTrigger className="w-[180px] bg-muted/50 border-border backdrop-blur-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {ENTRY_TYPES.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="bg-primary/10 hover:bg-primary/20 border-2 border-primary/40 backdrop-blur-sm text-foreground font-semibold shadow-lg shadow-primary/20 transition-all duration-300 hover:shadow-primary/30 hover:scale-[1.02]">
              <Plus className="h-4 w-4 mr-2" />
              New Entry
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card/95 backdrop-blur-xl border-primary/20 max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Journal Entry</DialogTitle>
              <DialogDescription>
                Add a new journal entry, scene log, or gratitude note
              </DialogDescription>
            </DialogHeader>
            <form action={handleCreateEntry} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  name="title"
                  required
                  className="bg-muted/50 border-border backdrop-blur-sm"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="entry_type">Entry Type</Label>
                <Select name="entry_type" defaultValue="personal">
                  <SelectTrigger className="bg-muted/50 border-border backdrop-blur-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ENTRY_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="content">Content</Label>
                <Textarea
                  id="content"
                  name="content"
                  rows={8}
                  required
                  className="bg-muted/50 border-border backdrop-blur-sm"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tags">Tags (comma-separated)</Label>
                <Input
                  id="tags"
                  name="tags"
                  placeholder="reflection, growth, scene"
                  className="bg-muted/50 border-border backdrop-blur-sm"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateDialog(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/30"
                >
                  Create Entry
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {entries.length === 0 ? (
        <Card className="border-primary/20 bg-card/90 backdrop-blur-xl">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center">
              No entries yet. Create your first journal entry to get started.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {entries.map((entry) => (
            <Card
              key={entry.id}
              className="border-primary/20 bg-card/90 backdrop-blur-xl hover:border-primary/40 transition-all duration-300"
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <CardTitle className="text-lg">{entry.title}</CardTitle>
                      <Badge className={getTypeColor(entry.entry_type)}>
                        {entry.entry_type}
                      </Badge>
                    </div>
                    <CardDescription>
                      {new Date(entry.created_at).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </CardDescription>
                  </div>
                  <AddToNotionButtonGeneric
                    tableName="journal_entries"
                    itemId={entry.id}
                    syncEndpoint="/api/notion/sync-journal"
                    variant="ghost"
                    size="sm"
                  />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-sm whitespace-pre-wrap">{entry.content}</p>
                  {entry.tags && entry.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {entry.tags.map((tag, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          <Tag className="h-3 w-3 mr-1" />
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
