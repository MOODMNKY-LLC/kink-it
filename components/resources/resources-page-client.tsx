"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Library, ExternalLink, Star } from "lucide-react"
import { toast } from "sonner"
import type { DynamicRole } from "@/types/profile"
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

interface Resource {
  id: string
  title: string
  description: string | null
  url: string | null
  resource_type: string
  category: string
  tags: string[]
  rating: number | null
  notes: string | null
}

interface ResourcesPageClientProps {
  userId: string
  userRole: DynamicRole
  bondId: string | null
}

const RESOURCE_TYPES = [
  { value: "article", label: "Article" },
  { value: "video", label: "Video" },
  { value: "book", label: "Book" },
  { value: "podcast", label: "Podcast" },
  { value: "forum", label: "Forum" },
  { value: "guide", label: "Guide" },
  { value: "other", label: "Other" },
]

const CATEGORIES = [
  { value: "education", label: "Education" },
  { value: "safety", label: "Safety" },
  { value: "technique", label: "Technique" },
  { value: "community", label: "Community" },
  { value: "legal", label: "Legal" },
  { value: "other", label: "Other" },
]

export function ResourcesPageClient({ userId, userRole, bondId }: ResourcesPageClientProps) {
  const [resources, setResources] = useState<Resource[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string>("all")

  useEffect(() => {
    loadResources()
  }, [bondId, selectedCategory])

  const loadResources = async () => {
    try {
      setIsLoading(true)
      const params = new URLSearchParams()
      if (bondId) params.append("bond_id", bondId)
      if (selectedCategory !== "all") params.append("category", selectedCategory)

      const response = await fetch(`/api/resources?${params.toString()}`)
      const data = await response.json()

      if (response.ok) {
        setResources(data.resources || [])
      } else {
        toast.error(data.error || "Failed to load resources")
      }
    } catch (error) {
      toast.error("Failed to load resources")
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateResource = async (formData: FormData) => {
    try {
      const tagsString = formData.get("tags") as string
      const tags = tagsString
        ? tagsString.split(",").map((tag) => tag.trim()).filter(Boolean)
        : []

      const response = await fetch("/api/resources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.get("title"),
          description: formData.get("description"),
          url: formData.get("url"),
          resource_type: formData.get("resource_type"),
          category: formData.get("category"),
          tags,
          rating: formData.get("rating")
            ? parseInt(formData.get("rating") as string)
            : null,
          notes: formData.get("notes"),
          bond_id: bondId,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success("Resource added successfully")
        setShowCreateDialog(false)
        loadResources()
      } else {
        toast.error(data.error || "Failed to create resource")
      }
    } catch (error) {
      toast.error("Failed to create resource")
      console.error(error)
    }
  }

  const renderStars = (rating: number | null) => {
    if (!rating) return null
    return (
      <div className="flex gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={`h-4 w-4 ${
              i < rating ? "fill-warning text-warning" : "text-muted-foreground"
            }`}
          />
        ))}
      </div>
    )
  }

  const filteredResources = selectedCategory === "all"
    ? resources
    : resources.filter((r) => r.category === selectedCategory)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Loading resources...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-[180px] bg-muted/50 border-border backdrop-blur-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {CATEGORIES.map((cat) => (
              <SelectItem key={cat.value} value={cat.value}>
                {cat.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {userRole === "dominant" && (
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button className="bg-primary/10 hover:bg-primary/20 border-2 border-primary/40 backdrop-blur-sm text-foreground font-semibold shadow-lg shadow-primary/20 transition-all duration-300 hover:shadow-primary/30 hover:scale-[1.02]">
                <Plus className="h-4 w-4 mr-2" />
                Add Resource
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card/95 backdrop-blur-xl border-primary/20 max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add Resource</DialogTitle>
                <DialogDescription>
                  Add a new resource to the library
                </DialogDescription>
              </DialogHeader>
              <form action={handleCreateResource} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    name="title"
                    required
                    className="bg-muted/50 border-border backdrop-blur-sm"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="resource_type">Type</Label>
                    <Select name="resource_type" defaultValue="article">
                      <SelectTrigger className="bg-muted/50 border-border backdrop-blur-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {RESOURCE_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select name="category" defaultValue="other">
                      <SelectTrigger className="bg-muted/50 border-border backdrop-blur-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map((cat) => (
                          <SelectItem key={cat.value} value={cat.value}>
                            {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="url">URL</Label>
                  <Input
                    id="url"
                    name="url"
                    type="url"
                    placeholder="https://..."
                    className="bg-muted/50 border-border backdrop-blur-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    rows={4}
                    className="bg-muted/50 border-border backdrop-blur-sm"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="tags">Tags (comma-separated)</Label>
                    <Input
                      id="tags"
                      name="tags"
                      placeholder="safety, education, technique"
                      className="bg-muted/50 border-border backdrop-blur-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="rating">Rating (1-5)</Label>
                    <Input
                      id="rating"
                      name="rating"
                      type="number"
                      min="1"
                      max="5"
                      className="bg-muted/50 border-border backdrop-blur-sm"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    name="notes"
                    rows={2}
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
                    Add Resource
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {filteredResources.length === 0 ? (
        <Card className="border-primary/20 bg-card/90 backdrop-blur-xl">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Library className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center">
              {userRole === "dominant"
                ? "No resources added yet. Add your first resource to get started."
                : "No resources available at this time."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredResources.map((resource) => (
            <Card
              key={resource.id}
              className="border-primary/20 bg-card/90 backdrop-blur-xl hover:border-primary/40 transition-all duration-300"
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <CardTitle className="text-lg">{resource.title}</CardTitle>
                      <Badge variant="outline">{resource.resource_type}</Badge>
                      <Badge variant="outline">{resource.category}</Badge>
                    </div>
                    {resource.description && (
                      <CardDescription className="mt-2">
                        {resource.description}
                      </CardDescription>
                    )}
                  </div>
                  {resource.url && (
                    <Button
                      variant="ghost"
                      size="sm"
                      asChild
                      className="ml-2"
                    >
                      <a
                        href={resource.url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex flex-wrap gap-2">
                    {resource.tags && resource.tags.length > 0 && (
                      <>
                        {resource.tags.map((tag, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </>
                    )}
                  </div>
                  {resource.rating && renderStars(resource.rating)}
                </div>
                {resource.notes && (
                  <p className="text-sm text-muted-foreground mt-4">{resource.notes}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

