import Link from 'next/link'
import { Button } from '@/components/ui/button'
import MonkeyIcon from '@/components/icons/monkey'

export default function OfflinePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center bg-background">
      <div className="mb-8">
        <MonkeyIcon className="size-24 mx-auto text-primary opacity-50" />
      </div>
      <h1 className="text-4xl font-bold mb-4 font-display">You're Offline</h1>
      <p className="text-muted-foreground mb-8 max-w-md">
        It looks like you've lost your internet connection. Some features may be limited, but you can still access cached content.
      </p>
      <div className="flex flex-col sm:flex-row gap-4">
        <Button asChild size="lg" className="touch-target">
          <Link href="/">Go to Home</Link>
        </Button>
        <Button 
          variant="outline" 
          size="lg" 
          className="touch-target"
          onClick={() => window.location.reload()}
        >
          Try Again
        </Button>
      </div>
    </div>
  )
}

