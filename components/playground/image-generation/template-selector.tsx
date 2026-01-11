"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { FileText, Check, Sparkles } from "lucide-react"
import { characterTemplates, type CharacterTemplate } from "@/lib/playground/character-templates"
import { KinkyAvatar } from "@/components/kinky/kinky-avatar"
import { cn } from "@/lib/utils"
import Image from "next/image"

interface TemplateSelectorProps {
  selectedId?: string
  onSelect: (template: CharacterTemplate) => void
}

export function TemplateSelector({ selectedId, onSelect }: TemplateSelectorProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Character Templates
        </CardTitle>
        <CardDescription>
          Start with a pre-configured character template
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2">
          {characterTemplates.map((template) => (
            <Button
              key={template.id}
              variant={selectedId === template.id ? "default" : "outline"}
              className={cn(
                "h-auto flex-col items-start p-4 text-left",
                selectedId === template.id && "ring-2 ring-primary"
              )}
              onClick={() => onSelect(template)}
            >
              <div className="flex w-full items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {template.id === "kinky-kincade" ? (
                    <KinkyAvatar size={32} />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                      <Sparkles className="h-4 w-4" />
                    </div>
                  )}
                  <span className="font-semibold">{template.name}</span>
                </div>
                {selectedId === template.id && (
                  <Check className="h-4 w-4" />
                )}
              </div>
              <p className="text-xs text-muted-foreground text-left mb-2">
                {template.description}
              </p>
              <div className="flex flex-wrap gap-1">
                <Badge variant="secondary" className="text-xs">
                  {template.characterData.archetype}
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  {template.characterData.role.split(",")[0]}
                </Badge>
              </div>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
