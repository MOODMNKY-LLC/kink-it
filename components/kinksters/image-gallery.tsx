"use client"

import React, { useState, useEffect } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, ImageIcon, CheckCircle2, Tag } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import supabaseImageLoader from "@/lib/supabase-image-loader"
import { ImageCategorySelector } from "@/components/playground/image-category-selector"

interface ImageGeneration {
  id: string
  image_url: string
  category: string | null
  generation_type: string
  generation_prompt: string
  created_at: string
}

interface ImageGalleryProps {
  userId: string
  selectedImageId?: string | null
  onSelectImage: (generation: ImageGeneration) => void
  categoryFilter?: string | null
  className?: string
}

const CATEGORY_OPTIONS = [
  { value: "all", label: "All Images" },
  { value: "avatars", label: "Avatars" },
  { value: "scenes", label: "Scenes" },
  { value: "profile_photos", label: "Profile Photos" },
  { value: "banners", label: "Banners" },
  { value: "wallpapers", label: "Wallpapers" },
  { value: "other", label: "Other" },
]

export function ImageGallery({
  userId,
  selectedImageId,
  onSelectImage,
  categoryFilter = null,
  className,
}: ImageGalleryProps) {
  const [generations, setGenerations] = useState<ImageGeneration[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string>(categoryFilter || "all")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchGenerations()
  }, [userId, selectedCategory])

  const fetchGenerations = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const categoryParam = selectedCategory === "all" ? "" : selectedCategory
      const url = `/api/image-generations${categoryParam ? `?category=${categoryParam}` : ""}`
      
      const response = await fetch(url)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch image generations")
      }

      setGenerations(data.generations || [])
    } catch (err) {
      console.error("Error fetching image generations:", err)
      setError(err instanceof Error ? err.message : "Failed to load images")
      toast.error("Failed to load image gallery")
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className={cn("flex items-center justify-center py-12", className)}>
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <div className={cn("flex flex-col items-center justify-center py-12 space-y-4", className)}>
        <p className="text-sm text-destructive">{error}</p>
        <Button onClick={fetchGenerations} variant="outline" size="sm">
          Retry
        </Button>
      </div>
    )
  }

  if (generations.length === 0) {
    return (
      <div className={cn("flex flex-col items-center justify-center py-12 space-y-4", className)}>
        <ImageIcon className="h-12 w-12 text-muted-foreground" />
        <p className="text-sm text-muted-foreground text-center">
          No images found. Generate images in the Playground to see them here.
        </p>
      </div>
    )
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Category Filter */}
      <div className="flex items-center gap-2">
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            {CATEGORY_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Badge variant="outline" className="ml-auto">
          {generations.length} image{generations.length !== 1 ? "s" : ""}
        </Badge>
      </div>

      {/* Image Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {generations.map((generation) => {
          const isSelected = selectedImageId === generation.id
          
          return (
            <Card
              key={generation.id}
              className={cn(
                "relative aspect-square cursor-pointer transition-all hover:ring-2 hover:ring-primary group",
                isSelected && "ring-2 ring-primary ring-offset-2"
              )}
            >
              <CardContent className="p-0 h-full relative">
                <div
                  onClick={() => onSelectImage(generation)}
                  className="absolute inset-0"
                >
                  <Image
                    loader={supabaseImageLoader}
                    src={generation.image_url}
                    alt={generation.generation_prompt || "Generated image"}
                    fill
                    className="object-cover rounded-lg"
                    sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
                  />
                  {isSelected && (
                    <div className="absolute inset-0 bg-primary/20 rounded-lg flex items-center justify-center">
                      <CheckCircle2 className="h-8 w-8 text-primary" />
                    </div>
                  )}
                </div>
                {generation.category && (
                  <Badge
                    variant="secondary"
                    className="absolute top-2 right-2 text-xs pointer-events-none"
                  >
                    {generation.category}
                  </Badge>
                )}
                {/* Category Selector - appears on hover */}
                <div className="absolute bottom-2 left-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto">
                  <div className="bg-background/95 backdrop-blur-sm rounded-md p-1">
                    <ImageCategorySelector
                      imageId={generation.id}
                      currentCategory={generation.category}
                      className="text-xs"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
