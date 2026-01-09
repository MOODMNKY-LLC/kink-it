"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { KinkyKincadePlayground } from "@/components/playground/kinky-kincade/kinky-kincade-playground"
import KinksterCreationWizard from "@/components/kinksters/kinkster-creation-wizard"
import { SceneComposer } from "@/components/playground/scene-composition/scene-composer"
import { ScenePresetSelector } from "./scene-preset-selector"
import { Sparkles, Users, Image as ImageIcon, Palette } from "lucide-react"
import { SCENE_PRESETS, CHARACTER_PRESETS } from "@/lib/playground/preset-config"
import Image from "next/image"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export function ImageStudio() {
  const [activeTab, setActiveTab] = useState("generate")

  return (
    <div className="h-full w-full flex flex-col">
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Image Studio</h1>
              <p className="text-sm text-muted-foreground">
                Create, customize, and manage your images
              </p>
            </div>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
        <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container mx-auto px-4">
            <TabsList className="grid w-full max-w-2xl grid-cols-4">
              <TabsTrigger value="generate" className="text-sm">
                <Sparkles className="h-4 w-4 mr-2" />
                Generate
              </TabsTrigger>
              <TabsTrigger value="kinkster" className="text-sm">
                <Users className="h-4 w-4 mr-2" />
                Kinkster Creator
              </TabsTrigger>
              <TabsTrigger value="scene" className="text-sm">
                <ImageIcon className="h-4 w-4 mr-2" />
                Scene Composition
              </TabsTrigger>
              <TabsTrigger value="presets" className="text-sm">
                <Palette className="h-4 w-4 mr-2" />
                Presets
              </TabsTrigger>
            </TabsList>
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          <TabsContent value="generate" className="h-full m-0">
            <KinkyKincadePlayground />
          </TabsContent>

          <TabsContent value="kinkster" className="h-full m-0">
            <div className="container mx-auto py-8 px-4 h-full overflow-auto">
              <div className="mb-6">
                <h2 className="text-2xl font-bold mb-2">KINKSTER Creator</h2>
                <p className="text-muted-foreground">
                  Create and manage your KINKSTER characters with custom AI-generated avatars
                </p>
              </div>
              <KinksterCreationWizard />
            </div>
          </TabsContent>

          <TabsContent value="scene" className="h-full m-0">
            <div className="container mx-auto py-8 px-4 h-full overflow-auto">
              <SceneComposer />
            </div>
          </TabsContent>

          <TabsContent value="presets" className="h-full m-0">
            <div className="container mx-auto py-8 px-4 h-full overflow-auto">
              <div className="mb-6">
                <h2 className="text-2xl font-bold mb-2">Presets Library</h2>
                <p className="text-muted-foreground">
                  Browse available character and scene presets
                </p>
              </div>
              
              {/* Character Presets Section */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold mb-4">Character Presets</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {CHARACTER_PRESETS.map((preset) => (
                    <Card key={preset.id} className="overflow-hidden">
                      <div className="aspect-square relative bg-muted">
                        <Image
                          src={preset.imageUrl}
                          alt={preset.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <CardHeader className="p-4 pb-2">
                        <CardTitle className="text-base">{preset.name}</CardTitle>
                        <CardDescription className="text-xs line-clamp-2">
                          {preset.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="p-4 pt-0">
                        <div className="flex flex-wrap gap-1">
                          {preset.tags.map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                {CHARACTER_PRESETS.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No character presets available
                  </div>
                )}
              </div>

              {/* Scene Presets Section */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Scene Presets</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {SCENE_PRESETS.map((preset) => (
                    <Card key={preset.id} className="overflow-hidden">
                      <div className="aspect-video relative bg-muted">
                        <Image
                          src={preset.imageUrl}
                          alt={preset.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <CardHeader className="p-4 pb-2">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-base">{preset.name}</CardTitle>
                          <Badge variant="outline" className="text-xs">
                            {preset.type}
                          </Badge>
                        </div>
                        <CardDescription className="text-xs line-clamp-2">
                          {preset.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="p-4 pt-0">
                        <div className="flex flex-wrap gap-1">
                          {preset.tags.map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                {SCENE_PRESETS.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No scene presets available
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}
