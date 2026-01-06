"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { KinkyAvatar } from "@/components/kinky/kinky-avatar"
import { ImageIcon, Wand2, Sparkles, BookOpen } from "lucide-react"
import { GenerationPanel } from "@/components/playground/image-generation/generation-panel"
import { kinkyKincadeProfile } from "@/lib/kinky/kinky-kincade-profile"

export default function ImageGenerationPage() {
  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-4">
          <KinkyAvatar size={64} className="shrink-0" />
          <div>
            <h1 className="text-3xl font-bold font-display">Image Generation Suite</h1>
            <p className="text-muted-foreground">
              Create and manage KINKSTER avatars with AI-powered image generation
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="generate" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="generate">
            <Wand2 className="h-4 w-4 mr-2" />
            Generate
          </TabsTrigger>
          <TabsTrigger value="examples">
            <Sparkles className="h-4 w-4 mr-2" />
            Examples
          </TabsTrigger>
          <TabsTrigger value="guide">
            <BookOpen className="h-4 w-4 mr-2" />
            Guide
          </TabsTrigger>
        </TabsList>

        <TabsContent value="generate" className="mt-6">
          <GenerationPanel />
        </TabsContent>

        <TabsContent value="examples" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                Example: Kinky Kincade
              </CardTitle>
              <CardDescription>
                Kinky Kincade serves as our example KINKSTER. Use his profile as a template for creating your own characters.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-semibold mb-2">Character Profile</h3>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="font-medium">Name:</span> {kinkyKincadeProfile.name}
                      </div>
                      <div>
                        <span className="font-medium">Title:</span> The Digital Guide
                      </div>
                      <div>
                        <span className="font-medium">Archetype:</span> {kinkyKincadeProfile.archetype}
                      </div>
                      <div>
                        <span className="font-medium">Personality:</span>{" "}
                        {kinkyKincadeProfile.personality_traits.slice(0, 5).join(", ")}
                      </div>
                      <div>
                        <span className="font-medium">Stats:</span>{" "}
                        <span className="text-muted-foreground">
                          D:{kinkyKincadeProfile.dominance} S:{kinkyKincadeProfile.submission} C:{kinkyKincadeProfile.charisma} St:{kinkyKincadeProfile.stamina} Cr:{kinkyKincadeProfile.creativity} Co:{kinkyKincadeProfile.control}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold mb-2">Appearance Description</h3>
                    <p className="text-sm text-muted-foreground">
                      {kinkyKincadeProfile.appearance_description}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-center">
                  <KinkyAvatar size={200} />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="guide" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Generation Guide
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div>
                <h3 className="font-semibold mb-2">How It Works</h3>
                <p className="text-muted-foreground">
                  The Image Generation Suite uses AI to create unique avatars based on your KINKSTER's
                  character profile. Simply provide details about appearance, personality, and style, and
                  our system will generate a custom avatar that reflects your character.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Tips for Best Results:</h3>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>Be specific about appearance details (hair color, style, clothing, etc.)</li>
                  <li>Include personality traits that affect visual presentation</li>
                  <li>Choose a style preset that matches your vision</li>
                  <li>Use character templates as starting points</li>
                  <li>Experiment with different prompts and styles</li>
                  <li>Reference Kinky Kincade's profile for inspiration</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Generation Modes:</h3>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li><strong>Single Image:</strong> Generate one image at a time</li>
                  <li><strong>From Template:</strong> Start with a pre-configured character template</li>
                  <li><strong>Batch Generation:</strong> Generate multiple variations (coming soon)</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

