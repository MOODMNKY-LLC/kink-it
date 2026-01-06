"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Upload, Search, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
import Image from "next/image"
import {
  DEFAULT_POSE_TEMPLATES,
  POSE_CATEGORIES,
  type PoseTemplate,
  type PoseType,
  getPoseTemplatesByCategory,
  searchPoseTemplates,
} from "@/lib/playground/pose-templates"
import { KinkyEmptyState } from "@/components/kinky/kinky-empty-state"

interface PoseTemplateSelectorProps {
  onSelectTemplate: (template: PoseTemplate) => void
  onUploadPose: (file: File) => void
  selectedTemplateId?: string | null
  className?: string
}

export function PoseTemplateSelector({
  onSelectTemplate,
  onUploadPose,
  selectedTemplateId,
  className,
}: PoseTemplateSelectorProps) {
  const [selectedCategory, setSelectedCategory] = useState<PoseType>("standing")
  const [searchQuery, setSearchQuery] = useState("")
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type.startsWith("image/")) {
      setUploadedFile(file)
      onUploadPose(file)
    }
  }

  const templates = searchQuery
    ? searchPoseTemplates(searchQuery)
    : getPoseTemplatesByCategory(selectedCategory)

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle>Select Pose Reference</CardTitle>
        <CardDescription>Choose a pose template or upload your own reference image</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="templates" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="templates">Templates</TabsTrigger>
            <TabsTrigger value="upload">Upload</TabsTrigger>
          </TabsList>

          <TabsContent value="templates" className="space-y-4">
            {/* Search */}
            <div className="space-y-2">
              <Label htmlFor="pose-search">Search Templates</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="pose-search"
                  placeholder="Search by name, description, or tags..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {/* Category Filter */}
            {!searchQuery && (
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={selectedCategory} onValueChange={(value) => setSelectedCategory(value as PoseType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(POSE_CATEGORIES).map(([key, category]) => (
                      <SelectItem key={key} value={key}>
                        <span className="flex items-center gap-2">
                          <span>{category.icon}</span>
                          <span>{category.label}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Template Grid */}
            {templates.length === 0 ? (
              <KinkyEmptyState
                title="No templates found"
                message={searchQuery ? "Try a different search term" : "No templates in this category"}
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {templates.map((template) => {
                  const isSelected = selectedTemplateId === template.id
                  const categoryInfo = POSE_CATEGORIES[template.poseType]

                  return (
                    <Card
                      key={template.id}
                      className={cn(
                        "cursor-pointer transition-all hover:shadow-md",
                        isSelected && "ring-2 ring-primary ring-offset-2"
                      )}
                      onClick={() => onSelectTemplate(template)}
                    >
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-2xl">{categoryInfo.icon}</span>
                              <div>
                                <h3 className="font-semibold text-sm">{template.name}</h3>
                                <p className="text-xs text-muted-foreground">{categoryInfo.label}</p>
                              </div>
                            </div>
                            {isSelected && (
                              <Badge variant="default" className="text-xs">
                                Selected
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-2">{template.description}</p>
                          <div className="flex flex-wrap gap-1">
                            {template.tags.slice(0, 3).map((tag) => (
                              <Badge key={tag} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="upload" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="pose-upload">Upload Pose Reference Image</Label>
              <div className="border-2 border-dashed rounded-lg p-6 text-center">
                <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground mb-2">
                  Upload an image showing the pose you want to transfer
                </p>
                <Input
                  id="pose-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  onClick={() => document.getElementById("pose-upload")?.click()}
                  className="mt-2"
                >
                  Choose File
                </Button>
                {uploadedFile && (
                  <div className="mt-4">
                    <p className="text-sm font-medium">{uploadedFile.name}</p>
                    <Badge variant="secondary" className="mt-2">
                      Ready to use
                    </Badge>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}



