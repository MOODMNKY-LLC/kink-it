"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle2, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"

interface WelcomeSplashStepProps {
  onComplete: () => void
  initialData?: Record<string, any>
}

export default function WelcomeSplashStep({ onComplete, initialData }: WelcomeSplashStepProps) {
  const dynamicRole = initialData?.dynamic_role || "user"
  const notionVerified = initialData?.notion_verified || false
  const notionApiKeyAdded = initialData?.notion_api_key_added || false

  const getRoleMessage = () => {
    switch (dynamicRole) {
      case "dominant":
        return {
          title: "Welcome, Dominant.",
          description: "Your command center is ready. Lead with intention, guide with care.",
        }
      case "submissive":
        return {
          title: "Welcome.",
          description: "Your service is acknowledged. Prepare to serve with devotion.",
        }
      case "switch":
        return {
          title: "Welcome.",
          description: "Navigate your dynamic with intention. Embrace both command and service.",
        }
      default:
        return {
          title: "Welcome to KINK IT",
          description: "Your dynamic management platform is ready.",
        }
    }
  }

  const roleMessage = getRoleMessage()

  return (
    <div className="space-y-6">
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <div className="relative">
            <Sparkles className="w-16 h-16 text-primary animate-pulse" />
            <CheckCircle2 className="w-8 h-8 text-green-500 absolute -bottom-1 -right-1 bg-background rounded-full" />
          </div>
        </div>
        <h2 className="text-3xl font-bold">{roleMessage.title}</h2>
        <p className="text-lg text-muted-foreground">{roleMessage.description}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Setup Complete</CardTitle>
          <CardDescription>Here's what we've configured for you:</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
              <div>
                <p className="font-medium">Profile Created</p>
                <p className="text-sm text-muted-foreground">
                  Your role: <span className="capitalize">{dynamicRole}</span>
                </p>
              </div>
            </div>

            {notionVerified && (
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                <div>
                  <p className="font-medium">Notion Integration</p>
                  <p className="text-sm text-muted-foreground">
                    Template verified and databases linked
                  </p>
                </div>
              </div>
            )}

            {initialData?.notion_api_key_added && (
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                <div>
                  <p className="font-medium">Notion API Key</p>
                  <p className="text-sm text-muted-foreground">
                    Enhanced integration enabled
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="pt-4 border-t">
            <h3 className="font-medium mb-2">What's Next?</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              {dynamicRole === "dominant" && (
                <>
                  <li>Assign your first task to your submissive</li>
                  <li>Create rules and protocols</li>
                  <li>Set up rewards and recognition</li>
                </>
              )}
              {dynamicRole === "submissive" && (
                <>
                  <li>View your assigned tasks</li>
                  <li>Update your submission state</li>
                  <li>Track your progress and points</li>
                </>
              )}
              {dynamicRole === "switch" && (
                <>
                  <li>Explore both dominant and submissive features</li>
                  <li>Set up your dynamic preferences</li>
                  <li>Connect with your partner</li>
                </>
              )}
            </ul>
          </div>

          <Button onClick={onComplete} className="w-full" size="lg">
            Enter Dashboard
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}




