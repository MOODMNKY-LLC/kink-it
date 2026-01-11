"use client"

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { KinkyErrorState } from '@/components/kinky/kinky-error-state'

export default function OfflinePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-background">
      <KinkyErrorState
        title="You're Offline"
        description="It looks like you've lost your internet connection. Some features may be limited, but you can still access cached content. I'll be here when you're back online."
        size="xl"
        actionLabel="Try Again"
        onAction={() => window.location.reload()}
      />
      <div className="mt-4">
        <Button asChild size="lg" className="touch-target">
          <Link href="/">Go to Home</Link>
        </Button>
      </div>
    </div>
  )
}
