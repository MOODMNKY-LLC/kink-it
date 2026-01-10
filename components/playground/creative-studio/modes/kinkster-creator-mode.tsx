"use client"

/**
 * KINKSTER Creator Mode
 * 
 * Character creation wizard integrated into the Creative Studio.
 * Wraps the existing KinksterCreationWizard component.
 */

import React, { Suspense } from "react"
import dynamic from "next/dynamic"
import { Loader2 } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"

// Dynamically import the wizard to reduce initial bundle
const KinksterCreationWizard = dynamic(
  () => import("@/components/kinksters/kinkster-creation-wizard"),
  {
    loading: () => (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-white/50" />
      </div>
    ),
    ssr: false,
  }
)

// ============================================================================
// Main Component
// ============================================================================

export function KinksterCreatorMode() {
  return (
    <ScrollArea className="h-full">
      <div className="container mx-auto max-w-4xl py-8 px-4">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-white">KINKSTER Creator</h2>
          <p className="text-white/60 mt-1">
            Create and manage your KINKSTER characters with custom AI-generated
            avatars
          </p>
        </div>

        <Suspense
          fallback={
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-white/50" />
            </div>
          }
        >
          <KinksterCreationWizard />
        </Suspense>
      </div>
    </ScrollArea>
  )
}

export default KinksterCreatorMode
