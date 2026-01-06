"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import type { GenerationProps } from "@/lib/image/props"
import type { CharacterData } from "@/lib/image/shared-utils"
import { Loader2 } from "lucide-react"

interface SavePromptDialogProps {
  prompt: string
  props: GenerationProps
  characterData: CharacterData
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SavePromptDialog({
  prompt,
  props,
  characterData,
  open,
  onOpenChange,
}: SavePromptDialogProps) {
  const [name, setName] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const supabase = createClient()

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Please enter a name for this prompt")
      return
    }

    setIsSaving(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error("Please sign in to save prompts")
        return
      }

      const { error } = await supabase.from("saved_prompts").insert({
        user_id: user.id,
        name: name.trim(),
        prompt,
        props,
        character_data: {
          name: characterData.name,
          appearance_description: characterData.appearance_description,
          physical_attributes: characterData.physical_attributes,
          archetype: characterData.archetype,
          role_preferences: characterData.role_preferences,
          personality_traits: characterData.personality_traits,
        },
      })

      if (error) {
        throw error
      }

      toast.success("Prompt saved successfully")
      setName("")
      onOpenChange(false)
    } catch (error: any) {
      console.error("Error saving prompt:", error)
      toast.error(error.message || "Failed to save prompt")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Save Prompt</DialogTitle>
          <DialogDescription>
            Save this prompt for future use. You can load it later to regenerate similar images.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="prompt-name">Name</Label>
            <Input
              id="prompt-name"
              placeholder="e.g., Kinky Default, Tactical Look, etc."
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  handleSave()
                }
              }}
            />
          </div>
          <div className="rounded-md border bg-muted/50 p-3">
            <p className="text-xs font-medium mb-1 text-muted-foreground">Preview:</p>
            <p className="text-xs font-mono line-clamp-3">{prompt}</p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving || !name.trim()}>
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              "Save"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}



