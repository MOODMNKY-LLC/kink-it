"use client"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { ExternalLink, Info, CheckCircle2 } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"

export function NotionSetupBanner() {
  const [hasNotionKey, setHasNotionKey] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/notion/check-config")
      .then((res) => res.json())
      .then((data) => {
        setHasNotionKey(data.configured)
        setLoading(false)
      })
      .catch(() => {
        setLoading(false)
      })
  }, [])

  if (loading) {
    return null
  }

  return (
    <Alert
      className={`mb-6 ${hasNotionKey ? "border-green-500/50 bg-green-500/10" : "border-blue-500/50 bg-blue-500/10"}`}
    >
      {hasNotionKey ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <Info className="h-4 w-4 text-blue-500" />}
      <AlertTitle className={hasNotionKey ? "text-green-500" : "text-blue-500"}>
        {hasNotionKey ? "Notion Integration Active" : "Notion Integration Available"}
      </AlertTitle>
      <AlertDescription className="mt-2 space-y-2">
        <p className="text-sm text-muted-foreground">
          {hasNotionKey
            ? "Your app ideas will sync to the App Ideas database in your KINK IT Notion workspace."
            : "Add your Notion API key to the Vars section to sync ideas to your KINK IT workspace. The key is already in your credentials database."}
        </p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/ENV_VARIABLES.md" target="_blank" className="gap-2">
              Setup Guide
              <ExternalLink className="h-3 w-3" />
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <a
              href="https://www.notion.so/cc491ef5f0a64eac8e05a6ea10dfb735"
              target="_blank"
              rel="noopener noreferrer"
              className="gap-2"
            >
              View Database
              <ExternalLink className="h-3 w-3" />
            </a>
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  )
}
