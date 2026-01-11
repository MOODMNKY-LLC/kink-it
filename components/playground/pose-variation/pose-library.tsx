"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Trash2, Image as ImageIcon } from "lucide-react"
import { toast } from "sonner"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { KinkyLoadingState } from "@/components/kinky/kinky-loading-state"
import { KinkyEmptyState } from "@/components/kinky/kinky-empty-state"
import type { PoseType } from "@/lib/playground/pose-templates"

interface PoseVariation {
  id: string
  kinkster_id: string
  pose_type: string | null
  pose_description: string | null
  generated_image_url: string
  created_at: string
}

interface PoseLibraryProps {
  kinksterId?: string | null
  onSelectPose?: (pose: PoseVariation) => void
  className?: string
}

export function PoseLibrary({ kinksterId, onSelectPose, className }: PoseLibraryProps) {
  const [poses, setPoses] = useState<PoseVariation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filterType, setFilterType] = useState<string>("all")
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    fetchPoses()
  }, [kinksterId, filterType])

  const fetchPoses = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (kinksterId) params.append("kinkster_id", kinksterId)
      if (filterType !== "all") params.append("pose_type", filterType)

      const response = await fetch(`/api/character-poses?${params.toString()}`)
      if (!response.ok) {
        throw new Error("Failed to fetch poses")
      }

      const data = await response.json()
      setPoses(data.poses || [])
    } catch (error) {
      console.error("Error fetching poses:", error)
      toast.error("Failed to load pose variations")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (poseId: string) => {
    if (!confirm("Are you sure you want to delete this pose variation?")) {
      return
    }

    setDeletingId(poseId)
    try {
      const response = await fetch(`/api/character-poses?id=${poseId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete pose")
      }

      toast.success("Pose variation deleted")
      fetchPoses()
    } catch (error) {
      console.error("Error deleting pose:", error)
      toast.error("Failed to delete pose variation")
    } finally {
      setDeletingId(null)
    }
  }

  // Get unique pose types for filter
  const poseTypes = Array.from(new Set(poses.map((p) => p.pose_type).filter(Boolean)))

  if (isLoading) {
    return (
      <Card className={cn("w-full", className)}>
        <CardContent className="p-6">
          <KinkyLoadingState title="Loading Pose Library" message="Fetching your pose variations..." />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Pose Library</CardTitle>
            <CardDescription>Browse your saved pose variations</CardDescription>
          </div>
          {poses.length > 0 && (
            <Badge variant="secondary">{poses.length} pose{poses.length !== 1 ? "s" : ""}</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filter */}
        {poses.length > 0 && (
          <div className="space-y-2">
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {poseTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Pose Grid */}
        {poses.length === 0 ? (
          <KinkyEmptyState
            title="No pose variations yet"
            message="Generate pose variations to see them here"
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {poses.map((pose) => (
              <Card key={pose.id} className="overflow-hidden">
                <div className="relative aspect-square w-full overflow-hidden bg-muted">
                  <Image
                    src={pose.generated_image_url}
                    alt={pose.pose_description || "Pose variation"}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
                <CardContent className="p-4">
                  <div className="space-y-2">
                    {pose.pose_type && (
                      <Badge variant="outline" className="text-xs">
                        {pose.pose_type}
                      </Badge>
                    )}
                    {pose.pose_description && (
                      <p className="text-xs text-muted-foreground line-clamp-2">{pose.pose_description}</p>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        {new Date(pose.created_at).toLocaleDateString()}
                      </span>
                      <div className="flex gap-2">
                        {onSelectPose && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onSelectPose(pose)}
                            className="h-7"
                          >
                            Use
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(pose.id)}
                          disabled={deletingId === pose.id}
                          className="h-7"
                        >
                          {deletingId === pose.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Trash2 className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
