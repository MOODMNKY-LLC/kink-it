"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Loader2, Tag } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface ImageCategorySelectorProps {
  imageId: string
  currentCategory: string | null
  onCategoryChange?: (category: string) => void
  className?: string
}

const CATEGORIES = [
  { value: "scenes", label: "Scenes", color: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20" },
  { value: "avatars", label: "Avatars", color: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20" },
  { value: "profile_photos", label: "Profile Photos", color: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20" },
  { value: "banners", label: "Banners", color: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20" },
  { value: "wallpapers", label: "Wallpapers", color: "bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/20" },
  { value: "other", label: "Other", color: "bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20" },
]

export function ImageCategorySelector({
  imageId,
  currentCategory,
  onCategoryChange,
  className,
}: ImageCategorySelectorProps) {
  const [category, setCategory] = useState<string>(currentCategory || "other")
  const [isUpdating, setIsUpdating] = useState(false)

  const handleCategoryChange = async (newCategory: string) => {
    if (newCategory === category) return

    setIsUpdating(true)
    try {
      const response = await fetch("/api/image-generations", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: imageId,
          category: newCategory,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to update category")
      }

      setCategory(newCategory)
      onCategoryChange?.(newCategory)
      toast.success(`Category updated to ${CATEGORIES.find(c => c.value === newCategory)?.label || newCategory}`)
    } catch (error) {
      console.error("Error updating category:", error)
      toast.error("Failed to update category")
    } finally {
      setIsUpdating(false)
    }
  }

  const currentCategoryConfig = CATEGORIES.find(c => c.value === category)

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Tag className="h-4 w-4 text-muted-foreground" />
      <Select value={category} onValueChange={handleCategoryChange} disabled={isUpdating}>
        <SelectTrigger className="w-[160px] h-8">
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
      {currentCategoryConfig && (
        <Badge variant="outline" className={cn("text-xs", currentCategoryConfig.color)}>
          {currentCategoryConfig.label}
        </Badge>
      )}
      {isUpdating && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
    </div>
  )
}
