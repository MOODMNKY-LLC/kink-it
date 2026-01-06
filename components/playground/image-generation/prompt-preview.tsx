"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Copy, Check, Sparkles, Loader2, ChevronDown, ChevronUp, Save } from "lucide-react"
import { toast } from "sonner"
import { buildAvatarPrompt, type CharacterData } from "@/lib/image/shared-utils"
import { getPromptStats } from "@/lib/image/prompt-optimizer"
import { KINKY_DEFAULT_PROPS } from "@/lib/image/props"
import type { GenerationProps } from "@/lib/image/props"
import { createClient } from "@/lib/supabase/client"
import { SavePromptDialog } from "./save-prompt-dialog"

interface PromptPreviewProps {
  characterData: CharacterData
  stylePresetId?: string
  className?: string
}

export function PromptPreview({
  characterData,
  stylePresetId,
  className,
}: PromptPreviewProps) {
  const [synthesizedPrompt, setSynthesizedPrompt] = useState<string>("")
  const [isOptimizing, setIsOptimizing] = useState(false)
  const [copied, setCopied] = useState(false)
  const [stats, setStats] = useState<ReturnType<typeof getPromptStats> | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const supabase = createClient()

  // Synthesize prompt whenever character data or style changes
  useEffect(() => {
    setIsOptimizing(true)
    
    // Small delay to show optimization state
    const timer = setTimeout(() => {
      try {
        // Ensure characterData has props - use props from characterData or default
        const dataWithProps = {
          ...characterData,
          props: characterData.props || KINKY_DEFAULT_PROPS,
        }
        const prompt = buildAvatarPrompt(dataWithProps)
        setSynthesizedPrompt(prompt)
        setStats(getPromptStats(prompt))
      } catch (error) {
        console.error("Error synthesizing prompt:", error)
        toast.error("Failed to synthesize prompt")
      } finally {
        setIsOptimizing(false)
      }
    }, 100)

    return () => clearTimeout(timer)
  }, [characterData, stylePresetId])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(synthesizedPrompt)
      setCopied(true)
      toast.success("Prompt copied to clipboard")
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      toast.error("Failed to copy prompt")
    }
  }

  return (
    <>
      <Card className={className}>
        <CardHeader className="pb-3">
          <Collapsible open={isOpen} onOpenChange={setIsOpen}>
            <div className="flex items-center justify-between">
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="h-auto p-0 hover:bg-transparent">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    <CardTitle className="text-base">Synthesized Prompt</CardTitle>
                    {!isOpen && synthesizedPrompt && (
                      <Badge variant="secondary" className="text-xs">
                        {stats?.wordCount || 0} words
                      </Badge>
                    )}
                    {isOpen ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </div>
                </Button>
              </CollapsibleTrigger>
              <div className="flex items-center gap-2">
                {isOpen && isOptimizing && (
                  <Badge variant="secondary" className="gap-1">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Optimizing...
                  </Badge>
                )}
                {isOpen && stats && stats.hasBaraStyle && (
                  <Badge variant="default" className="text-xs">Bara Style</Badge>
                )}
                {isOpen && synthesizedPrompt && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowSaveDialog(true)}
                    className="h-7 text-xs"
                  >
                    <Save className="h-3 w-3 mr-1" />
                    Save
                  </Button>
                )}
              </div>
            </div>
            <CardDescription className="text-xs mt-1">
              Automatically optimized prompt ready for generation
            </CardDescription>

            <CollapsibleContent className="mt-4">
              <CardContent className="pt-0 space-y-4">
                <div className="space-y-2">
                  <div className="relative">
                    <div className="rounded-md border bg-muted/50 p-4 font-mono text-sm max-h-64 overflow-y-auto">
                      {isOptimizing ? (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Synthesizing optimized prompt...
                        </div>
                      ) : synthesizedPrompt ? (
                        <pre className="whitespace-pre-wrap break-words">{synthesizedPrompt}</pre>
                      ) : (
                        <p className="text-muted-foreground">Adjust props to see synthesized prompt</p>
                      )}
                    </div>
                  </div>
                  
                  {stats && !isOptimizing && (
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center gap-4">
                        <span>{stats.wordCount} words</span>
                        <span>{stats.length} characters</span>
                        <span>{stats.partCount} parts</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleCopy}
                        className="h-7"
                      >
                        {copied ? (
                          <>
                            <Check className="h-3 w-3 mr-1" />
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3 mr-1" />
                            Copy
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </div>

                <div className="rounded-md bg-muted/30 p-3 text-xs text-muted-foreground">
                  <p className="font-medium mb-1">How it works:</p>
                  <p>
                    This prompt is automatically synthesized from your props and character data. 
                    It's optimized for DALL-E 3 and ensures consistent Bara style. You cannot edit 
                    this prompt directly—adjust props to customize the result.
                  </p>
                </div>
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </CardHeader>
      </Card>

      {showSaveDialog && (
        <SavePromptDialog
          prompt={synthesizedPrompt}
          props={characterData.props || KINKY_DEFAULT_PROPS}
          characterData={characterData}
          open={showSaveDialog}
          onOpenChange={setShowSaveDialog}
        />
      )}
    </>
  )
}
