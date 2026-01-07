"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Bullet } from "@/components/ui/bullet"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { ScrollArea } from "@/components/ui/scroll-area"
import { AnimatedGradientText } from "@/components/ui/animated-gradient-text"
import { CheckCircle2, Loader2, AlertCircle, Key, ExternalLink, HelpCircle, Sparkles, Bot, Users, Database, Zap, Lock } from "lucide-react"
import { toast } from "sonner"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface NotionApiKeyStepProps {
  onNext: (data: Record<string, any>) => void
  onBack: () => void
  initialData?: Record<string, any>
}

export default function NotionApiKeyStep({ onNext, onBack, initialData }: NotionApiKeyStepProps) {
  const [keyName, setKeyName] = useState(initialData?.notion_api_key_name || "")
  const [apiKey, setApiKey] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isAdded, setIsAdded] = useState(initialData?.notion_api_key_added || false)
  const [showInfoDialog, setShowInfoDialog] = useState(false)

  const handleAddKey = async () => {
    if (!keyName.trim() || !apiKey.trim()) {
      toast.error("Please provide both a name and API key")
      return
    }

    // Basic validation
    if (!apiKey.trim().startsWith("secret_") && !apiKey.trim().startsWith("ntn_")) {
      toast.error("Invalid API key format. Notion API keys start with 'secret_' or 'ntn_'")
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch("/api/notion/api-keys", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          key_name: keyName.trim(),
          api_key: apiKey.trim(),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to add API key")
      }

      toast.success("API key added successfully")
      setIsAdded(true)
      // Clear the API key input for security (name stays)
      setApiKey("")
    } catch (error: any) {
      console.error("Error adding API key:", error)
      toast.error(error.message || "Failed to add API key")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSkip = () => {
    onNext({ notion_api_key_added: false, notion_api_key_skipped: true })
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <AnimatedGradientText className="text-2xl font-bold">
          Unlock Your Digital Universe
        </AnimatedGradientText>
        <p className="text-sm text-muted-foreground">
          Your Notion template is connected! Add your API key to unlock powerful capabilities across your KINK IT universe.
        </p>
      </div>

      <TooltipProvider>
        <Alert className="border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors">
          <Sparkles className="h-4 w-4 text-primary" />
          <AlertTitle className="text-primary flex items-center gap-2">
            What Your API Key Powers
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="h-3.5 w-3.5 text-primary/70 cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="text-xs">
                  Your API key is a secure pass that allows KINK IT to connect deeply with your Notion workspace, enabling powerful features that make your dynamic management effortless.
                </p>
              </TooltipContent>
            </Tooltip>
          </AlertTitle>
          <AlertDescription className="mt-3">
            <ScrollArea className="h-[280px] pr-4">
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="kinky" className="border-border/50">
                  <AccordionTrigger className="hover:no-underline py-3">
                    <div className="flex items-center gap-2.5 flex-1 text-left">
                      <div className="p-1.5 rounded-md bg-primary/10">
                        <Bot className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">Gives Kinky Kincade the Ability To...</p>
                        <p className="text-xs text-muted-foreground font-normal mt-0.5">
                          Your digital guide becomes powered by your workspace
                        </p>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-2 pb-4 pl-9">
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Access your Notion workspace to provide personalized guidance based on your actual data. Sync context from your templates, help organize your dynamic's information, and ensure everything stays perfectly aligned—all while respecting your boundaries and privacy. Kinky becomes your intelligent guide, powered by your real workspace.
                    </p>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="backend" className="border-border/50">
                  <AccordionTrigger className="hover:no-underline py-3">
                    <div className="flex items-center gap-2.5 flex-1 text-left">
                      <div className="p-1.5 rounded-md bg-accent/10">
                        <Database className="w-4 h-4 text-accent" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">Powers KINK IT To...</p>
                        <p className="text-xs text-muted-foreground font-normal mt-0.5">
                          Keep everything beautifully synchronized
                        </p>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-2 pb-4 pl-9">
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Calendar events flow into your Notion Calendar, tasks sync bidirectionally, rules and contracts stay organized, journal entries become part of your comprehensive documentation. When you create something in KINK IT, it appears in Notion—and when you update in Notion, KINK IT stays current. Your dynamic's data becomes seamlessly connected.
                    </p>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="kinksters" className="border-border/50">
                  <AccordionTrigger className="hover:no-underline py-3">
                    <div className="flex items-center gap-2.5 flex-1 text-left">
                      <div className="p-1.5 rounded-md bg-secondary/10">
                        <Users className="w-4 h-4 text-secondary-foreground" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">Enables Your KINKSTER Characters To...</p>
                        <p className="text-xs text-muted-foreground font-normal mt-0.5">
                          Sync their entire journey to your workspace
                        </p>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-2 pb-4 pl-9">
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Custom avatars, generated images, stats, personalities, and roleplay history all become part of your comprehensive dynamic documentation. Every character you create becomes beautifully documented, with their story preserved in your Notion workspace. Your universe, perfectly captured.
                    </p>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </ScrollArea>
            
            <div className="mt-3 pt-3 border-t border-border/50 flex items-start gap-2">
              <Lock className="h-3.5 w-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
              <p className="text-xs text-muted-foreground">
                <strong className="text-foreground">Privacy & Security:</strong> Your API key is encrypted and stored securely. Kinky Kincade and our services respect your boundaries—they can only access what you've explicitly shared with your Notion integration. You maintain complete control.
              </p>
            </div>
          </AlertDescription>
        </Alert>
      </TooltipProvider>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Bullet />
              <CardTitle className="text-sm font-medium uppercase">
                Notion API Key Setup
              </CardTitle>
            </div>
            <Dialog open={showInfoDialog} onOpenChange={setShowInfoDialog}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <HelpCircle className="h-4 w-4" />
                  <span className="sr-only">Learn more about Notion API keys</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Key className="w-5 h-5 text-primary" />
                    Understanding Your Notion API Key
                  </DialogTitle>
                  <DialogDescription>
                    Everything you need to know about how KINK IT uses your Notion integration
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-6 mt-4">
                  <div>
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <Bot className="w-4 h-4 text-primary" />
                      What is a Notion API Key?
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      A Notion API key is a secure pass that allows KINK IT to connect deeply with your Notion workspace. It's like giving KINK IT permission to read and write data in your Notion databases—with your explicit control over what can be accessed. You create it in Notion and share it with KINK IT to unlock powerful integration features that make your dynamic management seamless.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-accent" />
                      What KINK IT Can Do With Your Key
                    </h3>
                    <div className="space-y-3 text-sm text-muted-foreground">
                      <div>
                        <p className="font-medium mb-1">Gives Kinky Kincade the Ability To...</p>
                        <ul className="list-disc list-inside ml-2 mt-1 space-y-0.5">
                          <li>Access your Notion templates and databases for context</li>
                          <li>Sync information to provide better, personalized assistance</li>
                          <li>Help organize your dynamic's information intelligently</li>
                          <li>Provide guidance based on your actual workspace setup</li>
                        </ul>
                      </div>
                      <div>
                        <p className="font-medium mb-1">Powers KINK IT To...</p>
                        <ul className="list-disc list-inside ml-2 mt-1 space-y-0.5">
                          <li>Sync calendar events to your Notion Calendar database</li>
                          <li>Store image generations (KINKSTER avatars, scenes) in Notion</li>
                          <li>Keep tasks, rules, contracts, and journal entries synchronized</li>
                          <li>Maintain your data organized and accessible across both platforms</li>
                        </ul>
                      </div>
                      <div>
                        <p className="font-medium mb-1">Enables Your KINKSTER Characters To...</p>
                        <ul className="list-disc list-inside ml-2 mt-1 space-y-0.5">
                          <li>Sync character data and avatars to your Notion workspace</li>
                          <li>Store generated images and scene compositions</li>
                          <li>Document character journeys and roleplay history</li>
                          <li>Create comprehensive character documentation automatically</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-warning" />
                      Security & Privacy
                    </h3>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <p>
                        <strong>Encryption:</strong> Your API key is encrypted using industry-standard encryption (AES-256) before being stored in our database. It's never stored in plain text.
                      </p>
                      <p>
                        <strong>Access Control:</strong> The key can only access Notion pages and databases that you've explicitly shared with your integration. You maintain full control over what KINK IT can access.
                      </p>
                      <p>
                        <strong>No Sharing:</strong> Your API key is unique to your account and workspace. We never share it with third parties or use it for anything beyond the features you've enabled.
                      </p>
                      <p>
                        <strong>Revocable:</strong> You can revoke access at any time by deleting the integration in Notion or removing the API key from your KINK IT settings.
                      </p>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <ExternalLink className="w-4 h-4" />
                      How to Get Your API Key
                    </h3>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <ol className="list-decimal list-inside space-y-1 ml-2">
                        <li>Visit{" "}
                          <a
                            href="https://www.notion.so/my-integrations"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline inline-flex items-center gap-1"
                          >
                            Notion Integrations
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </li>
                        <li>Click "New integration"</li>
                        <li>Give it a name (e.g., "KINK IT - My Workspace")</li>
                        <li>Select your workspace</li>
                        <li>Copy the "Internal Integration Token" (starts with <code className="bg-muted px-1 py-0.5 rounded text-xs">secret_</code> or <code className="bg-muted px-1 py-0.5 rounded text-xs">ntn_</code>)</li>
                        <li>Share your template page with the integration (important!)</li>
                      </ol>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <p className="text-xs text-muted-foreground">
                      <strong>Note:</strong> You can skip this step and add your API key later in Settings. Your OAuth connection will handle most features, but adding an API key ensures seamless syncing and unlocks advanced capabilities.
                    </p>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <CardDescription>
            Create a new integration in Notion to get your API key. Visit{" "}
            <a
              href="https://www.notion.so/my-integrations"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline inline-flex items-center gap-1 font-medium"
            >
              Notion Integrations
              <ExternalLink className="w-3 h-3" />
            </a>
            {" "}to create one, then copy the "Internal Integration Token" here.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isAdded ? (
            <div className="flex items-center gap-2 text-green-500">
              <CheckCircle2 className="w-5 h-5" />
              <span className="font-medium">API key added successfully!</span>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="key-name">Key Name</Label>
                <Input
                  id="key-name"
                  placeholder="e.g., Personal Workspace, Main Integration"
                  value={keyName}
                  onChange={(e) => setKeyName(e.target.value)}
                  disabled={isSubmitting}
                />
                <p className="text-xs text-muted-foreground">
                  Give your API key a descriptive name to identify it later
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="api-key">Notion API Key</Label>
                <Input
                  id="api-key"
                  type="password"
                  placeholder="secret_... or ntn_..."
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  disabled={isSubmitting}
                />
                <p className="text-xs text-muted-foreground">
                  Your API key starts with &quot;secret_&quot; or &quot;ntn_&quot;. It will be encrypted and stored securely.
                </p>
              </div>

              <Button
                onClick={handleAddKey}
                disabled={!keyName.trim() || !apiKey.trim() || isSubmitting}
                className="w-full"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <Key className="w-4 h-4 mr-2" />
                    Add API Key
                  </>
                )}
              </Button>
            </div>
          )}

          <div className="flex gap-2 pt-4">
            <Button variant="outline" onClick={onBack} className="flex-1">
              Back
            </Button>
            <Button variant="ghost" onClick={handleSkip} className="flex-1">
              Skip for Now
            </Button>
            <Button
              onClick={() => onNext({ notion_api_key_added: isAdded, notion_api_key_name: keyName })}
              disabled={!isAdded && !isSubmitting}
              className="flex-1"
            >
              Continue
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
