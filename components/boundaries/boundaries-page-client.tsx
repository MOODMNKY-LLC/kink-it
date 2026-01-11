"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Heart } from "lucide-react"
import { toast } from "sonner"
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

interface Boundary {
  id: string
  activity_name: string
  category: string
  user_rating: "yes" | "maybe" | "no" | "hard_no" | null
  partner_rating: "yes" | "maybe" | "no" | "hard_no" | null
  user_experience: string
  partner_experience: string
  notes: string | null
  is_mutual: boolean
}

interface BoundariesPageClientProps {
  userId: string
  bondId: string | null
}

const ACTIVITY_CATEGORIES = [
  { value: "impact", label: "Impact Play" },
  { value: "rope", label: "Rope/Bondage" },
  { value: "sensation", label: "Sensation Play" },
  { value: "power_exchange", label: "Power Exchange" },
  { value: "roleplay", label: "Roleplay" },
  { value: "other", label: "Other" },
]

const RATINGS = [
  { value: "yes", label: "Yes", color: "bg-success/20 text-success border-success/40" },
  { value: "maybe", label: "Maybe", color: "bg-warning/20 text-warning border-warning/40" },
  { value: "no", label: "No", color: "bg-muted text-muted-foreground" },
  { value: "hard_no", label: "Hard No", color: "bg-destructive/20 text-destructive border-destructive/40" },
]

export function BoundariesPageClient({ userId, bondId }: BoundariesPageClientProps) {
  const [boundaries, setBoundaries] = useState<Boundary[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string>("all")

  useEffect(() => {
    loadBoundaries()
  }, [bondId])

  const loadBoundaries = async () => {
    try {
      setIsLoading(true)
      const params = new URLSearchParams()
      if (bondId) params.append("bond_id", bondId)
      if (selectedCategory !== "all") params.append("category", selectedCategory)

      const response = await fetch(`/api/boundaries?${params.toString()}`)
      const data = await response.json()

      if (response.ok) {
        setBoundaries(data.boundaries || [])
      } else {
        toast.error(data.error || "Failed to load boundaries")
      }
    } catch (error) {
      toast.error("Failed to load boundaries")
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateBoundary = async (formData: FormData) => {
    try {
      const response = await fetch("/api/boundaries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          activity_name: formData.get("activity_name"),
          category: formData.get("category"),
          user_rating: formData.get("user_rating"),
          user_experience: formData.get("user_experience"),
          notes: formData.get("notes"),
          bond_id: bondId,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success("Boundary added successfully")
        setShowCreateDialog(false)
        loadBoundaries()
      } else {
        toast.error(data.error || "Failed to create boundary")
      }
    } catch (error) {
      toast.error("Failed to create boundary")
      console.error(error)
    }
  }

  const handleUpdateRating = async (boundaryId: string, rating: string) => {
    try {
      const response = await fetch(`/api/boundaries/${boundaryId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_rating: rating }),
      })

      if (response.ok) {
        toast.success("Rating updated")
        loadBoundaries()
      } else {
        const data = await response.json()
        toast.error(data.error || "Failed to update rating")
      }
    } catch (error) {
      toast.error("Failed to update rating")
      console.error(error)
    }
  }

  const getRatingBadge = (rating: string | null) => {
    if (!rating) return null
    const ratingInfo = RATINGS.find((r) => r.value === rating)
    if (!ratingInfo) return null
    return (
      <Badge className={ratingInfo.color}>{ratingInfo.label}</Badge>
    )
  }

  const filteredBoundaries = selectedCategory === "all"
    ? boundaries
    : boundaries.filter((b) => b.category === selectedCategory)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Loading boundaries...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-[180px] bg-muted/50 border-border backdrop-blur-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {ACTIVITY_CATEGORIES.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="bg-primary/10 hover:bg-primary/20 border-2 border-primary/40 backdrop-blur-sm text-foreground font-semibold shadow-lg shadow-primary/20 transition-all duration-300 hover:shadow-primary/30 hover:scale-[1.02]">
              <Plus className="h-4 w-4 mr-2" />
              Add Activity
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card/95 backdrop-blur-xl border-primary/20">
            <DialogHeader>
              <DialogTitle>Add Activity</DialogTitle>
              <DialogDescription>
                Add a new activity to explore and rate
              </DialogDescription>
            </DialogHeader>
            <form action={handleCreateBoundary} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="activity_name">Activity Name</Label>
                <Input
                  id="activity_name"
                  name="activity_name"
                  required
                  className="bg-muted/50 border-border backdrop-blur-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select name="category" defaultValue="other">
                    <SelectTrigger className="bg-muted/50 border-border backdrop-blur-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ACTIVITY_CATEGORIES.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="user_experience">Your Experience</Label>
                  <Select name="user_experience" defaultValue="none">
                    <SelectTrigger className="bg-muted/50 border-border backdrop-blur-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="curious">Curious</SelectItem>
                      <SelectItem value="some">Some</SelectItem>
                      <SelectItem value="experienced">Experienced</SelectItem>
                      <SelectItem value="expert">Expert</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="user_rating">Your Rating</Label>
                <Select name="user_rating">
                  <SelectTrigger className="bg-muted/50 border-border backdrop-blur-sm">
                    <SelectValue placeholder="Select rating" />
                  </SelectTrigger>
                  <SelectContent>
                    {RATINGS.map((rating) => (
                      <SelectItem key={rating.value} value={rating.value}>
                        {rating.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  rows={3}
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
                  Add Activity
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {filteredBoundaries.length === 0 ? (
        <Card className="border-primary/20 bg-card/90 backdrop-blur-xl">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Heart className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center">
              No activities added yet. Start exploring by adding your first activity.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredBoundaries.map((boundary) => (
            <Card
              key={boundary.id}
              className="border-primary/20 bg-card/90 backdrop-blur-xl hover:border-primary/40 transition-all duration-300"
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <CardTitle className="text-lg">{boundary.activity_name}</CardTitle>
                      <Badge variant="outline">{boundary.category}</Badge>
                    </div>
                    {boundary.notes && (
                      <CardDescription className="mt-2">
                        {boundary.notes}
                      </CardDescription>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <Label className="text-sm text-muted-foreground mb-2 block">
                      Your Rating
                    </Label>
                    <div className="flex gap-2">
                      {RATINGS.map((rating) => (
                        <Button
                          key={rating.value}
                          variant={boundary.user_rating === rating.value ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleUpdateRating(boundary.id, rating.value)}
                          className={
                            boundary.user_rating === rating.value
                              ? rating.color
                              : ""
                          }
                        >
                          {rating.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                  {boundary.user_rating && (
                    <div>
                      {getRatingBadge(boundary.user_rating)}
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
