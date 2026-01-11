"use client"

import React from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { 
  Info, 
  Sparkles, 
  Bot, 
  Zap,
  BookOpen,
  Code,
} from "lucide-react"

interface ChatHelpDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ChatHelpDialog({
  open,
  onOpenChange,
}: ChatHelpDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            How to Use KINKY Chat
          </DialogTitle>
          <DialogDescription>
            Learn how to use tools, attach files, and get the most out of your chat experience.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="tools" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="tools">Tools</TabsTrigger>
            <TabsTrigger value="modes">Modes</TabsTrigger>
            <TabsTrigger value="tips">Tips</TabsTrigger>
          </TabsList>

          <TabsContent value="tools" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold flex items-center gap-2 mb-2">
                  <Sparkles className="h-4 w-4" />
                  Using Tools
                </h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Click the <Sparkles className="h-3 w-3 inline" /> button in the input bar to open the command palette.
                </p>
                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <Badge variant="outline" className="shrink-0">1</Badge>
                    <div>
                      <p className="font-medium">Select a Tool</p>
                      <p className="text-muted-foreground text-xs">
                        Choose from files, images, research, Notion, MCP tools, and more
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Badge variant="outline" className="shrink-0">2</Badge>
                    <div>
                      <p className="font-medium">Attach to Message</p>
                      <p className="text-muted-foreground text-xs">
                        Tools can be used one-shot (single use) or in agent mode (multiple uses)
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Badge variant="outline" className="shrink-0">3</Badge>
                    <div>
                      <p className="font-medium">Send Your Message</p>
                      <p className="text-muted-foreground text-xs">
                        The AI will use the attached tools to help answer your question
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold flex items-center gap-2 mb-2">
                  <Code className="h-4 w-4" />
                  Available Tool Categories
                </h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="p-2 rounded-md bg-muted/50">
                    <p className="font-medium">Files & Images</p>
                    <p className="text-xs text-muted-foreground">Upload photos, documents, files</p>
                  </div>
                  <div className="p-2 rounded-md bg-muted/50">
                    <p className="font-medium">Research</p>
                    <p className="text-xs text-muted-foreground">Web search, deep research</p>
                  </div>
                  <div className="p-2 rounded-md bg-muted/50">
                    <p className="font-medium">Notion</p>
                    <p className="text-xs text-muted-foreground">Search, query, create in Notion</p>
                  </div>
                  <div className="p-2 rounded-md bg-muted/50">
                    <p className="font-medium">MCP Tools</p>
                    <p className="text-xs text-muted-foreground">GitHub, Supabase, Filesystem, etc.</p>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="modes" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold flex items-center gap-2 mb-2">
                  <Zap className="h-4 w-4" />
                  One-Shot Mode
                </h3>
                <div className="p-3 rounded-md bg-primary/5 border border-primary/20">
                  <p className="text-sm mb-2">
                    <strong>How it works:</strong> Tool runs once, returns result, then detaches.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Best for: Single queries, quick tasks, one-time operations
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Example: "Search Notion for tasks" → Tool runs → Result shown → Tool removed
                  </p>
                </div>
              </div>

              <div>
                <h3 className="font-semibold flex items-center gap-2 mb-2">
                  <Bot className="h-4 w-4" />
                  Agent Mode
                </h3>
                <div className="p-3 rounded-md bg-accent/5 border border-accent/20">
                  <p className="text-sm mb-2">
                    <strong>How it works:</strong> Tool stays attached, AI can use it multiple times.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Best for: Complex tasks, multi-step workflows, ongoing operations
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Example: "Help me manage my tasks" → Tool attached → AI uses it throughout conversation
                  </p>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-2">Enabling Agent Mode</h3>
                <p className="text-sm text-muted-foreground">
                  Go to Settings (three-dot menu) → Enable "Agent Mode" toggle. 
                  This allows tools to stay attached for multiple uses in a conversation.
                </p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="tips" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold flex items-center gap-2 mb-2">
                  <BookOpen className="h-4 w-4" />
                  Pro Tips
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <Badge variant="secondary" className="shrink-0">💡</Badge>
                    <div>
                      <p className="font-medium">Be Specific</p>
                      <p className="text-muted-foreground text-xs">
                        The more specific your request, the better the AI can use tools effectively
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Badge variant="secondary" className="shrink-0">⚡</Badge>
                    <div>
                      <p className="font-medium">Combine Tools</p>
                      <p className="text-muted-foreground text-xs">
                        You can attach multiple tools at once for complex workflows
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Badge variant="secondary" className="shrink-0">🎯</Badge>
                    <div>
                      <p className="font-medium">Use Agent Mode for Complex Tasks</p>
                      <p className="text-muted-foreground text-xs">
                        Enable agent mode when you need the AI to use tools multiple times
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Badge variant="secondary" className="shrink-0">📎</Badge>
                    <div>
                      <p className="font-medium">Attach Files</p>
                      <p className="text-muted-foreground text-xs">
                        Upload images or documents directly from the command menu
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
